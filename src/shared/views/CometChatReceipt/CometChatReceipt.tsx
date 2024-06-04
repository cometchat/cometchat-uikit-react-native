import React from 'react';
//@ts-ignore
import { Image } from 'react-native';
import { ImageType } from '../../base';
import { ICONS } from './resources';
import styles from './style';

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
}

export const CometChatReceipt = (props: CometChatReceiptInterface) => {
  const { waitIcon, sentIcon, deliveredIcon, readIcon, errorIcon, receipt } =
    props;

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
    return <Image source={imageSource} style={styles.tickImageStyle} />;
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
