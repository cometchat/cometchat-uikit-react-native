import React from 'react';
import {Image, ImageSourcePropType} from 'react-native';
import {Control} from '../Control';

interface BackProps {
  onBack: () => void;
  resetControlTimeout?: () => void;
  showControls: boolean;
  backIcon?: ImageSourcePropType
  backIconColor?: string
}

export const Back = ({
    backIcon,
    backIconColor,
    onBack,
    showControls
  }: BackProps) => {
  return (
    <Control callback={onBack} disabled={!showControls}>
      <Image 
        source={backIcon ? backIcon : require('../../assets/img/back.png')}
        resizeMode='contain'
        style={{ tintColor: backIconColor ? backIconColor : '#fff', height: 25, width:25 }}
      />
    </Control>
  );
};
