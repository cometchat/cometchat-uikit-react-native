import React, { useContext } from 'react';
//@ts-ignore
import { Image } from 'react-native';
import { CometChatContextType, ImageType } from '../../base';
import { ICONS } from './resources';
import styles from './style';
import { CometChatContext } from '../../CometChatContext';

/**
 *
 * CometChatReceipt is a component used to display the status of a message by a custom symbol.
 * This component returns the appropriate symbol depending upon the message status and can be customised.
 *
 * @version 1.0.0
 * @author CometChat
 *
 */
export interface CometChatReceiptInterface {
  waitIcon?: ImageType;
  sentIcon?: ImageType;
  deliveredIcon?: ImageType;
  readIcon?: ImageType;
  errorIcon?: ImageType;
  receipt?: 'SENT' | 'DELIVERED' | 'READ' | 'ERROR' | 'WAIT';
  style?: {
    height?: string | number;
    width?: string | number;
    tintColor?: string
  }
}

export const CometChatReceipt = (props: CometChatReceiptInterface) => {
  const { waitIcon, sentIcon, deliveredIcon, readIcon, errorIcon, receipt, style } =
    props;

  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const _style = {
    ...style,
    height: style?.height || 10,
    width: style?.width || 14,
    tintColor: style?.tintColor,
  };

  const { height, width, tintColor } = _style;

  let icon = null;
  let imageSource = null;

  switch (receipt) {
    case 'SENT':
      icon = sentIcon;
      break;
    case 'DELIVERED':
      icon = deliveredIcon;
      break;
    case 'READ':
      icon = readIcon;
      break;
    case 'ERROR':
      icon = errorIcon;
      break;
    case 'WAIT':
      icon = waitIcon;
      break;

    default:
      break;
  }

  if (icon) {
    if (typeof icon === 'string') {
      imageSource = { uri: icon };
    } else if (typeof icon === 'number') {
      imageSource = icon;
    }
    return <Image source={imageSource} style={[styles.tickImageStyle, { tintColor: tintColor, width, height }]} />;
  }
  return null;
};

CometChatReceipt.defaultProps = {
  waitIcon: ICONS.WAITING,
  sentIcon: ICONS.GREY_TICK,
  deliveredIcon: ICONS.GREY_DOUBLE_TICK,
  readIcon: ICONS.BLUE_DOUBLE_TICK,
  errorIcon: ICONS.ERROR_TICK,
  receipt: null,
};
