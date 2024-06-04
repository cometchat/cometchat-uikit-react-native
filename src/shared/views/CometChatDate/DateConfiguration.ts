import { DateStyle, DateStyleInterface } from './DateStyle';

/**
 * @class DateConfiguration
 * @description DateConfiguration class is used for defining the Date template.
 */
export class DateConfiguration {
  pattern?: string;
  style?: DateConfigurationStyle;
  dateAlignment?: "auto" | "left" | "right" | "center" | "justify" | undefined;
  /**
   * @param {Object} param0
   * @field pattern - pattern in which time should be displayed. One of ["timeFormat","dayDateFormat","dayDateTimeFormat"]
   * @field style - Object of DateStyle
   */
  constructor({
    style = new DateStyle({}),
    pattern = 'timeFormat',
    dateAlignment,
  }: DateConfigurationInterface) {
    this.pattern = pattern;
    this.style = style;
    this.dateAlignment = dateAlignment;
  }
}

type DateConfigurationStyle = DateStyleInterface;
export interface DateConfigurationInterface {
  pattern?: string;
  style?: DateConfigurationStyle;
  dateAlignment?: "auto" | "left" | "right" | "center" | "justify" | undefined;
}
