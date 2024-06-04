import React, {memo} from 'react';
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  View,
  GestureResponderHandlers,
  ImageSourcePropType,
} from 'react-native';
import {Volume} from './Volume';
import {Back} from './Back';
import {NullControl} from './NullControl';
import {styles} from './styles';
import type {VideoAnimations} from '../types';

interface TopControlProps {
  showControls: boolean;
  panHandlers: GestureResponderHandlers;
  animations: VideoAnimations;
  disableBack: boolean;
  disableVolume: boolean;
  volumeFillWidth: number;
  volumeTrackWidth: number;
  volumePosition: number;
  onBack: () => void;
  resetControlTimeout: () => void;
  backIcon?: ImageSourcePropType
  backIconColor?: string
  volumeIcon?: ImageSourcePropType
  volumeIconColor?: string
}

export const TopControls = memo(
  ({
    backIcon,
    backIconColor,
    volumeIcon,
    volumeIconColor,
    showControls,
    panHandlers,
    animations: {AnimatedView, controlsOpacity, topControl},
    disableBack,
    disableVolume,
    volumeFillWidth,
    volumePosition,
    volumeTrackWidth,
    onBack,
    resetControlTimeout,
  }: TopControlProps) => {
    const backControl = disableBack ? (
      <NullControl />
    ) : (
      <Back
        showControls={showControls}
        onBack={onBack}
        resetControlTimeout={resetControlTimeout}
        backIcon={backIcon}
        backIconColor={backIconColor}
      />
    );

    const volumeControl = disableVolume ? (
      <NullControl />
    ) : (
      <Volume
        volumeFillWidth={volumeFillWidth}
        volumeTrackWidth={volumeTrackWidth}
        volumePosition={volumePosition}
        volumePanHandlers={panHandlers}
        volumeIcon={volumeIcon}
        volumeIconColor={volumeIconColor}
      />
    );

    return (
      <AnimatedView style={[_styles.top, controlsOpacity, topControl]}>
        <ImageBackground
          source={require('../assets/img/top-vignette.png')}
          style={[styles.column]}
          imageStyle={[styles.vignette]}>
          <SafeAreaView style={_styles.topControlGroup}>
            {backControl}
            <View style={_styles.pullRight}>{volumeControl}</View>
          </SafeAreaView>
        </ImageBackground>
      </AnimatedView>
    );
  },
);

const _styles = StyleSheet.create({
  pullRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  topControlGroup: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    margin: 12,
    marginBottom: 18,
  },
});
