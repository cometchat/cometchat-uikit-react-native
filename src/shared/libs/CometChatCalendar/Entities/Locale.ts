import type { DefaultLocale } from '../Locales';

export type Locale = typeof DefaultLocale;

export interface LocaleData {
  // firstDayOfWeek: Function;
  // longDateFormat: Function;
  months: () => string[];
  monthsShort: () => string[];
  weekdaysMin: () => string[];
  weekdaysShort: () => string[];
}
