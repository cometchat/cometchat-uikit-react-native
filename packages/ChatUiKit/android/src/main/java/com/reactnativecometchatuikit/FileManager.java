package com.reactnativecometchatuikit;

import static android.os.Environment.DIRECTORY_DOCUMENTS;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;

public class FileManager extends ReactContextBaseJavaModule {
    public static final String NAME = "FileManager";
    private static String folderPath = "";
    public static final String TAG = "native_code";
    private Context mContext;
    private ReactApplicationContext mReactContext;
    private static final int READ_REQUEST_CODE = 100;
    private static final int CAPTURE_STILL_IMAGE = 101;
    private static final int REQUEST_LAUNCH_CAMERA = 1;
    private static final int READ_REQUEST_CODE_MULTI = 102;
    private static int IMAGE_QUALITY = 20;

    private Callback callback;
    private Callback multiCallback;

    private static final String FIELD_URI = "uri";
    private static final String FIELD_FILE_COPY_URI = "fileCopyUri";
    private static final String FIELD_COPY_ERROR = "copyError";
    private static final String FIELD_NAME = "name";
    private static final String FIELD_TYPE = "type";
    private static final String FIELD_SIZE = "size";
    private File cameraFile;
    private JSONObject obj = new JSONObject();
    private static String currentUrl = "";
    DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter = null;

    // Update the BroadcastReceiver to send the download completion event
    private final BroadcastReceiver onDownloadComplete = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);

            // Create a WritableMap to pass additional information if necessary
            WritableMap params = Arguments.createMap();
            params.putString("message", "Download complete");
            params.putString("downloadId", String.valueOf(id));  // Send file name as part of event

            // Send the event to React Native
            eventEmitter.emit("downloadComplete", params);

            // Optionally, unregister the receiver
            context.unregisterReceiver(this);
        }
    };

    FileManager(ReactApplicationContext context) {
        super(context);
        mContext = context.getApplicationContext();
        mReactContext = context;
        folderPath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getPath();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        } else {
            context.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }
        context.addActivityEventListener(activityEventListener);
    }

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == READ_REQUEST_CODE_MULTI) {
                if (multiCallback != null) onShowActivityResultMulti(resultCode, data, multiCallback);
                return;
            }
            if (callback == null) {
                Log.e(NAME, "callback was null in onActivityResult");
                return;
            }
            if (requestCode == READ_REQUEST_CODE) {
                onShowActivityResult(resultCode, data, callback);
            }
            if (requestCode == CAPTURE_STILL_IMAGE) {
                saveImageFromCameraAndReturn(resultCode, data, callback);
            }
            if (requestCode == REQUEST_LAUNCH_CAMERA) {
                if (resultCode == Activity.RESULT_OK) {
                    if (cameraFile != null && cameraFile.exists()) {
                        // Compress the image
                        try {
                            Bitmap bitmap = BitmapFactory.decodeFile(cameraFile.getAbsolutePath());
                            ExifInterface exif = new ExifInterface(cameraFile.getAbsolutePath());
                            int orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                            Log.i(TAG, "onActivityResult: orientation" + orientation);
                            int rotationAngle = 0;
                            if (orientation == ExifInterface.ORIENTATION_ROTATE_90) {
                                rotationAngle = 90;
                            }
                            else if (orientation == ExifInterface.ORIENTATION_ROTATE_180) {
                                rotationAngle = 180;
                            }
                            else if (orientation == ExifInterface.ORIENTATION_ROTATE_270) {
                                rotationAngle = 270;
                            }

                            // Create a new matrix for rotation
                            Matrix matrix = new Matrix();
                            if (rotationAngle != 0) {
                                matrix.setRotate(rotationAngle);
                                // Rotate the bitmap
                                bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                            }
                            FileOutputStream out = new FileOutputStream(cameraFile);

                            // The quality parameter can be adjusted to decrease image quality (100 means no compression)
                            bitmap.compress(Bitmap.CompressFormat.JPEG, IMAGE_QUALITY, out); // Compress to 50% quality
                            out.flush();
                            out.close();
                            bitmap.recycle();
                        } catch (Exception e) {
                            WritableMap errorMap = new WritableNativeMap();
                            errorMap.putString("error", "Image compression error: " + e.getMessage());
                            callback.invoke(errorMap);
                            return;
                        }

                        // Prepare the image details to return to React Native
                        WritableMap imageMap = new WritableNativeMap();
                        Uri fileUri = Uri.fromFile(cameraFile);
                        imageMap.putString("uri", fileUri.toString());
                        imageMap.putString("path", cameraFile.getAbsolutePath());
                        imageMap.putDouble("size", cameraFile.length());
                        imageMap.putString("name", cameraFile.getName());
                        String fileExtension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString());
                        String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(fileExtension.toLowerCase());
                        imageMap.putString("type", mimeType != null ? mimeType : "image/jpeg");

                        callback.invoke(imageMap);
                    } else {
                        WritableMap errorMap = new WritableNativeMap();
                        errorMap.putString("error", "Image file does not exist.");
                        callback.invoke(errorMap);
                    }
                } else {
                    WritableMap errorMap = new WritableNativeMap();
                    errorMap.putString("error", "Camera activity did not return RESULT_OK.");
                    callback.invoke(errorMap);
                }
            }
        }

        private void saveImageFromCameraAndReturn(int resultCode, Intent data, Callback callback) {
            try {
                if (resultCode == Activity.RESULT_OK) {
                    Bitmap photo = (Bitmap) data.getExtras().get("data");
                    File cacheDir = mContext.getExternalCacheDir();
                    File imageFile = new File(cacheDir, UUID.randomUUID().toString()+".jpeg");
                    OutputStream outputStream = new FileOutputStream(imageFile);
                    photo.compress(Bitmap.CompressFormat.JPEG, 100, outputStream);
                    ExecutorService service = Executors.newSingleThreadExecutor();
                    Handler handler = new Handler(Looper.getMainLooper());
                    service.execute(new Runnable() {
                        @Override
                        public void run() {
                            WritableMap map = getMetadataForCameraImage(Uri.fromFile(imageFile));
                            callback.invoke(map);
                        }
                    });
                }
            } catch (Exception ex) {
                callback.invoke("");
            }
        }
        private WritableMap getMetadataForCameraImage(Uri uri) {
            Context context = mContext;
            if (context == null) {
                return Arguments.createMap();
            }
            ContentResolver contentResolver = context.getContentResolver();
            WritableMap map = Arguments.createMap();
            map.putString(FIELD_URI, uri.toString());
            map.putString(FIELD_TYPE, "image/*");
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String imageFileName = "JPEG_" + timeStamp + "_";
            map.putString(FIELD_NAME, imageFileName+".jpeg");
            prepareFileUri(context, map, uri);
            return map;
        }

        private WritableMap getMetadata(Uri uri) {
            Context context = mContext;
            if (context == null) {
                return Arguments.createMap();
            }
            ContentResolver contentResolver = context.getContentResolver();
            WritableMap map = Arguments.createMap();
            map.putString(FIELD_URI, uri.toString());
            map.putString(FIELD_TYPE, contentResolver.getType(uri));
            try (Cursor cursor = contentResolver.query(uri, null, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int displayNameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (!cursor.isNull(displayNameIndex)) {
                        String fileName = cursor.getString(displayNameIndex);
                        map.putString(FIELD_NAME, fileName);
                    } else {
                        map.putNull(FIELD_NAME);
                    }
                    int mimeIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE);
                    if (!cursor.isNull(mimeIndex)) {
                        map.putString(FIELD_TYPE, cursor.getString(mimeIndex));
                    }
                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (cursor.isNull(sizeIndex)) {
                        map.putNull(FIELD_SIZE);
                    } else {
                        map.putDouble(FIELD_SIZE, cursor.getLong(sizeIndex));
                    }
                }
            }

            prepareFileUri(context, map, uri);
            return map;
        }

        private void prepareFileUri(Context context, WritableMap map, Uri uri) {
            copyFileToLocalStorage(context, map, uri);
        }

        private void copyFileToLocalStorage(Context context, WritableMap map, Uri uri) {
            File dir = context.getExternalCacheDir();
            // we don't want to rename the file so we put it into a unique location
            dir = new File(dir, UUID.randomUUID().toString());
            try {
                boolean didCreateDir = dir.mkdir();
                if (!didCreateDir) {
                    throw new IOException("failed to create directory at " + dir.getAbsolutePath());
                }
                String fileName = map.getString(FIELD_NAME);
                if (fileName == null) {
                    fileName = String.valueOf(System.currentTimeMillis());
                }
                File destFile = new File(dir, fileName);
                Uri copyPath = copyFile(context, uri, destFile);
                map.putString(FIELD_FILE_COPY_URI, copyPath.toString());
            } catch (Exception e) {
                e.printStackTrace();
                map.putNull(FIELD_FILE_COPY_URI);
                map.putString(FIELD_COPY_ERROR, e.getLocalizedMessage());
            }
        }

        public Uri copyFile(Context context, Uri uri, File destFile) throws Exception {
            InputStream inputStream = context.getContentResolver().openInputStream(uri);
            FileOutputStream outputStream = new FileOutputStream(destFile);
            byte[] buf = new byte[8192];
            int len;
            while ((len = inputStream.read(buf)) > 0) {
                outputStream.write(buf, 0, len);
            }
            return Uri.fromFile(destFile);
        }

        private void onShowActivityResultMulti(int resultCode, Intent data, Callback storedCallback) {
            if (resultCode != Activity.RESULT_OK) return;
            List<Uri> uris = new ArrayList<>();
            if (data != null) {
                ClipData clipData = data.getClipData();
                if (clipData != null && clipData.getItemCount() > 0) {
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        uris.add(clipData.getItemAt(i).getUri());
                    }
                } else if (data.getData() != null) {
                    uris.add(data.getData());
                }
            }
            if (uris.isEmpty()) return;
            ExecutorService service = Executors.newSingleThreadExecutor();
            service.execute(new Runnable() {
                @Override
                public void run() {
                    WritableArray array = Arguments.createArray();
                    for (Uri uri : uris) {
                        array.pushMap(getMetadata(uri));
                    }
                    storedCallback.invoke(array);
                }
            });
        }

        private void onShowActivityResult(int resultCode, Intent data, Callback storedPromise) {
            if (resultCode == Activity.RESULT_OK) {
                Uri uri = null;
                ClipData clipData = null;

                if (data != null) {
                    uri = data.getData();
                    clipData = data.getClipData();
                }

                try {
                    List<Uri> uris = new ArrayList<>();

                    if (clipData != null && clipData.getItemCount() > 0) {
                        final int length = clipData.getItemCount();
                        for (int i = 0; i < length; ++i) {
                            ClipData.Item item = clipData.getItemAt(i);
                            uris.add(item.getUri());
                        }
                    } else if (uri != null) {
                        uris.add(uri);
                    } else {
                        Log.e(TAG, "onShowActivityResult: invalid data returned" );
                        return;
                    }
                    ExecutorService service = Executors.newSingleThreadExecutor();
                    Handler handler = new Handler(Looper.getMainLooper());
                    service.execute(new Runnable() {
                        @Override
                        public void run() {
                            WritableMap map = getMetadata(uris.get(0));
                            callback.invoke(map);
                        }
                    });
                } catch (Exception e) {
                }
            }
        }
    };

    BroadcastReceiver onComplete=new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            Toast.makeText(context, "Download complete", Toast.LENGTH_SHORT).show();
        }
    };

    private String getType(String type) {
        switch (type) {
            case "image":
                return "image/*";
            case "video":
                return  "video/*";
            case "file":
                return  "*/*";
            case "audio":
                return "audio/*";
            default:
                return "";
        }
    }

    @ReactMethod
    public void shareMessage(ReadableMap readableMap, Callback callback){

        String messageType = readableMap.getString("type");
        String message = readableMap.getString("message");
        String mediaName = readableMap.getString("mediaName");
        String fileUrl = readableMap.getString("fileUrl");
        String mimeType = readableMap.getString("mimeType");

        if (getCurrentActivity() != null) {
            if (messageType.equals("text")) {
                Intent shareIntent = new Intent();
                shareIntent.setAction(Intent.ACTION_SEND);
                shareIntent.putExtra(Intent.EXTRA_TITLE, "");
                shareIntent.putExtra(Intent.EXTRA_TEXT, message);
                shareIntent.setType("text/plain");
                Intent intent = Intent.createChooser(shareIntent, "Share Message");
                getCurrentActivity().startActivity(intent);

                callback.invoke("{\"success\": true}");
            } else {
                downloadFileInNewThread(getCurrentActivity(), fileUrl, mediaName, mimeType);
                callback.invoke("{\"success\": true}");
            }
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No current activity\"}");
        }
    }

    public static void downloadFileInNewThread(Context context, String fileUrl, String fileName, String mimeType) {
        File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), fileName);
        Thread downloadThread = new Thread(() -> {
            try {
                if (!file.exists()) {
                    URL url = new URL(fileUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.connect();

                    if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        handleDownloadFailure(context);
                        return;
                    }

                    InputStream input = connection.getInputStream();

                    FileOutputStream output = new FileOutputStream(file);

                    byte[] buffer = new byte[4096];
                    int bytesRead;

                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }

                    output.flush();
                    output.close();
                    input.close();

                    handleDownloadSuccess(context, mimeType, file);
                } else {
                    handleDownloadSuccess(context, mimeType, file);
                }
            } catch (Exception e) {
                Log.e("DownloadThread", "Error downloading file: " + e.getMessage());
                handleDownloadFailure(context);
            }
        });
        downloadThread.start();
    }

    private static void handleDownloadSuccess(Context context, String mimeType, final File file) {
        ((Activity) context).runOnUiThread(() -> {
            shareFile(mimeType, context, file);
        });
    }

    private static void handleDownloadFailure(Context context) {
        ((Activity) context).runOnUiThread(() -> {
            // File download failed
            // Handle the failure scenario
            Toast.makeText(context, "File download failed.", Toast.LENGTH_SHORT).show();
        });
    }

    private static void shareFile(String mimeType, Context context, File file) {
        try {
            Intent shareIntent = new Intent();
            shareIntent.setAction(Intent.ACTION_SEND);
            shareIntent.putExtra(Intent.EXTRA_STREAM, FileProvider.getUriForFile(context, context.getApplicationContext().getPackageName() + ".fileprovider", file));
            shareIntent.setType(mimeType);
            Intent intent = Intent.createChooser(shareIntent, "Share Message");
            context.startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(context, "Error" + ":" + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private MediaRecorder audioRecorder;
    private MediaPlayer audioPlayer;
    private String fileName;
    private Context context;
    private Activity activity;
    private Handler amplitudeHandler;
    private Runnable amplitudeRunnable;
    private boolean isAmplitudePolling = false;
    
    // Segment-based recording fields
    private List<String> segmentPaths = new ArrayList<>();
    private int currentSegmentIndex = 0;

    private void startAmplitudePolling() {
        if (amplitudeHandler == null) {
            amplitudeHandler = new Handler(Looper.getMainLooper());
        }
        isAmplitudePolling = true;
        amplitudeRunnable = new Runnable() {
            @Override
            public void run() {
                if (audioRecorder != null && isAmplitudePolling) {
                    try {
                        int maxAmplitude = audioRecorder.getMaxAmplitude();
                        // Normalize to 0.0-1.0 range (max amplitude is ~32767)
                        double normalizedAmplitude = Math.min(1.0, maxAmplitude / 32767.0);
                        
                        // Send event to React Native
                        if (eventEmitter == null) {
                            eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                        }
                        WritableMap params = Arguments.createMap();
                        params.putDouble("amplitude", normalizedAmplitude);
                        eventEmitter.emit("audioAmplitude", params);
                    } catch (Exception e) {
                        Log.e(TAG, "Error getting amplitude: " + e.getMessage());
                    }
                    amplitudeHandler.postDelayed(this, 100); // Poll every 100ms
                }
            }
        };
        amplitudeHandler.post(amplitudeRunnable);
    }

    private void stopAmplitudePolling() {
        isAmplitudePolling = false;
        if (amplitudeHandler != null && amplitudeRunnable != null) {
            amplitudeHandler.removeCallbacks(amplitudeRunnable);
        }
    }

    @ReactMethod
    public void startRecording(final Callback callback) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
        callback.invoke("{\"success\": false, \"error\": \"E_NO_ACTIVITY\"}");
        return;
    }

    // You already check permission in JS for Android. Still be safe:
    if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
        callback.invoke("{\"granted\": false}");
        return;
    }

    try {
        // App-scoped external dir (no WRITE permission needed)
        File dir = activity.getExternalFilesDir(Environment.DIRECTORY_MUSIC);
        if (dir == null) {
        callback.invoke("{\"success\": false, \"error\": \"E_NO_DIR\"}");
        return;
        }
        String ts = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        fileName = new File(dir, "audio-recording-" + ts + ".m4a").getAbsolutePath();

        audioRecorder = new MediaRecorder();
        audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
        audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
        audioRecorder.setAudioEncodingBitRate(128000);
        audioRecorder.setAudioSamplingRate(44100);
        audioRecorder.setOutputFile(fileName);

        // Keep screen on during recording to prevent device sleep
        // Set BEFORE starting recorder to avoid race with auto-lock
        activity.runOnUiThread(() -> {
            activity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });

        audioRecorder.prepare();
        audioRecorder.start();
        
        // Start amplitude polling for real-time waveform
        startAmplitudePolling();

        // Your JS just needs a callback to move to "recording"
        callback.invoke("{\"success\": true}");
    } catch (Exception e) {
        try { if (audioRecorder != null) audioRecorder.release(); } catch (Exception ignore) {}
        audioRecorder = null;
        stopAmplitudePolling();
        // Clear the keep-screen-on flag since recording failed
        activity.runOnUiThread(() -> {
            activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
        callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
    }
    }

    private void requestPermissions() {
        if (ContextCompat.checkSelfPermission(getCurrentActivity(), android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            Log.e("AudioRecorder", "in requestPermissions permission not granted for audio recording so request permission");
            ActivityCompat.requestPermissions(activity, new String[]{android.Manifest.permission.RECORD_AUDIO}, 101);
        }
    }

    private boolean checkPermissions() {
        int audioRecordAccess = ContextCompat.checkSelfPermission(getCurrentActivity(), android.Manifest.permission.RECORD_AUDIO);
        return audioRecordAccess == PackageManager.PERMISSION_GRANTED;
    }

    @ReactMethod
    public void playAudio(Callback callback) {
        // Check if fileName is valid
        if (fileName == null || fileName.isEmpty()) {
            Log.e("TAG", "playAudio: fileName is null or empty");
            callback.invoke("{\"success\": false, \"error\": \"No audio file to play\"}");
            return;
        }
        
        // Stop any existing playback
        if (audioPlayer != null) {
            try {
                if (audioPlayer.isPlaying()) audioPlayer.stop();
                audioPlayer.release();
            } catch (Exception ignore) {}
            audioPlayer = null;
        }
        
        audioPlayer = new MediaPlayer();
        try {
            String playPath = fileName;
            
            // Handle content:// URIs
            if (playPath.startsWith("content://")) {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    Log.e("TAG", "Playing Audio with content URI: " + playPath);
                    audioPlayer.setDataSource(activity, Uri.parse(playPath));
                } else {
                    // Fallback: try to extract file path from content URI
                    String[] parts = playPath.split("/external_files");
                    if (parts.length > 1) {
                        playPath = "/storage/emulated/0" + parts[1];
                        Log.e("TAG", "Converted to file path: " + playPath);
                        audioPlayer.setDataSource(playPath);
                    } else {
                        throw new IOException("Cannot resolve content URI without activity");
                    }
                }
            } else {
                // Handle file:// URIs
                if (playPath.startsWith("file://")) {
                    playPath = playPath.substring(7);
                }
                Log.e("TAG", "Playing Audio: " + playPath);
                audioPlayer.setDataSource(playPath);
            }
            
            // Set up completion listener to emit event when playback finishes
            audioPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    // Emit playback complete event to JS
                    if (eventEmitter == null) {
                        eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                    }
                    WritableMap params = Arguments.createMap();
                    params.putString("state", "playbackComplete");
                    eventEmitter.emit("status", params);
                }
            });
            
            audioPlayer.prepare();
            audioPlayer.start();
            Log.e("TAG", "Audio playback started");
            
            // Build response with file URI
            String fileUri = fileName;
            Activity activity = getCurrentActivity();
            if (activity != null && !fileName.startsWith("content://")) {
                try {
                    Uri contentUri = FileProvider.getUriForFile(
                        activity, 
                        activity.getApplicationContext().getPackageName() + ".fileprovider", 
                        new File(fileName));
                    fileUri = contentUri.toString();
                } catch (Exception e) {
                    Log.e("TAG", "FileProvider error: " + e.getMessage());
                    fileUri = "file://" + fileName;
                }
            }
            
            callback.invoke("{\"success\": true, \"file\": \"" + fileUri + "\"}");
        } catch (IOException e) {
            Log.e("TAG", "prepare() failed: " + e.getMessage());
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            Log.e("TAG", "playAudio error: " + e.getMessage());
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @ReactMethod
    public void pauseRecording(Promise promise) {
        if (audioRecorder != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    audioRecorder.pause();
                    stopAmplitudePolling();
                    promise.resolve("Recording paused successfully");
                } catch (Exception e) {
                    promise.resolve("Failed to pause recording");
                }
            } else {
                // Pause is not supported before API 24
                promise.resolve("Pause not supported on this device");
            }
        } else {
            promise.resolve("No audio recorder initialized");
        }
    }

    @ReactMethod
    public void resumeRecording(Promise promise) {
        if (audioRecorder != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    audioRecorder.resume();
                    startAmplitudePolling();
                    promise.resolve("Recording resumed successfully");
                } catch (Exception e) {
                    promise.resolve("Failed to pause recording");
                }
            } else {
                // Pause is not supported before API 24
                promise.resolve("Resume not supported on this device");
            }
        } else {
            promise.resolve("No audio recorder initialized");
        }
    }

    @ReactMethod
    public void pausePlaying(Callback callback) {
        if (audioPlayer != null && audioPlayer.isPlaying()) {
            Log.e("TAG", "Trying to pause Audio: " + fileName);
            audioPlayer.pause();
            
            // Get current position for accurate resume
            int currentPosition = audioPlayer.getCurrentPosition();
            
            // Build response with file URI and position
            String fileUri = fileName != null ? fileName : "";
            Activity activity = getCurrentActivity();
            if (activity != null && fileName != null) {
                try {
                    Uri contentUri = FileProvider.getUriForFile(
                        activity, 
                        activity.getApplicationContext().getPackageName() + ".fileprovider", 
                        new File(fileName));
                    fileUri = contentUri.toString();
                } catch (Exception e) {
                    Log.e("TAG", "FileProvider error: " + e.getMessage());
                    fileUri = "file://" + fileName;
                }
            }
            
            callback.invoke("{\"success\": true, \"file\": \"" + fileUri + "\", \"position\": " + currentPosition + "}");
            Log.e("TAG", "Paused Audio at position: " + currentPosition);
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No audio playing\"}");
        }
    }

    /**
     * Resume playback from the current paused position.
     * This is instant since the MediaPlayer is already prepared.
     */
    @ReactMethod
    public void resumePlaying(Callback callback) {
        if (audioPlayer != null) {
            try {
                // Check if already playing
                if (audioPlayer.isPlaying()) {
                    callback.invoke("{\"success\": true, \"message\": \"Already playing\"}");
                    return;
                }
                
                // Get current position before resuming
                int currentPosition = audioPlayer.getCurrentPosition();
                
                // Resume playback - this is instant since player is already prepared
                audioPlayer.start();
                Log.e("TAG", "Resumed Audio from position: " + currentPosition);
                
                // Build response with file URI and position
                String fileUri = fileName != null ? fileName : "";
                Activity activity = getCurrentActivity();
                if (activity != null && fileName != null) {
                    try {
                        Uri contentUri = FileProvider.getUriForFile(
                            activity, 
                            activity.getApplicationContext().getPackageName() + ".fileprovider", 
                            new File(fileName));
                        fileUri = contentUri.toString();
                    } catch (Exception e) {
                        Log.e("TAG", "FileProvider error: " + e.getMessage());
                        fileUri = "file://" + fileName;
                    }
                }
                
                callback.invoke("{\"success\": true, \"file\": \"" + fileUri + "\", \"position\": " + currentPosition + "}");
            } catch (Exception e) {
                Log.e("TAG", "resumePlaying error: " + e.getMessage());
                callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            }
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No audio player initialized\"}");
        }
    }

    @ReactMethod
    private void stopPlaying(Callback callback) {
        if (audioPlayer != null) {
            try {
                audioPlayer.stop();
            } catch (Exception ignore) {}
            try {
                audioPlayer.release();
            } catch (Exception ignore) {}
            audioPlayer = null;
            
            // Build response with file URI
            String fileUri = fileName != null ? fileName : "";
            Activity activity = getCurrentActivity();
            if (activity != null && fileName != null) {
                try {
                    Uri contentUri = FileProvider.getUriForFile(
                        activity, 
                        activity.getApplicationContext().getPackageName() + ".fileprovider", 
                        new File(fileName));
                    fileUri = contentUri.toString();
                } catch (Exception e) {
                    Log.e("TAG", "FileProvider error: " + e.getMessage());
                    fileUri = "file://" + fileName;
                }
            }
            
            callback.invoke("{\"success\": true, \"file\": \"" + fileUri + "\"}");
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No audio player\"}");
        }
    }

    @ReactMethod
    public void releaseMediaResources(final Callback callback) {
    // Stop amplitude polling
    stopAmplitudePolling();
    
    // Stop active recording
    if (audioRecorder != null) {
        try {
        audioRecorder.stop();
        } catch (Exception ignored) {
        // ignore IllegalStateException if already stopped
        }
        try { audioRecorder.release(); } catch (Exception ignore) {}
        audioRecorder = null;
    }

    // Re-enable screen sleep since recording has stopped
    Activity activity = getCurrentActivity();
    if (activity != null) {
        activity.runOnUiThread(() -> {
            activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }

    // Stop any playback
    if (audioPlayer != null) {
        try {
        if (audioPlayer.isPlaying()) audioPlayer.stop();
        } catch (Exception ignore) {}
        try { audioPlayer.release(); } catch (Exception ignore) {}
        audioPlayer = null;
    }

    // Build result JSON your JS expects: it parses .file (Android) and .duration (iOS use-case)
    try {
        JSONObject res = new JSONObject();

        if (fileName != null) {
        res.put("path", fileName);
        if (activity != null) {
            Uri contentUri = FileProvider.getUriForFile(
            activity, activity.getPackageName() + ".fileprovider", new File(fileName));
            res.put("file", contentUri.toString()); // your JS uses this
        } else {
            res.put("file", "file://" + fileName);
        }
        } else {
        res.put("file", JSONObject.NULL);
        res.put("path", JSONObject.NULL);
        }

        // Android side: your JS ignores duration (it computes via timer)
        res.put("duration", 0);

        callback.invoke(res.toString());
    } catch (Exception e) {
        callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
    }
    }

    @ReactMethod
    public void deleteFile(Callback callback) {
        if (fileName == null) {
            callback.invoke("{\"success\": false}");
        } else {
            try {
                File file = new File(fileName);
                boolean isDeleted = file.delete();
                callback.invoke("{\"success\": " + isDeleted +"}");
            } catch (Exception e) {
                callback.invoke("{\"success\": false}");
            }
        }
    }

    // ==================== Segment-Based Recording Methods ====================

    /**
     * Finalize the current recording segment without stopping the recorder.
     * This allows the user to preview the recorded audio while paused.
     * @validates Requirements 11.1
     */
    @ReactMethod
    public void finalizeSegment(Callback callback) {
        stopAmplitudePolling();
        
        if (audioRecorder == null) {
            callback.invoke("{\"success\": false, \"error\": \"No active recording\"}");
            return;
        }
        
        try {
            audioRecorder.stop();
            audioRecorder.release();
            audioRecorder = null;
            
            // Add current file to segments (store the actual file path, not content URI)
            if (fileName != null) {
                segmentPaths.add(fileName);
            }
            
            // Return the file path (not content URI) so JS can use it for playback
            String jsonString = String.format(
                "{\"success\": true, \"segmentPath\": \"%s\", \"duration\": 0, \"segmentIndex\": %d}",
                fileName,
                segmentPaths.size() - 1
            );
            callback.invoke(jsonString);
        } catch (Exception e) {
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Start recording a new segment after pausing.
     * This creates a new audio file for the next segment.
     * @validates Requirements 11.2
     */
    @ReactMethod
    public void startNewSegment(Callback callback) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            callback.invoke("{\"success\": false, \"error\": \"E_NO_ACTIVITY\"}");
            return;
        }

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            callback.invoke("{\"granted\": false}");
            return;
        }

        try {
            // Create new file for this segment
            File dir = activity.getExternalFilesDir(Environment.DIRECTORY_MUSIC);
            if (dir == null) {
                callback.invoke("{\"success\": false, \"error\": \"E_NO_DIR\"}");
                return;
            }
            String ts = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
            fileName = new File(dir, "audio-segment-" + ts + "-" + segmentPaths.size() + ".m4a").getAbsolutePath();

            audioRecorder = new MediaRecorder();
            audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            audioRecorder.setAudioEncodingBitRate(128000);
            audioRecorder.setAudioSamplingRate(44100);
            audioRecorder.setOutputFile(fileName);

            audioRecorder.prepare();
            audioRecorder.start();
            
            // Start amplitude polling for real-time waveform
            startAmplitudePolling();

            String jsonString = String.format(
                "{\"success\": true, \"file\": \"%s\", \"segmentIndex\": %d}",
                fileName,
                segmentPaths.size()
            );
            callback.invoke(jsonString);
        } catch (Exception e) {
            try { if (audioRecorder != null) audioRecorder.release(); } catch (Exception ignore) {}
            audioRecorder = null;
            stopAmplitudePolling();
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Merge all recorded segments into a single audio file.
     * Uses simple concatenation for M4A files.
     * @validates Requirements 11.4
     */
    @ReactMethod
    public void mergeSegments(ReadableArray segmentPathsArray, Callback callback) {
        if (segmentPathsArray == null || segmentPathsArray.size() == 0) {
            callback.invoke("{\"success\": false, \"error\": \"No segments to merge\"}");
            return;
        }

        // Convert ReadableArray to List
        List<String> paths = new ArrayList<>();
        for (int i = 0; i < segmentPathsArray.size(); i++) {
            paths.add(segmentPathsArray.getString(i));
        }

        // If only one segment, just return it and update fileName
        if (paths.size() == 1) {
            String segmentPath = paths.get(0);
            // Handle content:// URIs - convert to file path
            if (segmentPath.startsWith("content://")) {
                String[] parts = segmentPath.split("/external_files");
                if (parts.length > 1) {
                    segmentPath = "/storage/emulated/0" + parts[1];
                }
            } else if (segmentPath.startsWith("file://")) {
                segmentPath = segmentPath.substring(7);
            }
            
            // Update fileName so playAudio uses this file
            fileName = segmentPath;
            
            Activity activity = getCurrentActivity();
            String fileUri = segmentPath;
            if (activity != null) {
                try {
                    Uri contentUri = FileProvider.getUriForFile(
                        activity, activity.getPackageName() + ".fileprovider", new File(segmentPath));
                    fileUri = contentUri.toString();
                } catch (Exception e) {
                    // Use original path if FileProvider fails
                    fileUri = "file://" + segmentPath;
                }
            }
            callback.invoke(String.format("{\"success\": true, \"mergedPath\": \"%s\", \"totalDuration\": 0}", fileUri));
            return;
        }

        // Merge segments in background thread using MediaExtractor/MediaMuxer
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                Activity activity = getCurrentActivity();
                if (activity == null) {
                    new Handler(Looper.getMainLooper()).post(() -> 
                        callback.invoke("{\"success\": false, \"error\": \"No activity\"}"));
                    return;
                }

                // Create output file
                File dir = activity.getExternalFilesDir(Environment.DIRECTORY_MUSIC);
                String ts = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
                String mergedPath = new File(dir, "audio-merged-" + ts + ".m4a").getAbsolutePath();

                // Use MediaMuxer for proper AAC/M4A merging
                android.media.MediaMuxer muxer = new android.media.MediaMuxer(mergedPath, android.media.MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
                int audioTrackIndex = -1;
                boolean muxerStarted = false;
                long totalDurationUs = 0;
                
                for (String path : paths) {
                    // Handle content:// URIs and file:// URIs
                    String actualPath = path;
                    if (path.startsWith("content://")) {
                        String[] parts = path.split("/external_files");
                        if (parts.length > 1) {
                            actualPath = "/storage/emulated/0" + parts[1];
                        } else {
                            Log.e(TAG, "Cannot resolve content URI: " + path);
                            continue;
                        }
                    }
                    if (actualPath.startsWith("file://")) {
                        actualPath = actualPath.substring(7);
                    }
                    
                    File segmentFile = new File(actualPath);
                    if (!segmentFile.exists()) {
                        Log.e(TAG, "Segment file not found: " + actualPath);
                        continue;
                    }
                    
                    android.media.MediaExtractor extractor = new android.media.MediaExtractor();
                    extractor.setDataSource(actualPath);
                    
                    // Find audio track
                    int trackIndex = -1;
                    for (int i = 0; i < extractor.getTrackCount(); i++) {
                        android.media.MediaFormat format = extractor.getTrackFormat(i);
                        String mime = format.getString(android.media.MediaFormat.KEY_MIME);
                        if (mime != null && mime.startsWith("audio/")) {
                            trackIndex = i;
                            if (!muxerStarted) {
                                audioTrackIndex = muxer.addTrack(format);
                                muxer.start();
                                muxerStarted = true;
                            }
                            break;
                        }
                    }
                    
                    if (trackIndex < 0) {
                        extractor.release();
                        continue;
                    }
                    
                    extractor.selectTrack(trackIndex);
                    
                    // Copy samples
                    java.nio.ByteBuffer buffer = java.nio.ByteBuffer.allocate(1024 * 1024);
                    android.media.MediaCodec.BufferInfo bufferInfo = new android.media.MediaCodec.BufferInfo();
                    
                    while (true) {
                        int sampleSize = extractor.readSampleData(buffer, 0);
                        if (sampleSize < 0) break;
                        
                        bufferInfo.offset = 0;
                        bufferInfo.size = sampleSize;
                        bufferInfo.presentationTimeUs = totalDurationUs + extractor.getSampleTime();
                        bufferInfo.flags = extractor.getSampleFlags();
                        
                        muxer.writeSampleData(audioTrackIndex, buffer, bufferInfo);
                        extractor.advance();
                    }
                    
                    // Get duration of this segment
                    android.media.MediaFormat format = extractor.getTrackFormat(trackIndex);
                    if (format.containsKey(android.media.MediaFormat.KEY_DURATION)) {
                        totalDurationUs += format.getLong(android.media.MediaFormat.KEY_DURATION);
                    }
                    
                    extractor.release();
                }
                
                if (muxerStarted) {
                    muxer.stop();
                }
                muxer.release();

                // Update fileName to merged file so playAudio uses it
                fileName = mergedPath;

                String fileUri = mergedPath;
                try {
                    Uri contentUri = FileProvider.getUriForFile(
                        activity, activity.getPackageName() + ".fileprovider", new File(mergedPath));
                    fileUri = contentUri.toString();
                } catch (Exception e) {
                    // Use original path if FileProvider fails
                    fileUri = "file://" + mergedPath;
                }

                final String finalUri = fileUri;
                final double totalDurationSec = totalDurationUs / 1000000.0;
                new Handler(Looper.getMainLooper()).post(() -> 
                    callback.invoke(String.format("{\"success\": true, \"mergedPath\": \"%s\", \"totalDuration\": %f}", finalUri, totalDurationSec)));
            } catch (Exception e) {
                Log.e(TAG, "Error merging segments: " + e.getMessage());
                new Handler(Looper.getMainLooper()).post(() -> 
                    callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}"));
            }
        });
    }

    /**
     * Play multiple segments sequentially.
     * @validates Requirements 11.4
     */
    @ReactMethod
    public void playSegments(ReadableArray segmentPathsArray, Callback callback) {
        if (segmentPathsArray == null || segmentPathsArray.size() == 0) {
            callback.invoke("{\"success\": false, \"error\": \"No segments to play\"}");
            return;
        }

        // Convert ReadableArray to List
        final List<String> paths = new ArrayList<>();
        for (int i = 0; i < segmentPathsArray.size(); i++) {
            paths.add(segmentPathsArray.getString(i));
        }

        // Stop any existing playback
        if (audioPlayer != null) {
            try {
                if (audioPlayer.isPlaying()) audioPlayer.stop();
                audioPlayer.release();
            } catch (Exception ignore) {}
            audioPlayer = null;
        }
        if (nextAudioPlayer != null) {
            try {
                nextAudioPlayer.release();
            } catch (Exception ignore) {}
            nextAudioPlayer = null;
        }

        currentSegmentIndex = 0;
        segmentPathsList = paths;
        playNextSegmentGapless(callback);
    }

    // Store segment paths for gapless playback
    private List<String> segmentPathsList = new ArrayList<>();
    private MediaPlayer nextAudioPlayer = null;

    private MediaPlayer createMediaPlayerForPath(String path) throws Exception {
        MediaPlayer mp = new MediaPlayer();
        
        if (path.startsWith("file://")) {
            path = path.substring(7);
        }
        
        if (path.startsWith("content://")) {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                mp.setDataSource(activity, Uri.parse(path));
            } else {
                String[] parts = path.split("/external_files");
                if (parts.length > 1) {
                    path = "/storage/emulated/0" + parts[1];
                    mp.setDataSource(path);
                } else {
                    throw new Exception("Cannot resolve content URI: " + path);
                }
            }
        } else {
            mp.setDataSource(path);
        }
        
        mp.prepare();
        return mp;
    }

    private void playNextSegmentGapless(final Callback callback) {
        if (currentSegmentIndex >= segmentPathsList.size()) {
            // All segments played
            if (eventEmitter == null) {
                eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
            }
            WritableMap params = Arguments.createMap();
            params.putString("state", "playbackComplete");
            eventEmitter.emit("status", params);
            return;
        }

        try {
            String path = segmentPathsList.get(currentSegmentIndex);
            
            // Create current player
            audioPlayer = createMediaPlayerForPath(path);
            
            // Pre-load next segment for gapless playback
            if (currentSegmentIndex + 1 < segmentPathsList.size()) {
                try {
                    String nextPath = segmentPathsList.get(currentSegmentIndex + 1);
                    nextAudioPlayer = createMediaPlayerForPath(nextPath);
                    audioPlayer.setNextMediaPlayer(nextAudioPlayer);
                } catch (Exception e) {
                    Log.e(TAG, "Error pre-loading next segment: " + e.getMessage());
                    // Continue without gapless - will have small gap
                }
            }
            
            audioPlayer.setOnCompletionListener(mp -> {
                currentSegmentIndex++;
                mp.release();
                
                // Move next player to current
                if (nextAudioPlayer != null) {
                    audioPlayer = nextAudioPlayer;
                    nextAudioPlayer = null;
                    
                    // Pre-load the next-next segment
                    if (currentSegmentIndex + 1 < segmentPathsList.size()) {
                        try {
                            String nextPath = segmentPathsList.get(currentSegmentIndex + 1);
                            nextAudioPlayer = createMediaPlayerForPath(nextPath);
                            audioPlayer.setNextMediaPlayer(nextAudioPlayer);
                        } catch (Exception e) {
                            Log.e(TAG, "Error pre-loading next segment: " + e.getMessage());
                        }
                    }
                    
                    // Set completion listener for the new current player
                    audioPlayer.setOnCompletionListener(this::onSegmentComplete);
                } else {
                    audioPlayer = null;
                    playNextSegmentGapless(callback);
                }
            });
            
            audioPlayer.start();
            
            if (currentSegmentIndex == 0) {
                callback.invoke(String.format("{\"success\": true, \"segmentCount\": %d}", segmentPathsList.size()));
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing segment: " + e.getMessage());
            if (currentSegmentIndex == 0) {
                callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    private void onSegmentComplete(MediaPlayer mp) {
        currentSegmentIndex++;
        mp.release();
        
        if (nextAudioPlayer != null) {
            audioPlayer = nextAudioPlayer;
            nextAudioPlayer = null;
            
            // Pre-load the next-next segment
            if (currentSegmentIndex + 1 < segmentPathsList.size()) {
                try {
                    String nextPath = segmentPathsList.get(currentSegmentIndex + 1);
                    nextAudioPlayer = createMediaPlayerForPath(nextPath);
                    audioPlayer.setNextMediaPlayer(nextAudioPlayer);
                } catch (Exception e) {
                    Log.e(TAG, "Error pre-loading next segment: " + e.getMessage());
                }
            }
            
            audioPlayer.setOnCompletionListener(this::onSegmentComplete);
        } else {
            audioPlayer = null;
            // Check if there are more segments
            if (currentSegmentIndex < segmentPathsList.size()) {
                playNextSegmentGapless(null);
            } else {
                // All done
                if (eventEmitter == null) {
                    eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                }
                WritableMap params = Arguments.createMap();
                params.putString("state", "playbackComplete");
                eventEmitter.emit("status", params);
            }
        }
    }

    // Keep old method for backward compatibility but redirect to new one
    private void playNextSegment(final List<String> paths, final Callback callback) {
        segmentPathsList = paths;
        playNextSegmentGapless(callback);
    }

    /**
     * Seek to a specific position in the audio playback.
     * Uses OnSeekCompleteListener to wait for the async seek to complete
     * before invoking the callback, preventing race conditions.
     * @param positionMs Position in milliseconds
     */
    @ReactMethod
    public void seekTo(int positionMs, Callback callback) {
        if (audioPlayer != null) {
            try {
                // Set up listener to wait for seek to complete
                audioPlayer.setOnSeekCompleteListener(new MediaPlayer.OnSeekCompleteListener() {
                    @Override
                    public void onSeekComplete(MediaPlayer mp) {
                        // Clear the listener after use
                        mp.setOnSeekCompleteListener(null);
                        // Get actual position after seek completes
                        int actualPosition = mp.getCurrentPosition();
                        callback.invoke("{\"success\": true, \"position\": " + actualPosition + "}");
                    }
                });
                audioPlayer.seekTo(positionMs);
            } catch (Exception e) {
                callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            }
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No audio player active\"}");
        }
    }

    /**
     * Get current playback position in milliseconds.
     * Used for accurate waveform sync during playback.
     */
    @ReactMethod
    public void getPlaybackPosition(Callback callback) {
        if (audioPlayer != null) {
            try {
                int position = audioPlayer.getCurrentPosition();
                int duration = audioPlayer.getDuration();
                callback.invoke("{\"success\": true, \"position\": " + position + ", \"duration\": " + duration + "}");
            } catch (Exception e) {
                callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            }
        } else {
            callback.invoke("{\"success\": false, \"error\": \"No audio player active\"}");
        }
    }

    /**
     * Start playback from a specific position.
     * Uses OnSeekCompleteListener to ensure seek completes before starting playback.
     * @param positionMs Position in milliseconds to start from
     */
    @ReactMethod
    public void playFromPosition(int positionMs, Callback callback) {
        if (fileName == null || fileName.isEmpty()) {
            callback.invoke("{\"success\": false, \"error\": \"No audio file to play\"}");
            return;
        }
        
        // Stop any existing playback
        if (audioPlayer != null) {
            try {
                if (audioPlayer.isPlaying()) audioPlayer.stop();
                audioPlayer.release();
            } catch (Exception ignore) {}
            audioPlayer = null;
        }
        
        try {
            audioPlayer = new MediaPlayer();
            
            String playPath = fileName;
            if (playPath.startsWith("content://")) {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    audioPlayer.setDataSource(activity, Uri.parse(playPath));
                } else {
                    String[] parts = playPath.split("/external_files");
                    if (parts.length > 1) {
                        playPath = "/storage/emulated/0" + parts[1];
                        audioPlayer.setDataSource(playPath);
                    } else {
                        throw new IOException("Cannot resolve content URI without activity");
                    }
                }
            } else {
                if (playPath.startsWith("file://")) {
                    playPath = playPath.substring(7);
                }
                audioPlayer.setDataSource(playPath);
            }
            
            // Set up completion listener to emit event when playback finishes
            audioPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    // Emit playback complete event to JS
                    if (eventEmitter == null) {
                        eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                    }
                    WritableMap params = Arguments.createMap();
                    params.putString("state", "playbackComplete");
                    eventEmitter.emit("status", params);
                }
            });
            
            audioPlayer.prepare();
            
            // Use OnSeekCompleteListener to ensure seek completes before starting playback
            audioPlayer.setOnSeekCompleteListener(new MediaPlayer.OnSeekCompleteListener() {
                @Override
                public void onSeekComplete(MediaPlayer mp) {
                    // Clear the listener after use
                    mp.setOnSeekCompleteListener(null);
                    // Start playback after seek completes
                    mp.start();
                    int actualPosition = mp.getCurrentPosition();
                    callback.invoke("{\"success\": true, \"position\": " + actualPosition + "}");
                }
            });
            audioPlayer.seekTo(positionMs);
            
        } catch (Exception e) {
            Log.e("TAG", "playFromPosition error: " + e.getMessage());
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Delete all segment files.
     * @validates Requirements 11.5
     */
    @ReactMethod
    public void deleteSegments(ReadableArray segmentPathsArray, Callback callback) {
        if (segmentPathsArray == null || segmentPathsArray.size() == 0) {
            callback.invoke("{\"success\": true, \"deletedCount\": 0}");
            return;
        }

        int deletedCount = 0;
        for (int i = 0; i < segmentPathsArray.size(); i++) {
            try {
                String path = segmentPathsArray.getString(i);
                // Handle content:// URIs
                if (path.startsWith("file://")) {
                    path = path.substring(7);
                }
                if (path.startsWith("content://")) {
                    // Skip content URIs
                    continue;
                }
                
                File file = new File(path);
                if (file.exists() && file.delete()) {
                    deletedCount++;
                }
            } catch (Exception e) {
                Log.e(TAG, "Error deleting segment: " + e.getMessage());
            }
        }

        // Clear internal segments list
        segmentPaths.clear();
        currentSegmentIndex = 0;

        callback.invoke(String.format("{\"success\": true, \"deletedCount\": %d}", deletedCount));
    }

    /**
     * Get all current segment paths.
     */
    @ReactMethod
    public void getSegmentPaths(Callback callback) {
        try {
            JSONArray pathsArray = new JSONArray();
            Activity activity = getCurrentActivity();
            
            for (String path : segmentPaths) {
                String fileUri = path;
                if (activity != null) {
                    try {
                        Uri contentUri = FileProvider.getUriForFile(
                            activity, activity.getPackageName() + ".fileprovider", new File(path));
                        fileUri = contentUri.toString();
                    } catch (Exception e) {
                        // Use original path if FileProvider fails
                    }
                }
                pathsArray.put(fileUri);
            }
            
            callback.invoke(String.format("{\"success\": true, \"segments\": %s}", pathsArray.toString()));
        } catch (Exception e) {
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Clear all segments and reset state.
     */
    @ReactMethod
    public void clearSegments(Callback callback) {
        segmentPaths.clear();
        currentSegmentIndex = 0;
        
        if (audioPlayer != null) {
            try {
                if (audioPlayer.isPlaying()) audioPlayer.stop();
                audioPlayer.release();
            } catch (Exception ignore) {}
            audioPlayer = null;
        }
        
        callback.invoke("{\"success\": true}");
    }

    @ReactMethod
    public void openCamera(String fileType, Integer imageQuality, final Callback callback) {
        IMAGE_QUALITY = imageQuality;
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            WritableMap errorMap = new WritableNativeMap();
            errorMap.putString("error", "Activity doesn't exist");
            callback.invoke(errorMap);
            return;
        }

        // Check and request permissions if needed, then proceed with camera launch
        if (ContextCompat.checkSelfPermission(currentActivity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(currentActivity, new String[] {Manifest.permission.CAMERA}, REQUEST_LAUNCH_CAMERA);
        } else {
            launchCameraIntent(currentActivity, callback);
        }
    }

    private void launchCameraIntent(Activity currentActivity, Callback callback) {
        this.callback = callback;
        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        try {
            cameraFile = createImageFile(); // Use the global variable here
            if (cameraFile != null) {
                Uri photoURI = FileProvider.getUriForFile(currentActivity,
                        currentActivity.getApplicationContext().getPackageName() + ".fileprovider",
                        cameraFile);
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                currentActivity.startActivityForResult(cameraIntent, REQUEST_LAUNCH_CAMERA);
            } else {
                WritableMap errorMap = new WritableNativeMap();
                errorMap.putString("error", "Could not create image file");
                callback.invoke(errorMap);
            }
        } catch (Exception e) {
            WritableMap errorMap = new WritableNativeMap();
            errorMap.putString("error", "Failed to launch camera: " + e.getMessage());
            callback.invoke(errorMap);
        }
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getCurrentActivity().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpeg",         /* suffix */
                storageDir      /* directory */
        );
        return image;
    }


    @ReactMethod
    public void openFileChooser(String fileType, Callback callback) {
        try {
            this.callback = callback;
            Activity currentActivity = getCurrentActivity();
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);

            intent.setType(getType(fileType));
//            intent.putExtra(Intent.EXTRA_MIME_TYPES, getType(fileType));

            boolean multiple = false; //!args.isNull(OPTION_MULTIPLE) && args.getBoolean(OPTION_MULTIPLE);
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);

            currentActivity.startActivityForResult(Intent.createChooser(intent, "Select a file"), READ_REQUEST_CODE, Bundle.EMPTY);
        } catch (ActivityNotFoundException e) {
            Log.e(TAG, "openFileChooser: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            Log.e(TAG, "openFileChooser: " + e.getMessage());
        }
    }

    @ReactMethod
    public void openFileChooserMulti(String fileType, int maxSelection, Callback callback) {
        try {
            this.multiCallback = callback;
            Activity currentActivity = getCurrentActivity();
            if ("image".equals(fileType)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    // Android 13+: system photo picker — no READ_MEDIA_IMAGES permission required
                    Intent intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
                    // Cap selection to the remaining allowance (server count limit − already staged),
                    // clamped to the OS max. cap==1 is valid — the photo picker enters single-select and
                    // returns getData() (handled by onShowActivityResultMulti's data.getData() branch).
                    int cap = Math.min(Math.max(1, maxSelection), MediaStore.getPickImagesMaxLimit());
                    intent.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, cap);
                    currentActivity.startActivityForResult(intent, READ_REQUEST_CODE_MULTI, Bundle.EMPTY);
                } else {
                    // Android < 13: open gallery via ACTION_GET_CONTENT with multi-select
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, maxSelection != 1); // single-select when the cap is 1
                    currentActivity.startActivityForResult(intent, READ_REQUEST_CODE_MULTI, Bundle.EMPTY);
                }
            } else {
                // Non-image: document picker without createChooser so EXTRA_ALLOW_MULTIPLE works.
                // Use setType("*/*") + EXTRA_MIME_TYPES rather than setType("audio/*"): a SPECIFIC
                // top-level type (audio/*, video/*) routes many devices to a single-select media/
                // music picker that ignores EXTRA_ALLOW_MULTIPLE — which is why documents ("*/*")
                // allowed multi-select but audio did not. "*/*" forces the multi-select DocumentsUI;
                // EXTRA_MIME_TYPES keeps it filtered to the requested kind.
                String mime = getType(fileType);
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                if (mime != null && !mime.isEmpty() && !"*/*".equals(mime)) {
                    intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{ mime });
                }
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, maxSelection != 1); // single-select when the cap is 1
                currentActivity.startActivityForResult(intent, READ_REQUEST_CODE_MULTI, Bundle.EMPTY);
            }
        } catch (ActivityNotFoundException e) {
            Log.e(TAG, "openFileChooserMulti: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "openFileChooserMulti: " + e.getMessage());
        }
    }

    @ReactMethod
    public void checkAndDownload(String url, String name, Callback callback) {
        try {
            if (fileExists(name)) {
                // Already downloaded — open it and report done
                openFileWithOption(name, ignored -> {});
                callback.invoke("{\"success\": true, \"alreadyExists\": true}");
                return;
            }
            Long downloadId = downloadFile(name, url);
            if (downloadId == null) {
                callback.invoke("{\"success\": false, \"error\": \"Download could not be started\"}");
                return;
            }
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("downloadId", downloadId.longValue());
            callback.invoke(result.toString());
        } catch (Exception e) {
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @ReactMethod
    public void openFile(String url, String name, Callback callback) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mContext.getApplicationContext().startActivity(i);
        callback.invoke("{\"success\": true}");
    }


    @ReactMethod
    public void openFileWithOption(String fileName, Callback callback) {
        try {
            // Get the Downloads directory path
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File file = new File(downloadsDir, fileName);
    
            if (!file.exists()) {
                callback.invoke("{\"success\": false, \"error\": \"File not found\"}");
                return;
            }
    
            // Use FileProvider for secure URI access
            Uri uri = FileProvider.getUriForFile(mContext, mContext.getPackageName() + ".fileprovider", file);
            String mimeType = mContext.getContentResolver().getType(uri);
            Log.d("openFileWithOption: ", " MIMETYPE " + mimeType + " " + fileName);
    
            if (mimeType == null) {
                mimeType = "*/*"; // Fallback MIME type
            }
    
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    
            Intent chooser = Intent.createChooser(intent, "Open file with");
            chooser.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    
            if (chooser.resolveActivity(mContext.getPackageManager()) != null) {
                mContext.getApplicationContext().startActivity(chooser);
                callback.invoke("{\"success\": true}");
            } else {
                callback.invoke("{\"success\": false, \"error\": \"No app available\"}");
            }
        } catch (Exception e) {
            callback.invoke("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }
    


    @ReactMethod
    public void doesFileExist(String fileName, Callback callback) {
        try {
            obj = new JSONObject();
            obj.put("exists", fileExists(fileName));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        callback.invoke(obj.toString());
    }

    private void createDirectory(String var0) {
        if (!(new File(var0)).exists()) {
            boolean worked = (new File(var0)).mkdirs();
            Log.e(TAG, "createDirectory: "+ worked);
        }
    }

    private File makeEmptyFileWithTitle(Context context, String title) {
        String dir;
        if (Build.VERSION_CODES.R > Build.VERSION.SDK_INT) {
            dir = Environment.getExternalStorageDirectory() + "/cometchat/shared/";
        } else {
            if (Environment.isExternalStorageManager()) {
                dir = Environment.getExternalStorageState() + "/cometchat/shared/";
            } else {
                dir = Environment.getExternalStoragePublicDirectory(DIRECTORY_DOCUMENTS).getPath() + "/cometchat/shared/";
            }
        }
        createDirectory(dir);
        return new File(dir, title);
    }

    private boolean fileExists(String fileName) {
        File f = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), fileName);
        return f.exists();
    }

    private Long downloadFile(String fileName, String url){
        try {
            if (fileExists(fileName)) {
                return null;
            }
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url))
                    .setTitle(fileName)
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(false)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            DownloadManager downloadManager = (DownloadManager) mContext.getSystemService(Context.DOWNLOAD_SERVICE);
            Long downloadId = downloadManager.enqueue(request);
            Log.d("FileCheck: ", " yyyy " + downloadId.longValue());

            IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                mContext.registerReceiver(onDownloadComplete, filter, Context.RECEIVER_EXPORTED);
            } else {
                mContext.registerReceiver(onDownloadComplete, filter);
            }
            return downloadId;
        } catch (Exception ex) {
            Toast.makeText(mContext, "Something went wrong.", Toast.LENGTH_SHORT).show();
        }
        return null;
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}