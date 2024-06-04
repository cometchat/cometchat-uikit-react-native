package com.reactnativecometchatuikit;

import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.MediaController;
import android.widget.RelativeLayout;
import android.widget.VideoView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class CometChatVideoPlayer extends AppCompatActivity {
    VideoView videoView;
    RelativeLayout relativeLayout;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getSupportActionBar().hide();
        Context context = getApplicationContext();
        relativeLayout = new RelativeLayout(context);
        String videoUrl = getIntent().getStringExtra("videoUrl");
        this.getSupportActionBar().hide();

        videoView = new VideoView(context);
        videoView.setLayoutParams(
                new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );

        MediaController mediacontroller = new MediaController(this,true);
        mediacontroller.setAnchorView(videoView);
        videoView.setMediaController(mediacontroller);
        videoView.setVideoURI(Uri.parse(videoUrl));
        videoView.setOnPreparedListener(mediaPlayer -> mediaPlayer.start());
        relativeLayout.addView(videoView);
        setContentView(relativeLayout);
    }
}
