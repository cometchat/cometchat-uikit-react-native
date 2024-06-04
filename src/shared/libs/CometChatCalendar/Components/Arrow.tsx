import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';

import Icons from '../Icons';
import { ThemeContext } from '../Contexts';
import type { Theme } from '../Entities';

export interface Props {
  direction: 'left' | 'right';
  isDisabled?: boolean;
  onPress: () => void;
}

const Arrow: React.FC<Props> = ({ direction, isDisabled, onPress }) => {
  const theme = React.useContext<Theme>(ThemeContext);
  
  return (
    <TouchableOpacity
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessibilityLabel={`${direction} arrow`}
      accessibilityHint={'Press to move to previous month or year'}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[theme.normalArrowContainer, isDisabled && theme.disabledArrowContainer]}>
      <Image
        testID={'arrow-image'}
        accessibilityIgnoresInvertColors
        source={Icons.arrow.left['16px']}
        style={[
          theme.normalArrowImage,
          isDisabled && theme.disabledArrowImage,
          direction === 'right' && styles.right,
        ]}
      />
    </TouchableOpacity>
  );
};

export default React.memo(Arrow);

const styles = StyleSheet.create({
  right: {
    transform: [{ rotate: '180deg' }],
  },
});
