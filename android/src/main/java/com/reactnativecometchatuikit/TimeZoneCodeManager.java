package com.reactnativecometchatuikit;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.TimeZone;

public class TimeZoneCodeManager extends ReactContextBaseJavaModule {
    public static final String TAG = "TimeZoneCodeManager";

    public TimeZoneCodeManager(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void getCurrentTimeZone(Callback callback) {
        try {
            // Get the current time zone ID
            String timeZoneID = TimeZone.getDefault().getID();
            // Invoke the callback with the time zone ID
            callback.invoke(timeZoneID);
        } catch (Exception e) {
            // Log the exception
            Log.e(TAG, "Error getting the time zone", e);
            // If there's an error, you may choose to invoke the callback with null or an error message
            callback.invoke((Object) null);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return TAG;
    }
}