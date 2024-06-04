package com.reactnativecometchatuikit;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CometchatUiKitPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new CometchatUiKitModule(reactContext));
        modules.add(new CometChatSoundModule(reactContext));
        modules.add(new SoundPlayer(reactContext));
        modules.add(new FileManager(reactContext));
        modules.add(new ImageManager(reactContext));
        modules.add(new WebViewManager(reactContext));
        modules.add(new TimeZoneCodeManager(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(new ReactVideoViewManager());
    }
}
