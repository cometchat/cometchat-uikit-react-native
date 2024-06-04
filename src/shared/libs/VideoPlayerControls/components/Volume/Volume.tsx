import React from 'react';
import {View, Image, GestureResponderHandlers, ImageSourcePropType} from 'react-native';
import {styles} from './styles';

interface VolumeProps {
  volumeFillWidth: number;
  volumeTrackWidth: number;
  volumePosition: number;
  volumePanHandlers: GestureResponderHandlers;
  volumeIcon?: ImageSourcePropType
  volumeIconColor?: string
}

export const Volume = ({
  volumeFillWidth,
  volumePosition,
  volumeTrackWidth,
  volumePanHandlers,
  volumeIcon,
  volumeIconColor
}: VolumeProps) => {
  return (
    <View style={styles.container}>
      <View style={[styles.fill, {width: volumeFillWidth}]} />
      <View style={[styles.track, {width: volumeTrackWidth}]} />
      <View
        style={[styles.handle, {left: volumePosition - 15}]}
        {...volumePanHandlers}>
        <Image
          style={[styles.icon, volumeIconColor ? {tintColor: volumeIconColor} : {}]}
          resizeMode='contain'
          source={volumeIcon ? volumeIcon :require('../../assets/img/volume.png')}
        />
      </View>
    </View>
  );
};
