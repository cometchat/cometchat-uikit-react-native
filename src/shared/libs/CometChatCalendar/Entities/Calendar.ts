import type { Locale } from './Locale';
import type { Theme } from './Theme';
import type {
  ArrowComponentType,
  MonthComponentType,
  TitleComponentType,
  DayComponentType,
  WeekdaysComponentType,
} from './Components';

export interface WrapperCalendarProps {
  ArrowComponent?: ArrowComponentType;
  TitleComponent?: TitleComponentType;
  DayComponent?: DayComponentType;
  MonthComponent?: MonthComponentType;
  WeekdaysComponent?: WeekdaysComponentType;
  initVisibleDate?: string;
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
  allowYearView?: boolean;
  showExtraDates?: boolean;
  testID?: string;
  locale?: Locale;
  theme?: Theme;
}
