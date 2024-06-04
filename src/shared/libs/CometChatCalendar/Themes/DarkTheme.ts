import type { Theme } from '../Entities';
import DefaultTheme from './DefaultTheme';
import Colors from './Colors';

const { dark } = Colors;

const CALENDAR_HEIGHT = 315;
const DAY_WIDTH_PERCENTAGE = 60 / 7; // 60% of width distributed among 7 weekdays
const HORIZONTAL_MARGIN_PERCENT = 40 / (7 * 2); // 40% of margin horizontal distributed among 7 weekdays
const DAY_HEIGHT_PERCENTAGE = 95 / 6;
const VERTICAL_MARGIN_PERCENT = 5 / 30;

const DarkTheme: Theme = {
  ...DefaultTheme,
  calendarContainer: {
    flex: 1,
    minHeight: CALENDAR_HEIGHT,
    backgroundColor: dark.base,
  },
  titleText: {
    color: dark.baseText,
    letterSpacing: 0.8,
    fontSize: 15,
    fontWeight: '600',
  },
  normalDayText: {
    color: dark.baseText,
  },
  normalMonthText: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    color: dark.baseText,
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: '700',
  },
  selectedMonthText: {
    color: dark.primary,
  },
  extraDayText: {
    color: dark.disabled,
    fontWeight: '300',
  },
  disabledDayText: {
    color: dark.disabled,
    fontWeight: '300',
  },
  normalArrowImage: {
    height:20,
    tintColor: dark.primary,
  },
  normalArrowContainer: {
    backgroundColor: dark.elevation,
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayText: {
    fontWeight: '700',
    color: dark.primaryText,
  },
  normalDayContainer: {
    width: `${DAY_WIDTH_PERCENTAGE}%`,
    marginHorizontal: `${HORIZONTAL_MARGIN_PERCENT}%`,
    height: `${DAY_HEIGHT_PERCENTAGE}%`,
    marginVertical: `${VERTICAL_MARGIN_PERCENT}%`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayContainer: {
    backgroundColor: dark.primary,
    borderRadius: 50,
  },
};

export default DarkTheme;
