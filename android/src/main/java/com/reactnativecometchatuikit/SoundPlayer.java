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

public class SoundPlayer extends ReactContextBaseJavaModule {
    MediaPlayer mediaPlayer = null;
    JSONObject obj = new JSONObject();
    public static final String MODULE_NAME = "SoundPlayer";
    public static final String EVENT_NAME = "soundPlayStatus";
    private static String currentUrl = "";
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
    public void play(String url, Callback resolve) {
        if (mediaPlayer == null)
            eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying())
                mediaPlayer.pause();
            emitEvent("paused", currentUrl);
        }
        currentUrl = url;
            mediaPlayer = MediaPlayer.create(getReactApplicationContext(), Uri.parse(url));
            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mediaPlayer) {
                        emitEvent("complete", url);
                }
            });

        mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);

        try {
            mediaPlayer.start();
            obj = new JSONObject();
            obj.put("success", true);
            int duration = mediaPlayer.getDuration();
            if (duration > -1) {
                duration = duration / 1000;
            }
            obj.put("duration", duration);
            resolve.invoke(obj.toString());
        } catch (JSONException ex) {
            resolve.invoke("Error", ex.getMessage());
        }
    }

    @ReactMethod
    public void resume() {
        if (mediaPlayer != null) {
            mediaPlayer.start();
        }
    }

    @ReactMethod
    public void playAt(int atTime, Callback resolve) {
        if (mediaPlayer != null) {
            mediaPlayer.seekTo(atTime * 1000);
            obj = new JSONObject();
            resolve.invoke(obj.toString());
        } else {
            resolve.invoke("Error", "MediaPlayer not prepared.");
        }
    }

    @ReactMethod
    public void pause(Callback resolve) {
        if (mediaPlayer != null) {
            mediaPlayer.pause();
            try {
                obj = new JSONObject();
                obj.put("success", true);
                resolve.invoke(obj.toString());
            } catch (JSONException ex) {
                resolve.invoke(obj.toString());
            }
        }
    }

    @ReactMethod
    public void stop() {
        mediaPlayer.stop();
        mediaPlayer.release();
        mediaPlayer.reset();
    }

    @ReactMethod
    public void getPosition(Callback resolve) {
        try {
            obj = new JSONObject();
            obj.put("position",mediaPlayer.getCurrentPosition());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        resolve.invoke(obj.toString());
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }
}