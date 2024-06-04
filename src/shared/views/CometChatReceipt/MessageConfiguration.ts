//@ts-ignore
import waiting from './resources/sending.png';
//@ts-ignore
import greyTick from './resources/grey-tick-icon.png';
//@ts-ignore
import greyDoubleTick from './resources/grey-double-tick-icon.png';
//@ts-ignore
import blueDoubleTick from './resources/blue-double-tick-icon.png';
//@ts-ignore
import errorTick from './resources/error.png';
import { ImageType } from '../../base';

/**
 * @class ReceiptConfiguration
 * @description ReceiptConfiguration class is used for defining the MessageReceipt template.
 */
export class ReceiptConfiguration {
  waitIcon?: ImageType;
  sentIcon?: ImageType;
  readIcon?: ImageType;
  deliveredIcon?: ImageType;
  errorIcon?: ImageType;
  /**
     * 
     * @param {Object} param0 
     * @field {any} waitIcon - icon for Wait
     * @field {any} sentIcon - icon for Sent
     * @field {any} readIcon - icon for Read
     * @field {any} deliveredIcon - icon for Delivered
     * @field {any} errorIcon - icon for Error

     */
  constructor({
    waitIcon = waiting,
    sentIcon = greyTick,
    readIcon = greyDoubleTick,
    deliveredIcon = blueDoubleTick,
    errorIcon = errorTick,
  }: ReceiptConfigurationInterface) {
    this.waitIcon = waitIcon;
    this.sentIcon = sentIcon;
    this.readIcon = readIcon;
    this.deliveredIcon = deliveredIcon;
    this.errorIcon = errorIcon;
  }
}
export interface ReceiptConfigurationInterface {
  waitIcon?: ImageType;
  sentIcon?: ImageType;
  readIcon?: ImageType;
  deliveredIcon?: ImageType;
  errorIcon?: ImageType;
}
