package com.reactnativecometchatuikit;

import static android.os.Environment.DIRECTORY_DOCUMENTS;

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
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedResultAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FileManager extends ReactContextBaseJavaModule {
    public static final String NAME = "FileManager";
    private static String folderPath = "";
    public static final String TAG = "native_code";
    private Context mContext;
    private ReactApplicationContext mReactContext;
    private static final int READ_REQUEST_CODE = 100;
    private static final int CAPTURE_STILL_IMAGE = 101;

    private Callback callback;

    private static final String FIELD_URI = "uri";
    private static final String FIELD_FILE_COPY_URI = "fileCopyUri";
    private static final String FIELD_COPY_ERROR = "copyError";
    private static final String FIELD_NAME = "name";
    private static final String FIELD_TYPE = "type";
    private static final String FIELD_SIZE = "size";

    FileManager(ReactApplicationContext context) {
        super(context);
        mContext = context.getApplicationContext();
        mReactContext = context;
        folderPath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getPath();
        context.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        context.addActivityEventListener(activityEventListener);
    }

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
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
            shareIntent.putExtra(Intent.EXTRA_STREAM, FileProvider.getUriForFile(context, context.getApplicationContext().getPackageName() + ".provider", file));
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

    @ReactMethod
    public boolean startRecording(Callback callback) {
        if (checkPermissions()) {
            fileName = getCurrentActivity().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath();
            fileName += "/audio-recording-" + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()) + ".m4a";
            Log.e("AudioRecorder", "permission granted for audio recording " + fileName);
            audioRecorder = new MediaRecorder();
            audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            audioRecorder.setOutputFile(fileName);
            Log.e("AudioRecorder", "lower version permission granted for audio recording " + fileName);
            try {
                audioRecorder.prepare();
            } catch (IOException e) {
                Log.e("TAG", "prepare() failed");
            }
            audioRecorder.start();
            callback.invoke("{\"success\": true, \"file\": \"" + String.valueOf(FileProvider.getUriForFile(getCurrentActivity(), getCurrentActivity().getApplicationContext().getPackageName() + ".provider", new File(fileName))) + "\"}");
            return true;
        } else {
            requestPermissions();
            Log.e("AudioRecorder", "permission not granted for audio recording or write to external storage so request permission");
            return false;
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
        audioPlayer = new MediaPlayer();
        try {
            Log.e("TAG", "Trying to play Audio: " + fileName);
            audioPlayer.setDataSource(fileName);
            audioPlayer.prepare();
            audioPlayer.start();
            Log.e("TAG", "Playing Audio: " + fileName);
            callback.invoke("{\"success\": true, \"file\": \"" + String.valueOf(FileProvider.getUriForFile(getCurrentActivity(), getCurrentActivity().getApplicationContext().getPackageName() + ".provider", new File(fileName))) + "\"}");
        } catch (IOException e) {
            Log.e("TAG", "prepare() failed");
        }
    }

    @ReactMethod
    public String pauseRecording() {
        if(audioRecorder != null) {
            audioRecorder.stop();
            audioRecorder.release();
        }
        audioRecorder = null;
        return fileName;
    }

    @ReactMethod
    public void pausePlaying(Callback callback) {
        if (audioPlayer != null && audioPlayer.isPlaying()) {
            Log.e("TAG", "Trying to pause Audio: " + fileName);
            audioPlayer.pause();
            callback.invoke("{\"success\": true, \"file\": \"" + String.valueOf(FileProvider.getUriForFile(getCurrentActivity(), getCurrentActivity().getApplicationContext().getPackageName() + ".provider", new File(fileName))) + "\"}");
            Log.e("TAG", "Paused Audio: " + fileName);
        }
    }

    @ReactMethod
    private void stopPlaying(Callback callback) {
        if (audioPlayer != null) {
            audioPlayer.stop();
            audioPlayer.release();
            audioPlayer = null;
            callback.invoke("{\"success\": true, \"file\": \"" + String.valueOf(FileProvider.getUriForFile(getCurrentActivity(), getCurrentActivity().getApplicationContext().getPackageName() + ".provider", new File(fileName))) + "\"}");
        }
    }

    @ReactMethod
    public void releaseMediaResources(Callback callback) {
        if (audioRecorder != null) {
            pauseRecording();
            callback.invoke("{\"success\": true, \"file\": \"" + String.valueOf(FileProvider.getUriForFile(getCurrentActivity(), getCurrentActivity().getApplicationContext().getPackageName() + ".provider", new File(fileName))) + "\"}");
        }
        if (audioPlayer != null && audioPlayer.isPlaying()) {
            stopPlaying(callback);
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

    @ReactMethod
    public void openCamera(String fileType, Callback callback) {
        try {
            this.callback = callback;
            Intent camera_intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE_SECURE);
            mReactContext.startActivityForResult(camera_intent,CAPTURE_STILL_IMAGE, Bundle.EMPTY);
        } catch (Exception ex) {
            Log.e(TAG, "openCamera: " + ex.getMessage() );
        }
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
    public void checkAndDownload(String url, String name, Callback callback) {
        downloadFile(name, url);
    }

    @ReactMethod
    public void openFile(String url, String name, Callback callback) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mContext.getApplicationContext().startActivity(i);
        callback.invoke("{\"success\": true}");
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
        File f = new File(mContext.getApplicationContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
        return f.exists();
    }

    private void downloadFile(String fileName, String url){
        try {
            if (fileExists(fileName)) {
                return;
            }
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url))
                    .setTitle(fileName)
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(false)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            DownloadManager downloadManager = (DownloadManager) mContext.getSystemService(Context.DOWNLOAD_SERVICE);
            downloadManager.enqueue(request);
        } catch (Exception ex) {
            Toast.makeText(mContext, "Something went wrong.", Toast.LENGTH_SHORT).show();
        }
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
