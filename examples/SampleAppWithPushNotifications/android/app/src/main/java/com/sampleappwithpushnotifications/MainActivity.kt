package com.cometchat.sampleapp.reactnative.android
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import io.wazo.callkeep.RNCallKeepModule 

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
    // REQUIRED for react-native-screens
    super.onCreate(null)
  }


  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "sampleapp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<String>,
      grantResults: IntArray
  ) {
      super.onRequestPermissionsResult(requestCode, permissions, grantResults)
      if (requestCode == RNCallKeepModule.REQUEST_READ_PHONE_STATE) {
          RNCallKeepModule.onRequestPermissionsResult(requestCode, permissions, grantResults)
      }
  }
}
