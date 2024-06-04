import React, { useLayoutEffect, useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ICONS } from './resources';
import { ReactNativeZoomableViewWithGestures } from '../../libs/ImageZoom';

export const ImageViewerModal = ({ imageUrl, isVisible, onClose }) => {

  const [downloaded, setDownloaded] = useState(false);
  useLayoutEffect(() => {
    Image.prefetch(imageUrl.uri).then((res) => {
      setDownloaded(res);
    });

    Image.getSize(
      imageUrl.uri,
      (res) => {
        console.log('success : ', res);
      },
      (res) => {
        console.log('error : ', res);
      }
    );
  }, []);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Image
                source={ICONS.backIcon}
                style={{ tintColor: '#fff', height: 20, width: 20 }}
              />
            </TouchableOpacity>
          </View>
          {downloaded ? (
            <View style={styles.imageContainer}>
              <ReactNativeZoomableViewWithGestures onSwipeDown={onClose}>
                <Image
                  source={imageUrl}
                  style={styles.imageStyle}
                  resizeMode="contain"
                />
              </ReactNativeZoomableViewWithGestures>
            </View>
          ) : (
            <ActivityIndicator color={'#fff'} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    width: '100%',
    zIndex: 100,
  },
  imageContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    zIndex: 10,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
});
