import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState, useContext, useLayoutEffect } from "react";
import DateTimePickerModal from "../../libs/datePickerModal";
import { ICONS } from "../../assets/images";
import { CometChatContextType } from "../../base";
import { CometChatContext } from "../../CometChatContext";
import { DateTime } from "../../libs/luxon/src/luxon";
import { convertToATimeZone } from "../../utils/SchedulerUtils";
import DateTimePicker from "@react-native-community/datetimepicker";
import { styles } from "./DateTimePickerStyle";
import { DateTimeElement } from "../../modals";

export interface CometChatDateTimePickerInterface {
  style: object;
  data: DateTimeElement;
  showError: boolean;
  onChange: (selectedDateTime: string) => void;
}
export const CometChatDateTimePicker = (
  props: CometChatDateTimePickerInterface
) => {
  const { style, showError, data, onChange } = props;
  const mode = data.getMode();
  const format = data.getDateTimeFormat();
  const timeZone = data.getTimeZone();

  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [defaultTime, setDefaultTime] = useState(data.getDefaultValue() ?? "");
  const [selectedDate, setSelectedDate] = useState();
  const [fromDateTime, setFromDateTime] = useState(
    data.getFromDateTime() ?? ""
  );
  const [toDateTime, setToDateTime] = useState(data.getToDateTime() ?? "");

  const onDateSelected = (e) => {
    setSelectedDate(() => {
      if (mode === "time" && Platform.OS === "ios") {
        return selectedDate;
      } else return e;
    });
    e = DateTime.fromJSDate(e).setZone();
    setDatePickerVisibility(false);
    if (mode === "date") {
      e = DateTime.fromISO(e).toFormat("yyyy-MM-dd");
    }
    if (mode === "time") {
      if (Platform.OS === "ios") {
        e = DateTime.fromJSDate(selectedDate).toFormat("HH:mm");
      } else e = DateTime.fromISO(e).toFormat("HH:mm");
    }

    onChange && onChange(e);
  };

  const formatDate = (time, fromJSDate = false) => {
    if (time && format) {
      if (fromJSDate)
        return DateTime.fromJSDate(new Date(time)).toFormat(format);
      return DateTime.fromISO(time).toFormat(format);
    }
    return "";
  };

  const convertToATimeZoneWithModes = (time) => {
    switch (mode) {
      case "dateTime":
        return convertToATimeZone(time, timeZone, "toISO", "fromISO");
      case "date":
        return convertToATimeZone(
          `${time}T00:00:00`,
          timeZone,
          "toISO",
          "fromISO"
        );
      case "time":
        time = time?.split(":");
        if(time && time.length) {
          let dateTime = new Date();
          dateTime.setHours(time[0]);
          dateTime.setMinutes(time[1]);
          if (time.length === 3) {
            dateTime.setSeconds(time[2]);
          } else {
            dateTime.setSeconds(0);
          }
          return convertToATimeZone(
            dateTime.toISOString(),
            timeZone,
            "toISO",
            "fromISO"
          );
        }
        return "";
      default:
        return "";
    }
  };
  useLayoutEffect(() => {
    let defaultTime = convertToATimeZoneWithModes(data.getDefaultValue());
    let fromDateTime = convertToATimeZoneWithModes(data.getFromDateTime());
    let toDateTime = convertToATimeZoneWithModes(data.getToDateTime());
    setDefaultTime(defaultTime);
    setSelectedDate(defaultTime);
    setFromDateTime(fromDateTime);
    setToDateTime(toDateTime);
  }, []);

  return (
    <View style={{ marginBottom: 12 }}>
      {Boolean(defaultTime) && Boolean(fromDateTime) && Boolean(toDateTime) && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          date={
            selectedDate instanceof Date ? selectedDate : new Date(selectedDate)
          }
          mode={mode?.toLowerCase() || "datetime"}
          onConfirm={onDateSelected}
          onCancel={() => setDatePickerVisibility(false)}
          minimumDate={new Date(fromDateTime)}
          maximumDate={new Date(toDateTime)}
          display={Platform.OS === "ios" ? "inline" : "default"}
          {...(Platform.OS === "ios" && mode?.toLowerCase() === "time"
            ? {
                customPickerIOS: () => (
                  <DateTimePicker
                    value={
                      selectedDate instanceof Date
                        ? selectedDate
                        : new Date(selectedDate)
                    }
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, date) => {
                      setSelectedDate(date);
                    }}
                  />
                ),
              }
            : {})}
        />
      )}
      <Text
        style={[
          theme.typography.subtitle1,
          { color: theme.palette.getAccent800() ?? style.titleColor, marginBottom: 4 },
          style.titleFont || {},
        ]}
      >
        {data.getLabel()}
        {!data.getOptional() && "*"}
      </Text>

      <TouchableOpacity
        style={[
          styles.dateContainerView,
          {
            borderColor: showError
              ? theme.palette.getError()
              : theme.palette.getAccent200(),
          },
          style.border || {},
        ]}
        onPress={() => {
          setDatePickerVisibility(true);
        }}
      >
        <Text>
          {formatDate(selectedDate || defaultTime, Boolean(selectedDate))}
        </Text>
        <Image style={{ height: 20, width: 20 }} source={ICONS.CALENDAR} />
      </TouchableOpacity>
    </View>
  );
};

CometChatDateTimePicker.defaultProps = {
  style: {},
};
