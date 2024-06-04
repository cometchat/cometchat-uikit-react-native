package com.reactnativecometchatuikit;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ImageManager extends ReactContextBaseJavaModule {
    public static final String TAG = "ImageManager";

    ImageManager(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void openImage(String url, Callback callback) {
        try {
            Intent i = new Intent(getReactApplicationContext(), CometChatImageViewer.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.putExtra("imageUrl", url);
            getReactApplicationContext().startActivity(i);
        } catch (Exception ex) {
            Log.e(TAG, "openImage: " + ex.getMessage());
            callback.invoke("error:" + ex.getMessage());
            return;
        }
        callback.invoke("success");
    }

    @NonNull
    @Override
    public String getName() {
        return "ImageManager";
    }
}
