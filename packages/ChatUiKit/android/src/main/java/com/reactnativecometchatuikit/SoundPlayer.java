package com.reactnativecometchatuikit;

import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.HandlerThread;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// NOTE: every MediaPlayer call below is wrapped so a bad player state can never crash the RN app.
// The player is a single shared instance (WhatsApp-style, one clip at a time), so with several audio
// cards mounted it can legitimately be null (create failed), released, reset(idle) or in an error
// state at the moment any method is called. android.media.MediaPlayer throws IllegalStateException
// (or NPE when null) for a method invoked in the wrong state — those are RuntimeExceptions that would
// otherwise red-screen. We catch broadly and degrade gracefully (no-op / report an error) instead.
public class SoundPlayer extends ReactContextBaseJavaModule {
    public static final String MODULE_NAME = "SoundPlayer";
    public static final String EVENT_NAME = "soundPlayStatus";
    DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter = null;

    SoundPlayer(ReactApplicationContext context) {
        super(context);
    }

    private void emitEvent(String status, String forAudio) {
        WritableMap params = Arguments.createMap();
        params.putString("status", status);
        params.putString("url", forAudio);
        eventEmitter.emit(EVENT_NAME, params);
    }

    // Seconds. Browser-recorded WebM (the web UI Kit's voice notes) has no duration header, so
    // MediaPlayer reports 0/-1. Fall back to the timestamps in the file itself: the last cluster's
    // timecode plus its last block's offset. MediaExtractor isn't enough — some vendor extractors
    // (Xiaomi's MMParserExtractor) stop after the first cluster of a MediaRecorder WebM, so a 3 s
    // note came back as 0.24 s → 00:00.
    private static final int PROBE_TIMEOUT_MS = 10_000;
    private static final int PROBE_MAX_BYTES = 10 * 1024 * 1024; // ponytail: voice notes are KBs; bigger files skip the fallback
    // Keyed by the URL without its query: signed media URLs change their signature on every fetch.
    private static final Map<String, Integer> durationCache = new ConcurrentHashMap<>();
    // Probes (network + MediaPlayer.create) run here, never on the shared native-modules thread.
    private static final ExecutorService probes = Executors.newSingleThreadExecutor();

    private int durationSeconds(MediaPlayer mp, String url) {
        int ms = mp.getDuration();
        if (ms > 0) return ms / 1000;
        // Remote URLs only: a bare local path throws MalformedURLException below and returns 0, which
        // is fine because local recordings carry a real duration header.
        String key = url.split("\\?", 2)[0];
        Integer cached = durationCache.get(key);
        if (cached != null) return cached;
        try {
            URLConnection c = new URL(url).openConnection();
            c.setConnectTimeout(PROBE_TIMEOUT_MS);
            c.setReadTimeout(PROBE_TIMEOUT_MS);
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                for (int n; (n = in.read(buf)) > 0; ) {
                    bytes.write(buf, 0, n);
                    if (bytes.size() > PROBE_MAX_BYTES) return 0;
                }
                int seconds = (int) Math.round(webmDurationMs(bytes.toByteArray()) / 1000.0);
                if (seconds > 0) durationCache.put(key, seconds);
                return seconds;
            }
        } catch (Exception e) {
            return 0;
        }
    }

    // ponytail: walks clusters only and assumes the default 1 ms TimecodeScale, which is what
    // browser MediaRecorder writes. Parse TimecodeScale (0x2AD7B1) if another encoder needs it.
    static long webmDurationMs(byte[] d) {
        long end = 0;
        for (int i = 0; i + 4 <= d.length; i++) {
            if ((d[i] & 0xFF) != 0x1F || (d[i + 1] & 0xFF) != 0x43 || (d[i + 2] & 0xFF) != 0xB6 || (d[i + 3] & 0xFF) != 0x75) continue;
            int p = i + 4;
            p += vintLength(d, p); // cluster size, often "unknown" for MediaRecorder
            long clusterTc = 0;
            while (p < d.length) {
                int id = d[p] & 0xFF;
                if (id != 0xE7 && id != 0xA3 && id != 0xA0) break; // Timecode, SimpleBlock, BlockGroup
                int sizeLen = vintLength(d, p + 1);
                long size = vintValue(d, p + 1, sizeLen);
                int body = p + 1 + sizeLen;
                if (size < 0 || body + size > d.length) break;
                if (id == 0xE7) {
                    clusterTc = 0;
                    for (int k = 0; k < size; k++) clusterTc = (clusterTc << 8) | (d[body + k] & 0xFF);
                } else if (id == 0xA3) {
                    int tcAt = body + vintLength(d, body); // skip track number
                    short rel = (short) (((d[tcAt] & 0xFF) << 8) | (d[tcAt + 1] & 0xFF));
                    end = Math.max(end, clusterTc + rel);
                }
                p = (int) (body + size);
            }
            end = Math.max(end, clusterTc);
        }
        return end;
    }

    private static int vintLength(byte[] d, int p) {
        int first = d[p] & 0xFF;
        for (int len = 1; len <= 8; len++) if ((first & (0x80 >> (len - 1))) != 0) return len;
        return 8;
    }

    private static long vintValue(byte[] d, int p, int len) {
        long v = d[p] & (0xFF >> len);
        for (int k = 1; k < len; k++) v = (v << 8) | (d[p + k] & 0xFF);
        return v;
    }

    @ReactMethod
    public void prepareMediaPlayer(String url, Callback resolve) {
        eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        probes.execute(() -> {
            // Only reads the duration; playback uses its own ExoPlayer, so the probe is released here.
            MediaPlayer probe = null;
            try {
                probe = MediaPlayer.create(getReactApplicationContext(), Uri.parse(url));
                if (probe == null) return;
                JSONObject o = new JSONObject();
                o.put("duration", durationSeconds(probe, url));
                resolve.invoke(o.toString());
            } catch (Exception e) {
                // create() / getDuration() in a bad state → don't crash.
                e.printStackTrace();
            } finally {
                if (probe != null) probe.release();
            }
        });
    }

    // Playback runs on ExoPlayer, not MediaPlayer: MediaPlayer always goes through the device's
    // extractor, and some vendor ones (Xiaomi's MMParserExtractor) stop after the first cluster of
    // a browser WebM, so a web voice note played ~0.4 s and ended. ExoPlayer ships its own Matroska
    // extractor. It must be touched only on its looper thread, so every call below is posted there.
    private static HandlerThread exoThread;
    private static Handler exo;
    private ExoPlayer player = null;
    private String playingUrl = "";

    private void onExo(Runnable r) {
        if (exoThread == null) {
            exoThread = new HandlerThread("CometChatSoundPlayer");
            exoThread.start();
            exo = new Handler(exoThread.getLooper());
        }
        exo.post(() -> {
            try { r.run(); } catch (Exception e) { e.printStackTrace(); } // never crash the app
        });
    }

    private void releasePlayer() { // exo thread only
        if (player != null) { player.release(); player = null; }
    }

    @ReactMethod
    public void play(String url, Callback resolve) {
        eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        onExo(() -> {
            if (player != null && !playingUrl.isEmpty()) emitEvent("complete", playingUrl); // replaced clip
            releasePlayer();
            ExoPlayer p = new ExoPlayer.Builder(getReactApplicationContext()).setLooper(exoThread.getLooper()).build();
            p.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(), false);
            boolean[] answered = {false}; // a Callback may be invoked only once
            p.addListener(new Player.Listener() {
                @Override
                public void onPlaybackStateChanged(int state) {
                    if (state == Player.STATE_READY && !answered[0]) {
                        answered[0] = true;
                        try {
                            JSONObject o = new JSONObject();
                            o.put("success", true);
                            o.put("url", url);
                            resolve.invoke(o.toString());
                        } catch (JSONException e) {
                            resolve.invoke("Error", e.getMessage());
                        }
                    } else if (state == Player.STATE_ENDED) {
                        emitEvent("complete", url);
                        if (playingUrl.equals(url)) playingUrl = "";
                    }
                }

                @Override
                public void onPlayerError(@NonNull PlaybackException error) {
                    // 404, expired signed URL, unsupported file: free the player and reset the bubble.
                    if (!answered[0]) {
                        answered[0] = true;
                        resolve.invoke("Error", error.getMessage());
                    }
                    emitEvent("complete", url);
                    if (player == p) { releasePlayer(); playingUrl = ""; }
                }
            });
            p.setMediaItem(MediaItem.fromUri(url));
            p.prepare();
            p.play();
            player = p;
            playingUrl = url;
        });
    }

    @ReactMethod
    public void resume() {
        onExo(() -> { if (player != null) player.play(); });
    }

    @ReactMethod
    public void playAt(int atTime, Callback resolve) {
        onExo(() -> {
            if (player == null) { resolve.invoke("Error", "MediaPlayer not prepared."); return; }
            player.seekTo(atTime * 1000L);
            resolve.invoke(new JSONObject().toString());
        });
    }

    @ReactMethod
    public void pause(Callback resolve) {
        onExo(() -> {
            if (player == null) return;
            player.pause();
            try {
                JSONObject o = new JSONObject();
                o.put("success", true);
                resolve.invoke(o.toString());
            } catch (JSONException e) {
                resolve.invoke(new JSONObject().toString());
            }
        });
    }

    @ReactMethod
    public void stop() {
        onExo(() -> {
            if (!playingUrl.isEmpty()) emitEvent("complete", playingUrl);
            releasePlayer();
            playingUrl = "";
        });
    }

    @ReactMethod
    public void releaseMediaPlayer() {
        // Every audio card calls this on unmount, without saying which clip it is, so it must not
        // stop the shared ExoPlayer: scrolling another card out of view would cut the playing clip
        // and leave its card stuck on "playing". The duration probe releases itself, so there is
        // nothing left to free here. Kept for the JS API.
    }

    @ReactMethod
    public void getPosition(Callback resolve) {
        onExo(() -> {
            try {
                JSONObject o = new JSONObject();
                o.put("position", player != null ? player.getCurrentPosition() / 1000 : 0);
                resolve.invoke(o.toString());
            } catch (JSONException ignored) {}
        });
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }
}
