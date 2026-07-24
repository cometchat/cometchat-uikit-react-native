package com.reactnativecometchatuikit

import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.io.File

class CometChatClipboardModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "CometChatClipboardModule"

  @ReactMethod
  fun hasImageInClipboard(promise: Promise) {
    val cm = reactApplicationContext
      .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = cm.primaryClip
    val hasUri = clip != null && (0 until clip.itemCount).any { i ->
      clip.getItemAt(i)?.uri != null
    }
    promise.resolve(hasUri)
  }

  @ReactMethod
  fun getClipboardImage(promise: Promise) {
    val cm = reactApplicationContext
      .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = cm.primaryClip
    if (clip == null || clip.itemCount == 0) { promise.resolve(null); return }
    val uri = clip.getItemAt(0)?.uri
    if (uri == null) { promise.resolve(null); return }
    try {
      val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
        ?: run { promise.resolve(null); return }
      val file = File(reactApplicationContext.cacheDir, "clipboard_paste.jpg")
      inputStream.use { it.copyTo(file.outputStream()) }
      val map = WritableNativeMap().apply {
        putString("uri", "file://${file.absolutePath}")
        putString("mimeType", "image/jpeg")
        putInt("size", file.length().toInt())
        putString("name", "clipboard_paste.jpg")
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }
}
