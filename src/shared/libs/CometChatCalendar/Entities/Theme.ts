import type { StyleProp, TextStyle, ViewStyle, ImageStyle } from 'react-native';

/*
 * All "container" styles are currently implemented as View or TouchableOpacity components
 * All other styles are appended with their component type.
 * Ex: arrowImage is an Image component, titleText is a Text component
 */

export interface Theme {
  calendarContainer: StyleProp<ViewStyle>; // Outermost container
  headerContainer: StyleProp<ViewStyle>; // Wraps arrows and title
  /*
   *  ------- ARROW STYLES ----------
   *   Different arrow states have different styles:
   *   1. normal arrow          // applies to all calendars, all views
   *   2. disabled arrow        // applies to all calendars, all views
   */
  normalArrowContainer: StyleProp<ViewStyle>;
  disabledArrowContainer: StyleProp<ViewStyle>;
  normalArrowImage: StyleProp<ImageStyle>;
  disabledArrowImage: StyleProp<ImageStyle>;

  titleContainer: StyleProp<ViewStyle>;
  titleText: StyleProp<TextStyle>;
  weekdaysContainer: StyleProp<ViewStyle>; // Wraps all the weekday names
  weekdayText: StyleProp<TextStyle>;
  daysContainer: StyleProp<ViewStyle>; // Wraps all the days of the month in MonthView
  monthsContainer: StyleProp<ViewStyle>; // Wraps all the months of the year in YearView
  /*
   *  ------- MONTH STYLES ----------
   *   Different month states have different styles:
   *   1. normal month          // applies to all calendars, year view
   *   2. disabled month        // applies to all calendars, year view
   *   3. selected month        // applies to all calendars, year view
   */
  normalMonthContainer: StyleProp<ViewStyle>;
  disabledMonthContainer: StyleProp<ViewStyle>;
  selectedMonthContainer: StyleProp<ViewStyle>;
  normalMonthText: StyleProp<TextStyle>;
  disabledMonthText: StyleProp<TextStyle>;
  selectedMonthText: StyleProp<TextStyle>;
  /*
   *  ------- DAY STYLES ----------
   *   Different day states have different styles:
   *   1. normal day          // applies to all calendars, month view
   *   2. disabled day        // applies to all calendars, month view
   *   3. start of week day   // applies to all calendars, month view
   *   4. end of week day     // applies to all calendars, month view
   *   5. start of month day  // applies to all calendars, month view
   *   6. end of month day    // applies to all calendats, month view
   *   7. selected day        // applies to date selection calendar, month view
   */
  normalDayContainer: StyleProp<ViewStyle>;
  disabledDayContainer: StyleProp<ViewStyle>;
  selectedDayContainer: StyleProp<ViewStyle>;
  extraDayContainer: StyleProp<ViewStyle>;
  startOfWeekDayContainer: StyleProp<ViewStyle>;
  endOfWeekDayContainer: StyleProp<ViewStyle>;
  startOfMonthDayContainer: StyleProp<ViewStyle>;
  endOfMonthDayContainer: StyleProp<ViewStyle>;

  normalDayText: StyleProp<TextStyle>;
  disabledDayText: StyleProp<TextStyle>;
  selectedDayText: StyleProp<TextStyle>;
  extraDayText: StyleProp<TextStyle>;
  startOfWeekDayText: StyleProp<TextStyle>;
  endOfWeekDayText: StyleProp<TextStyle>;
  startOfMonthDayText: StyleProp<TextStyle>;
  endOfMonthDayText: StyleProp<TextStyle>;
}
