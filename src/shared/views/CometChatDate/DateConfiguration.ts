import { DateStyle, DateStyleInterface } from './DateStyle';

/**
 * @class DateConfiguration
 * @description DateConfiguration class is used for defining the Date template.
 */
export class DateConfiguration {
  pattern?: string;
  style?: DateConfigurationStyle;
  /**
   * @param {Object} param0
   * @field pattern - pattern in which time should be displayed. One of ["timeFormat","dayDateFormat","dayDateTimeFormat"]
   * @field style - Object of DateStyle
   */
  constructor({
    style = new DateStyle({}),
    pattern = 'timeFormat',
  }: DateConfigurationInterface) {
    this.pattern = pattern;
    this.style = style;
  }
}

type DateConfigurationStyle = DateStyleInterface;
export interface DateConfigurationInterface {
  pattern?: string;
  style?: DateConfigurationStyle;
}
