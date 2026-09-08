package com.reactnativecometchatuikit

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.PersistableBundle
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.io.File

class CometChatClipboardModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "CometChatClipboardModule"

  companion object {
    /**
     * ClipDescription extras key carrying the rich-text wire format alongside the plain text.
     * Other apps read `ClipData.Item.text` and only ever see the plain string, so `<color=…>`
     * markup can never leak out of CometChat — only our own editor reads this extra back.
     */
    const val EXTRA_RICH_TEXT = "com.cometchat.uikit.richtext"
  }

  /**
   * Copies [plain] to the system clipboard for everyone, and [wire] into the clip's extras so
   * our composer can restore inline colour when the paste lands back in CometChat.
   */
  @ReactMethod
  fun setRichText(plain: String, wire: String, promise: Promise) {
    try {
      val cm = reactApplicationContext
        .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      val clip = ClipData.newPlainText("CometChat", plain)
      // Only carry the extra when it actually differs — nothing to restore otherwise.
      if (wire != plain) {
        clip.description.extras = PersistableBundle().apply {
          putString(EXTRA_RICH_TEXT, wire)
        }
      }
      cm.setPrimaryClip(clip)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }

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
