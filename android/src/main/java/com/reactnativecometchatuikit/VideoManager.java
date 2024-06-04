package com.reactnativecometchatuikit;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class VideoManager extends ReactContextBaseJavaModule {
    public static final String TAG = "VideoManager";

    VideoManager(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void openVideo(String url, Callback callback) {
        try {
            Intent i = new Intent(getReactApplicationContext(), CometChatVideoPlayer.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.putExtra("videoUrl", url);
            getReactApplicationContext().startActivity(i);
        } catch (Exception ex) {
            Log.e(TAG, "openVideo: " + ex.getMessage());
            callback.invoke("error:" + ex.getMessage());
            return;
        }
        callback.invoke("success");
    }

    @NonNull
    @Override
    public String getName() {
        return "VideoManager";
    }
}
