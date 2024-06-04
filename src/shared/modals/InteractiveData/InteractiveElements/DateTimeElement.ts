import { BaseInputElement } from "./index";

import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a DateTime input element.
 */
export class DateTimeElement extends BaseInputElement<string> {
  /**
   * The label of the input element.
   */
  private label: string;
  private mode: string;
  private timezoneCode: string;
  private to: string;
  private from: string;
  private dateTimeFormat: string;
  /**
   * The default value to be selected in the DateTime.
   */
  private defaultValue?: string;

  /**
   * Creates a new instance of DateTimeInput.
   * @param elementId - The ID of the input element.
   * @param label - The label of the input element.
   * @param options - The options available for the DateTime input element.
   */
  constructor(elementId: string, json) {
    super(elementId, ElementType.dateTime);
    Object.assign(this, json);
  }

  getTimeZone(): string {
    return this.timezoneCode;
  }
  
  setTimeZone(timezoneCode: string): string {
    return (this.timezoneCode = timezoneCode);
  }

  getMode(): string {
    return this.mode;
  }

  setMode(mode: string): string {
    return (this.mode = mode);
  }

  getToDateTime(): string {
    return this.to;
  }

  setToDateTime(to: string): string {
    return (this.to = to);
  }

  getFromDateTime(): string {
    return this.from;
  }

  setFromDateTime(from: string): string {
    return (this.from = from);
  }

  getDateTimeFormat(): string {
    return this.dateTimeFormat;
  }

  setDateTimeFormat(dateTimeFormat: string): string {
    return (this.dateTimeFormat = dateTimeFormat);
  }

  /**
   * Gets the label of the input element.
   * @returns The label of the input element.
   */
  getLabel(): string {
    return this.label;
  }

  /**
   * Gets the default value to be selected in the DateTime.
   * @returns The default value to be selected in the DateTime.
   */
  getDefaultValue(): string | undefined {
    return this.defaultValue;
  }

  /**
   * Sets the default value to be selected in the DateTime.
   * @param defaultValue - The default value to be selected in the DateTime.
   */
  setDefaultValue(defaultValue: string): void {
    this.defaultValue = defaultValue;
  }

  static fromJSON(json: any): DateTimeElement {
    const dateTimeElement = new DateTimeElement(json.elementId, json);
    if (json.defaultValue) dateTimeElement.setDefaultValue(json.defaultValue);
    return dateTimeElement;
  }
}
