import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  ImageSourcePropType,
} from "react-native";
import Video from "../../libs/VideoPlayerControls/index";

interface CometChatVideoPlayer {
  videoUri: string
  isVisible: boolean
  onClose: Function
  onLoad: Function
  loadingIconColor?: string;
  playIcon?: ImageSourcePropType
  playIconColor?: string
  pauseIcon?: ImageSourcePropType
  pauseIconColor?: string
  backIcon?: ImageSourcePropType
  backIconColor?: string
  volumeIcon?: ImageSourcePropType
  volumeIconColor?: string
}

export const CometChatVideoPlayer = (props:CometChatVideoPlayer) => {
  const {
    videoUri,
    isVisible,
    onClose,
    onLoad,
    loadingIconColor,
    playIcon,
    playIconColor,
    pauseIcon,
    pauseIconColor,
    backIcon,
    backIconColor,
    volumeIcon,
    volumeIconColor,
  } = props
  const [isPaused, setPaused] = useState(false);

  const handleLoadStart = () => {
    setPaused(false);
  };

  const handleLoad = () => {
    onLoad()
  };

  const handleClose = () => {
    setPaused(true);
    onClose();
  };

  useEffect(() => {
    setPaused(!isVisible);
  }, [isVisible]);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Video
            disableFullscreen
            disableSeekButtons
            source={{ uri: videoUri }} 
            muted={false}
            resizeMode="contain"
            paused={isPaused} 
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={(e) => {
              console.warn("Video Error: ", e.error);
              handleClose();
            }}
            onBack={handleClose}
            loadingIconColor={loadingIconColor}
            playIcon={playIcon}
            playIconColor={playIconColor}
            pauseIcon={pauseIcon}
            pauseIconColor={pauseIconColor}
            backIcon={backIcon}
            backIconColor={backIconColor}
            volumeIcon={volumeIcon}
            volumeIconColor={volumeIconColor}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "black",
  },
  fullscreenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    marginTop: Platform.OS === "ios" ? 40 : 20,
    right: 20,
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    zIndex: 20, 
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
  loadingIndicator: {
    position: "absolute",
    alignSelf: "center",
  },
});
