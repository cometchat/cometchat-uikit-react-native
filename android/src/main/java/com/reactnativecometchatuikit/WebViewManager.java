package com.reactnativecometchatuikit;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class WebViewManager extends ReactContextBaseJavaModule {

    public static final String TAG = "WebViewManager";
    public static final String MODULE_NAME = "WebViewManager";

    public WebViewManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void openUrl(String url) {
        try {
            Intent i = new Intent(getReactApplicationContext(), CometChatWebView.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.putExtra("load_url", url);
            getReactApplicationContext().startActivity(i);
        } catch (Exception ex) {
            Log.e(TAG, ex.getMessage());
        }
    }
}
