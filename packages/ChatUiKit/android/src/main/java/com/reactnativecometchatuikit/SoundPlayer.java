package com.reactnativecometchatuikit;

import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;

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

import java.io.IOException;

// NOTE: every MediaPlayer call below is wrapped so a bad player state can never crash the RN app.
// The player is a single shared instance (WhatsApp-style, one clip at a time), so with several audio
// cards mounted it can legitimately be null (create failed), released, reset(idle) or in an error
// state at the moment any method is called. android.media.MediaPlayer throws IllegalStateException
// (or NPE when null) for a method invoked in the wrong state — those are RuntimeExceptions that would
// otherwise red-screen. We catch broadly and degrade gracefully (no-op / report an error) instead.
public class SoundPlayer extends ReactContextBaseJavaModule {
    MediaPlayer mediaPlayer = null;
    JSONObject obj = new JSONObject();
    public static final String MODULE_NAME = "SoundPlayer";
    public static final String EVENT_NAME = "soundPlayStatus";
    private static String currentUrl = "";
    private static String prevUrl = "";
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

    @ReactMethod
    public void prepareMediaPlayer(String url, Callback resolve) {
        if (mediaPlayer == null)
            eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

        currentUrl = url;
        try {
            mediaPlayer = MediaPlayer.create(getReactApplicationContext(), Uri.parse(url));
            if (mediaPlayer == null)
                return;
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
            obj = new JSONObject();
            obj.put("duration", mediaPlayer.getDuration() / 1000);
        } catch (Exception e) {
            // create() / setAudioStreamType() / getDuration() in a bad state → don't crash.
            e.printStackTrace();
            return;
        }
        resolve.invoke(obj.toString());
    }

    @ReactMethod
    public void play(String url, Callback resolve) {
        if (!prevUrl.equals("")){
            this.stop();
            emitEvent("complete", prevUrl);
        }

        if (mediaPlayer == null)
            eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

        currentUrl = url;
        try {
            mediaPlayer = MediaPlayer.create(getReactApplicationContext(), Uri.parse(url));
            if (mediaPlayer == null) {
                // create() returns null for an unplayable/unavailable URI — tell JS instead of hanging.
                resolve.invoke("Error", "Unable to load audio");
                return;
            }

            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    emitEvent("complete", url);
                    if (prevUrl.equals(url)){
                        prevUrl = "";
                    }
                }
            });

            mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
            mediaPlayer.start();
            obj = new JSONObject();
            obj.put("success", true);
            int duration = mediaPlayer.getDuration();
            if (duration > -1) {
                duration = duration / 1000;
            }
            prevUrl = url;
            obj.put("duration", duration);
            obj.put("url", currentUrl);
            resolve.invoke(obj.toString());
        } catch (Exception ex) {
            // start()/getDuration() on a bad player state (IllegalStateException) or JSON error →
            // report it, never crash. resolve is invoked exactly once on every path.
            resolve.invoke("Error", ex.getMessage());
        }
    }

    @ReactMethod
    public void resume() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.start();
            }
        } catch (Exception e) {
            // start() on a released/error/idle player throws IllegalStateException — ignore.
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void playAt(int atTime, Callback resolve) {
        try {
            if (mediaPlayer == null) {
                resolve.invoke("Error", "MediaPlayer not prepared.");
                return;
            }
            mediaPlayer.seekTo(atTime * 1000);
        } catch (Exception e) {
            // seekTo() in an invalid state throws IllegalStateException — report, don't crash.
            resolve.invoke("Error", e.getMessage());
            return;
        }
        obj = new JSONObject();
        resolve.invoke(obj.toString());
    }

    @ReactMethod
    public void pause(Callback resolve) {
        if (mediaPlayer == null)
            return;
        try {
            mediaPlayer.pause();
            obj = new JSONObject();
            obj.put("success", true);
            resolve.invoke(obj.toString());
        } catch (Exception ex) {
            // pause() on a non-started player throws IllegalStateException — swallow, don't crash.
            resolve.invoke(obj.toString());
        }
    }

    @ReactMethod
    public void stop() {
        if(mediaPlayer == null)
           return;
        try {
            mediaPlayer.stop();
            mediaPlayer.reset();
        } catch (Exception e) {
            // stop() from Idle/Error state throws IllegalStateException — ignore, never crash.
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void releaseMediaPlayer() {
        if(mediaPlayer == null)
           return;
        try {
            mediaPlayer.release();
        } catch (Exception e) {
            e.printStackTrace();
        }
        // Null the reference so later calls (getPosition polls, another card's release) see a null
        // player and take the safe path instead of touching a released one (IllegalStateException).
        mediaPlayer = null;
    }

    @ReactMethod
    public void getPosition(Callback resolve) {
        obj = new JSONObject();
        try {
            // Guard: the shared MediaPlayer may be null (create failed) or released/reset by another
            // audio card between polls. getCurrentPosition() on a null/invalid player would throw an
            // uncaught NPE/IllegalStateException and red-screen the app — report 0 instead.
            int position = (mediaPlayer != null) ? mediaPlayer.getCurrentPosition() / 1000 : 0;
            obj.put("position", position);
        } catch (Exception e) {
            try { obj.put("position", 0); } catch (JSONException ignored) {}
        }
        resolve.invoke(obj.toString());
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }
}
