import React, { useContext, useEffect, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
} from "react-native";
import { CometChatContextType } from "../../base";
import { CometChatContext } from "../../CometChatContext";
import { SchedulerBubbleStyles } from "./styles";
import { CometChatAvatar } from "../CometChatAvatar";
import { styles } from "./styles";
import {
  SingleDateSelectionCalendar,
  DefaultTheme,
} from "../../libs/CometChatCalendar";
import { ICONS } from "../../assets/images";
import { CometChatButton } from "../CometChatButton";
import icsToJson from "../../utils/icsToJson";
import { APIAction, ButtonElement, SchedulerMessage } from "../../modals";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatNetworkUtils } from "../../utils/NetworkUtils";
import { HTTPSRequestMethods } from "../../constants/UIKitConstants";
import { DateTime } from "../../libs/luxon/src/luxon";
import {
  getMinSlotsFromRange,
  getFormatedDateString,
  convertDate,
  convertToLocalTimeZone,
  convertToATimeZone,
  addMinutes,
  convert24to12,
} from "../../utils/SchedulerUtils";
import CometChatQuickView from "../CometChatQuickView/CometChatQuickView";
import { localize } from "../../resources";
import { CometChatUiKitConstants, CometChatUIKit } from "../..";
import { CometChatTimeSlotSelector } from "../CometChatTimeSlotSelector";
import { InteractiveMessageUtils } from "../../utils/InteractiveMessageUtils";

const { TimeZoneCodeManager } = NativeModules;
export interface CometChatSchedulerBubbleInterface {
  schedulerMessage: SchedulerMessage;
  style?: SchedulerBubbleStyles;
  onScheduleClick?: (data: SchedulerMessage) => void;
}
enum componentEnum {
  loading,
  quickSelect,
  calendar,
  timeSlot,
  noTimeSlot,
  schedule,
  interacted,
}
enum slotErrorEnum {
  noError,
  error,
  noSlot,
}
const dateFormats = {
  date: "yyyy-MM-dd",
  time: "HHmm",
};

interface anyObject {
  [key: string]: any;
}
export const CometChatSchedulerBubble = memo(
  (props: CometChatSchedulerBubbleInterface) => {
    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const { schedulerMessage, style, onScheduleClick } = props;
    const message = SchedulerMessage.fromJSON(schedulerMessage);
    let interactiveData = message.getInteractiveData();

    const [allowInteraction, setAllowInteraction] = useState<boolean>(true);
    const [slotError, setSlotError] = useState<slotErrorEnum>(
      slotErrorEnum.noError
    );
    const [currentComp, setCurrentComp] = useState<anyObject>({
      current: componentEnum.loading,
      previous: componentEnum.loading,
    });
    const [selectedDate, setSelectedDate] = useState<string>(
      new DateTime(new Date()).toFormat(dateFormats.date)
    );

    const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
    const [dateAvailablity, setDateAvailablity] = useState<anyObject>({});
    const [selectedDateObj, setSlectedDateObj] = useState<anyObject>({});
    const [compDimensions, setCompDimensions] = useState<anyObject>({});
    const [selectedSlotState, setSelectedSlotState] = useState<anyObject>({});
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User>({});
    const tempQuickSelectRange = useRef<any[]>([]);
    const [quickAvailbleSlots, setQuickAvailbleSlots] = useState<any[]>([]);
    const [availableRange, setAvailableRange] = useState<anyObject>({});
    const availablityObjRef = useRef<anyObject>({});
    const availablityObjBeforeSlots = useRef<anyObject>({});
    const currentTimeZoneRef = useRef<string>("");

    useEffect(() => {
      setCompDimensions(calcDimensions(currentComp.current));
    }, [currentComp]);

    const icsFileData = useRef({});

    const getDayFomDate = (date) => {
      let day = DateTime.fromFormat(date, "yyyy-MM-dd").toFormat("EEEE");
      return day;
    };

    const getConvertedAvailablityObjectForDate = (date, day, newObj) => {
      let newAvailabilityObj = availablityObjRef.current;
      if (!newAvailabilityObj || !newAvailabilityObj.availability) return;
      newAvailabilityObj?.availability[day.toLowerCase()]?.forEach((item) => {
        let from = (convertToATimeZone(
          `${date} ${item.from}`,
          newAvailabilityObj.timeZoneCode,
          "yyyy-MM-dd HHmm",
          "fromFormat",
          "yyyy-MM-dd HHmm"
        ) as string).split(" ");
        let startDate = from[0];
        let startTime = from[1];
        let to = (convertToATimeZone(
          `${date} ${item.to}`,
          newAvailabilityObj.timeZoneCode,
          "yyyy-MM-dd HHmm",
          "fromFormat",
          "yyyy-MM-dd HHmm"
        ) as string).split(" ");

        let endDate = to[0];
        let endTime = to[1];
        if (endTime !== "2359" && endTime?.slice(-1) === "9") {
          endTime = addMinutes(`${endTime.slice(0, 2)}:${endTime.slice(2)}`, 1);
        }
        if (startDate === endDate) {
          if (newObj[startDate]) {
            newObj[startDate] = {
              day: getDayFomDate(startDate),
              date: startDate,
              availability: [
                ...newObj[startDate]["availability"],
                { from: startTime, to: endTime },
              ],
            };
          } else {
            newObj[startDate] = {
              day: getDayFomDate(startDate),
              date: startDate,
              availability: [{ from: startTime, to: endTime }],
            };
          }
        } else {
          if (newObj[startDate]) {
            newObj[startDate] = {
              day: getDayFomDate(startDate),
              date: startDate,
              availability: [
                ...newObj[startDate]["availability"],
                { from: startTime, to: "2359" },
              ],
            };
          } else {
            newObj[startDate] = {
              day: getDayFomDate(startDate),
              date: startDate,
              availability: [{ from: startTime, to: "2359" }],
            };
          }
          if (newObj[endDate]) {
            newObj[endDate] = {
              day: getDayFomDate(endDate),
              date: endDate,
              availability: [
                ...newObj[endDate]["availability"],
                { from: "0000", to: endTime },
              ],
            };
          } else {
            newObj[endDate] = {
              day: getDayFomDate(endDate),
              date: endDate,
              availability: [{ from: "0000", to: endTime }],
            };
          }
        }
      });
    };

    const onSelectDate = async (date) => {
      setSelectedDate(date);
      let newObj = {};
      let previousDate = getNextFormatedDate(date, true);
      let previousDay = DateTime.fromFormat(
        previousDate,
        dateFormats.date
      ).toFormat("EEEE");
      getConvertedAvailablityObjectForDate(previousDate, previousDay, newObj);
      let day = DateTime.fromFormat(date, dateFormats.date).toFormat("EEEE");
      getConvertedAvailablityObjectForDate(date, day, newObj);
      let nextDate = getNextFormatedDate(date);
      let nextDay = DateTime.fromFormat(nextDate, dateFormats.date).toFormat(
        "EEEE"
      );
      getConvertedAvailablityObjectForDate(nextDate, nextDay, newObj);

      if (newObj[date]) {
        let availabilityObjWithTimeSlots = { ...newObj };
        let range = await getMeetingSlots({
          date,
          availabilityObject: availabilityObjWithTimeSlots,
        });
        if (range.length) {
          let lastSlot: string = range[range.length - 1];

          let lastSlotMinutes =
            Number(lastSlot.slice(0, 2)) * 60 + Number(lastSlot.slice(3));

          if (
            lastSlotMinutes < 1439 &&
            lastSlotMinutes + interactiveData.duration * 2 > 1440
          ) {
            let nextDate = getNextFormatedDate(date);

            let nextRange = await getMeetingSlots({
              date: nextDate,
              availabilityObject: availabilityObjWithTimeSlots,
            });

            if (nextRange[0] === "00:00") {
              let nextSlotInMinutes =
                lastSlotMinutes + interactiveData.duration + 1;
              let hours = Math.floor(nextSlotInMinutes / 60);
              let minutes = (nextSlotInMinutes - 1) % 60;
              if (hours <= 23)
                range.push(
                  `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
                    2,
                    "0"
                  )}`
                );
            }
          }
          availabilityObjWithTimeSlots[date] = {
            ...availabilityObjWithTimeSlots[date],
            availability: range,
          };

          setDateAvailablity(availabilityObjWithTimeSlots[date]);
          setCurrentComp((prev) => ({
            current: componentEnum.timeSlot,
            previous: prev.current,
          }));
        } else {
          setSlectedDateObj({ date, day });
          setCurrentComp((prev) => ({
            current: componentEnum.noTimeSlot,
            previous: prev.current,
          }));
        }
      } else {
        setSlectedDateObj({ date, day });
        setCurrentComp((prev) => ({
          current: componentEnum.noTimeSlot,
          previous: prev.current,
        }));
      }
    };

    const getAvailableDays = ({
      startDate,
      endDate,
      availability,
      timeZoneCode,
    }) => {
      let initialDate = new Date(startDate);
      let finalDate = new Date(endDate);

      availablityObjRef.current = {
        startDate,
        endDate,
        availability,
        timeZoneCode,
      };
      setAvailableRange({ initialDate, finalDate });

      getQuickSelectSlots(new Date());
    };

    const combineAvailability = (availability) => {
      if (availability && availability.length) {
        // Sort availability array
        availability.sort((a, b) => a.from.localeCompare(b.from));

        let combinedAvailability = [availability[0]];
        for (let i = 1; i < availability.length; i++) {
          let prev = combinedAvailability[combinedAvailability.length - 1];
          let curr = availability[i];
          if (prev.to === curr.from) {
            // If the previous 'to' matches with current 'from', combine them
            prev.to = curr.to;
          } else {
            // If not, add the current block to the result
            combinedAvailability.push(curr);
          }
        }

        return combinedAvailability;
      }
      return [];
    };

    const getMeetingSlots = ({
      date,
      availabilityObject,
      blockedSlots,
    }: any): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        let range = [];
        combineAvailability(availabilityObject[date]?.availability);
        if (
          availabilityObject[date]?.availability?.length &&
          availabilityObject[date]?.availability[0]?.from
        ) {
          let newObj = JSON.parse(JSON.stringify(availabilityObject));
          availablityObjBeforeSlots.current[date] = {
            ...newObj[date],
          };
        }

        availabilityObject[date]?.availability?.forEach((item) => {
          let icsSelectedSlots = icsFileData.current[date];
          let selectedSlots = [];
          if (blockedSlots) {
            selectedSlots = blockedSlots;
          }
          icsSelectedSlots?.forEach((item) => {
            if (item.startDate === item.endDate) {
              selectedSlots.push({
                startTime: item.startTime,
                endTime: item.endTime,
              });
            } else {
              // managed if there is a meeting which ends next day
              selectedSlots.push({
                startTime: item.startTime,
                endTime: "2359",
              });
              if (item.endTime == "0000") return;
              if (icsFileData.current[item.endDate])
                icsFileData.current[item.endDate] = [
                  ...icsFileData.current[item.endDate],
                  {
                    startDate: item.startDate,
                    endDate: item.startDate,
                    startTime: "0000",
                    endTime: item.endTime,
                  },
                ];
              else
                icsFileData.current[item.endDate] = [
                  {
                    startDate: item.endDate,
                    endDate: item.endDate,
                    startTime: "0000",
                    endTime: item.endTime,
                  },
                ];
            }
          });

          // get slots for a particular range
          range = [
            ...range,
            ...getMinSlotsFromRange({
              startTime: item.from,
              endTime: item.to,
              selectedSlots,
              slotDuration: interactiveData.duration ?? 30,
              bufferDuration: interactiveData?.bufferTime ?? 0,
            }),
          ];
        });
        resolve(range);
      });
    };

    const getNextQuickSlots = async (date, newQuickObj, i = 0) => {
      if (date && date !== "Invalid DateTime" && i < 30) {
        let nextDate = getNextFormatedDate(date);
        let nextday = DateTime.fromFormat(nextDate, dateFormats.date).toFormat(
          "EEEE"
        );
        getConvertedAvailablityObjectForDate(nextDate, nextday, newQuickObj);

        let nextRange = await getMeetingSlots({
          date: nextDate,
          availabilityObject: newQuickObj,
        });
        if (newQuickObj[nextDate])
          newQuickObj[nextDate].availability = nextRange;
        // Ensure nextRange is an Array
        if (!Array.isArray(nextRange)) {
          nextRange = [];
        }
        tempQuickSelectRange.current = [
          ...tempQuickSelectRange.current,
          ...nextRange,
        ];

        if (tempQuickSelectRange.current.length < 2) {
          return await getNextQuickSlots(nextDate, newQuickObj, i + 1);
        }
        return nextRange;
      }
    };

    const getQuickSelectSlots = async (date) => {
      let day = DateTime.fromJSDate(date).toFormat("EEEE");
      date = DateTime.fromJSDate(date).toFormat(dateFormats.date);

      let newQuickObj = {};
      getConvertedAvailablityObjectForDate(date, day, newQuickObj);
      let blockedSlots = [
        {
          startTime: "0000",
          endTime: `${new Date().getHours()}${new Date().getMinutes()}`,
        },
      ];
      let range = await getMeetingSlots({
        date,
        availabilityObject: newQuickObj,
        blockedSlots,
      });

      tempQuickSelectRange.current = range;
      if (range.length && newQuickObj[date]) {
        newQuickObj[date].availability = range;
      }
      // Ensure range is an Array
      if (!Array.isArray(range)) {
        range = [];
      }

      if (range.length < 2) await getNextQuickSlots(date, newQuickObj);

      let quickSlotsArray = [];

      Object.entries(newQuickObj).forEach(([key, value]: [string, any]) => {
        value.availability.forEach((item) => {
          quickSlotsArray.push({
            slot: item,
            date: value.date,
            day: value.day,
          });
        });
      });

      setQuickAvailbleSlots(quickSlotsArray);
      setCurrentComp((prev) => ({
        current: componentEnum.quickSelect,
        previous: prev.current,
      }));
    };

    const getICSFile = () => {
      return new Promise((resolve, reject) => {
        if (interactiveData.icsFileUrl)
          fetch(interactiveData.icsFileUrl)
            .then((response) => {
              if (response.status === 200) {
                return { response, status: response.status };
              }
              return { status: response.status };
            })
            .then(async (res) => {
              // let text = response?.text();
              // Converted ICS to JSON
              if (res.status === 200) {
                let text = await res.response.text();
                let jcalData = icsToJson(text);
                // Restructure the JSON to make it more easy to assign to calendar dates
                let finalJcalData = {};
                jcalData.forEach((item, index) => {
                  let startDate = convertToLocalTimeZone(
                    convertDate(item.startDate),
                    item.tzid ? item.tzid : "utc",
                    dateFormats.date
                  );
                  let startTime = convertToLocalTimeZone(
                    convertDate(item.startDate),
                    item.tzid ? item.tzid : "utc",
                    dateFormats.time
                  );
                  let endDate = convertToLocalTimeZone(
                    convertDate(item.endDate),
                    item.tzid ? item.tzid : "utc",
                    dateFormats.date
                  );
                  let endTime = convertToLocalTimeZone(
                    convertDate(item.endDate),
                    item.tzid ? item.tzid : "utc",
                    dateFormats.time
                  );
                  let finalObject = {
                    ...item,
                    startDate,
                    startTime,
                    endDate,
                    endTime,
                  };
                  if (startDate === endDate) {
                    if (finalJcalData[startDate]) {
                      finalJcalData[startDate] = [
                        ...finalJcalData[startDate],
                        finalObject,
                      ];
                    } else finalJcalData[startDate] = [finalObject];
                  } else {
                    let nextDate = getNextFormatedDate(startDate);
                    if (endDate !== nextDate) {
                      finalJcalData[startDate] = [
                        {
                          ...finalObject,
                          startDate: startDate,
                          endDate: startDate,
                          endTime: "2359",
                        },
                      ];
                      while (endDate !== nextDate) {
                        if (finalJcalData[nextDate]) {
                          finalJcalData[nextDate] = [
                            ...finalJcalData[nextDate],
                            {
                              ...finalObject,
                              endTime: "2359",
                              endDate: nextDate,
                              startDate: nextDate,
                              startTime: "0000",
                            },
                          ];
                        } else
                          finalJcalData[nextDate] = [
                            {
                              ...finalObject,
                              endTime: "2359",
                              startDate: nextDate,
                              endDate: nextDate,
                              startTime: "0000",
                            },
                          ];

                        nextDate = getNextFormatedDate(nextDate);
                      }
                      if (endDate === nextDate) {
                        finalJcalData[nextDate] = [
                          {
                            ...finalObject,
                            startDate: nextDate,
                            endDate: nextDate,
                            startTime: "0000",
                          },
                        ];
                      }
                    } else {
                      if (finalJcalData[startDate]) {
                        finalJcalData[startDate] = [
                          ...finalJcalData[startDate],
                          {
                            ...finalObject,
                            endTime: "2359",
                            endDate: startDate,
                          },
                        ];
                      } else
                        finalJcalData[startDate] = [
                          {
                            ...finalObject,
                            endTime: "2359",
                            endDate: startDate,
                          },
                        ];
                      if (finalJcalData[endDate]) {
                        finalJcalData[endDate] = [
                          ...finalJcalData[endDate],
                          {
                            ...finalObject,
                            startTime: "0000",
                            startDate: endDate,
                          },
                        ];
                      } else
                        finalJcalData[endDate] = [
                          {
                            ...finalObject,
                            startTime: "0000",
                            startDate: endDate,
                          },
                        ];
                    }
                  }
                });
                icsFileData.current = finalJcalData;
                resolve(finalJcalData);
              } else {
                reject(res);
              }
            })
            .catch((err) => {
              console.log("Error :: ", err);
              reject(err);
            });
        else reject();
      });
    };

    useEffect(() => {
      CometChat.getLoggedinUser()
        .then((u) => {
          let hasInteractionCompleted: boolean = InteractiveMessageUtils.checkHasInteractionCompleted({
            interactedElements: message?.getInteractions() || [],
            interactionGoal: message?.getInteractionGoal() || undefined
          });
          if(hasInteractionCompleted) {
            setCurrentComp((prev) => ({
              current: componentEnum.interacted,
              previous: prev.current,
            }));
            return
          }
          TimeZoneCodeManager.getCurrentTimeZone((timeZone) => {
            currentTimeZoneRef.current = timeZone;
          });
          setLoggedInUser(u);
          if (
            u?.getUid() === schedulerMessage?.getSender()?.getUid() &&
            schedulerMessage?.data?.allowSenderInteraction == false
          ) {
            setAllowInteraction(false);
          }
          getICSFile();
          if (interactiveData) {
            getAvailableDays({
              availability: interactiveData.availability,
              startDate: convertToATimeZone(
                `${interactiveData.dateRangeStart}T00:00:00`,
                interactiveData.timezoneCode,
                dateFormats.date,
                "fromISO"
              ),
              endDate: convertToATimeZone(
                `${interactiveData.dateRangeEnd}T23:59:00`,
                interactiveData.timezoneCode,
                dateFormats.date,
                "fromISO"
              ),
              timeZoneCode: interactiveData.timezoneCode,
            });
          }
        })
        .catch((e) => {
          console.log("Error while getting loggedInUser");
          setLoggedInUser(null);
        });
    }, []);

    const QuickSelectView = () => {
      return (
        <View>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
          />
          <View style={styles.quickContTimeContainer}>
            {quickAvailbleSlots.slice(0, 3).map((item) => {
              return (
                <TimeBoxView
                  text={`${(
                    item?.day?.charAt(0)?.toUpperCase() + item?.day?.slice(1)
                  ).slice(0, 3)}, ${DateTime.fromFormat(
                    item.date,
                    "yyyy-MM-dd"
                  ).toFormat("LLL dd")} at ${convert24to12(item.slot)}`}
                  item={item}
                />
              );
            })}
            <Text
              style={[
                theme.typography.subtitle5,
                { color: theme.palette.getAccent600(), lineHeight: 22 },
              ]}
            >
              {interactiveData?.duration}
              {localize("MIN_MEETING")} • {interactiveData?.timezoneCode}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.quickContMore}
            onPress={() => {
              if (allowInteraction)
                setCurrentComp((prev) => ({
                  current: componentEnum.calendar,
                  previous: prev.current,
                }));
            }}
          >
            <Text
              style={[
                theme.typography.subtitle4,
                {
                  color: allowInteraction
                    ? theme.palette.getPrimary()
                    : theme.palette.getAccent800(),
                },
              ]}
            >
              {localize("MORE_TIMES")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    };
    const TimeBoxView = ({ text, item }) => {
      return (
        <TouchableOpacity
          key={text}
          style={[
            styles.timeBoxContainer,
            {
              borderColor: allowInteraction
                ? theme.palette.getPrimary()
                : theme.palette.getAccent800(),
            },
            style?.suggestedTimeBorder ?? {},
            {
              backgroundColor:
                style?.suggestedTimeBackground ??
                theme.palette.getBackgroundColor(),
            },
          ]}
          onPress={() => {
            if (allowInteraction) {
              setSelectedSlotState({
                startTime: `${item?.slot?.replace(":", "")}`,
                endTime: addMinutes(item.slot, interactiveData.duration),
                selectedDate: item?.date,
                selectedDay: item?.day,
              });
              setCurrentComp((prev) => ({
                current: componentEnum.schedule,
                previous: prev.current,
              }));
            }
          }}
        >
          <Text
            style={[
              theme.typography.subtitle2,
              style?.suggestedTimeTextFont ?? {},
              {
                color: allowInteraction
                  ? style?.suggestedTimeTextColor ?? theme.palette.getPrimary()
                  : theme.palette.getAccent800(),
              },
            ]}
          >
            {text}
          </Text>
        </TouchableOpacity>
      );
    };

    const AvatarView = (props) => {
      const { avatar, title, subTitle, onBackPress } = props;
      if (
        currentComp.current === componentEnum.quickSelect ||
        currentComp.current === componentEnum.loading
      )
        return (
          <View style={styles.quickAvatarContainer}>
            <CometChatAvatar
              name={message?.getSender()?.getName()}
              image={{
                uri: avatar,
              }}
              style={{
                outerView: { borderWidth: 0 },
                ...styles.avatarCont,
                ...(style?.avatarStyle ? style.avatarStyle : {}),
              }}
            />
            <Text
              style={[
                theme.typography.heading3,
                style?.titleTextFont ?? {},
                {
                  color:
                    style?.titleTextColor ?? theme?.palette?.getAccent800(),
                  textAlign: "center",
                },
              ]}
            >
              {title}
            </Text>
          </View>
        );
      return (
        <View style={styles.calendarAvatarContainer}>
          <TouchableOpacity
            style={{ paddingHorizontal: 6 }}
            onPress={() => {
              if (slotError !== slotErrorEnum.noError)
                setSlotError(slotErrorEnum.noError);
              onBackPress();
            }}
          >
            <Image source={ICONS.BACK_ARROW} style={styles.calendarBackArrow} />
          </TouchableOpacity>
          {Boolean(avatar) && (
            <CometChatAvatar
              name={message?.getSender()?.getName()}
              style={{
                outerView: { borderWidth: 0 },
                ...styles.avatarCont,
                ...(style?.avatarStyle ? style.avatarStyle : {}),
              }}
              image={{
                uri: avatar,
              }}
            />
          )}
          <View
            style={{ paddingHorizontal: Boolean(avatar) ? 10 : 0, flex: 1 }}
          >
            {Boolean(title) && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  theme.typography.name,
                  style?.titleTextFont ?? {},
                  {
                    color:
                      style?.titleTextColor ?? theme?.palette?.getAccent800(),
                    flex: 1,
                  },
                ]}
              >
                {title}
              </Text>
            )}
            {Boolean(subTitle) && (
              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  height: 28,
                }}
              >
                <Image
                  source={ICONS.CLOCK}
                  style={{
                    height: 18,
                    width: 18,
                    tintColor: theme.palette.getAccent600(),
                  }}
                />
                <Text
                  style={[
                    theme.typography.subtitle1,
                    style?.summaryTextFont ?? {},
                    {
                      color:
                        style?.summaryTextColor ??
                        theme?.palette?.getAccent600(),
                    },
                  ]}
                >
                  {" "}
                  {subTitle}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    };
    const getNextFormatedDate = (date, previous = false) => {
      let nextDate = getFormatedDateString({
        date: DateTime.fromJSDate(
          new Date(
            new Date(date).setDate(
              previous
                ? new Date(date).getDate() - 1
                : new Date(date).getDate() + 1
            )
          )
        ).toMillis(),
        format: dateFormats.date,
      });
      return nextDate;
    };

    const CalendarView = () => {
      let initVisibleDate = selectedDate;
      if (new Date(selectedDate) < new Date(availableRange.initialDate)) {
        initVisibleDate = availableRange.initialDate;
      }
      return (
        <View>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
            subTitle={`${interactiveData?.duration} min`}
            onBackPress={() => {
              setCurrentComp((prev) => ({
                current: componentEnum.quickSelect,
                previous: prev.current,
              }));
            }}
          />
          <View style={styles.calendarSelectDayContainer}>
            <Text
              style={[
                theme.typography.text1,
                { color: theme?.palette?.getAccent900() },
              ]}
            >
              {localize("SELECT_DAY")}
            </Text>
          </View>
          <View style={{ padding: 5 }}>
            <SingleDateSelectionCalendar
              initVisibleDate={initVisibleDate}
              showExtraDates={true}
              testID={"calendar-1"}
              minDate={availableRange.initialDate}
              maxDate={availableRange.finalDate}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
              // ArrowComponent={()}
              theme={{
                ...DefaultTheme,
                calendarContainer: [
                  DefaultTheme.calendarContainer,
                  { backgroundColor: "transparent" },
                ],
                normalArrowImage: [
                  DefaultTheme.normalArrowImage,
                  { tintColor: "grey" },
                ],
                selectedMonthText: [
                  DefaultTheme.selectedMonthText,
                  {
                    color: theme?.palette?.getPrimary(),
                  },
                ],
                selectedDayContainer: [
                  DefaultTheme.selectedDayContainer,
                  {
                    borderRadius: 5,
                    backgroundColor: theme?.palette?.getPrimary(),
                  },
                ],
              }}
            />
            <View style={styles.calendarTimeZoneContainer}>
              <Text
                style={[
                  theme.typography.subtitle2,
                  { color: theme.palette.getAccent900() },
                ]}
              >
                <Image
                  source={ICONS.EARTH}
                  style={{
                    height: 15,
                    width: 15,
                    tintColor: theme.palette.getAccent900(),
                  }}
                />{" "}
                {interactiveData.timezoneCode}
              </Text>
            </View>
          </View>
        </View>
      );
    };

    const onSlotSelection = (startTime, endTime) => {
      setSelectedSlotState({
        startTime,
        endTime,
        selectedDate: dateAvailablity?.date,
        selectedDay: dateAvailablity?.day,
      });
      setCurrentComp((prev) => ({
        current: componentEnum.schedule,
        previous: prev.current,
      }));
    };

    const NoTimeSlotsView = () => {
      return (
        <View style={{ flex: 1 }}>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
            subTitle={`${interactiveData?.duration} min`}
            onBackPress={() => {
              setCurrentComp((prev) => ({
                current: componentEnum.calendar,
                previous: prev.current,
              }));
            }}
          />
          <View
            style={{
              height: 45,
              justifyContent: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={[
                theme.typography.subtitle1,
                {
                  borderBottomWidth: 0.45,
                  borderBottomColor: "rgba(212, 213, 215, 1)",
                  color: theme.palette.getAccent800(),
                  lineHeight: 30,
                },
              ]}
            >
              <Image
                source={ICONS.CALENDAR}
                style={{ height: 15, width: 15 }}
              />{" "}
              {selectedDateObj.date && selectedDateObj?.day
                ? `${DateTime.fromFormat(
                    selectedDateObj.date,
                    dateFormats.date
                  ).toFormat("dd MMMM y")}, ${
                    selectedDateObj?.day?.charAt(0)?.toUpperCase() +
                    selectedDateObj?.day?.slice(1)
                  }`
                : ""}
            </Text>
          </View>
          <Text
            style={[
              theme.typography.text1,
              {
                color: theme.palette.getAccent800(),
                marginLeft: 10,
                marginBottom: 5,
                marginTop: 2,
              },
            ]}
          >
            {localize("SELECT_TIME")}
          </Text>
          <View style={styles.noTimeSlotTextContainer}>
            <Image source={ICONS.CLOCK_ALERT} style={styles.noTimeSlotImage} />
            <Text
              style={[
                theme.typography.subtitle1,
                {
                  color: theme.palette.getAccent500(),
                  textAlign: "center",
                },
              ]}
            >
              {localize("NO_TIME_SLOT_AVAILABLE")}
            </Text>
          </View>
          <View style={styles.calendarTimeZoneContainer}>
            <Text
              style={[
                theme.typography.subtitle2,
                {
                  color: theme.palette.getAccent900(),
                  marginBottom: 4,
                  marginRight: 2,
                },
              ]}
            >
              <Image
                source={ICONS.EARTH}
                style={{
                  height: 15,
                  width: 15,
                  tintColor: theme.palette.getAccent900(),
                }}
              />{" "}
              {interactiveData.timezoneCode}
            </Text>
          </View>
        </View>
      );
    };

    const TimeSlotView = () => {
      return (
        <View style={{ flex: 1 }}>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
            subTitle={`${interactiveData?.duration} min`}
            onBackPress={() => {
              setCurrentComp((prev) => ({
                current: componentEnum.calendar,
                previous: prev.current,
              }));
            }}
          />
          <View
            style={{
              height: 45,
              justifyContent: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={[
                theme.typography.subtitle1,
                {
                  borderBottomWidth: 0.45,
                  borderBottomColor: "rgba(212, 213, 215, 1)",
                  color: theme.palette.getAccent800(),
                  lineHeight: 30,
                },
              ]}
            >
              <Image
                source={ICONS.CALENDAR}
                style={{ height: 15, width: 15 }}
              />{" "}
              {`${DateTime.fromFormat(
                dateAvailablity.date,
                dateFormats.date
              ).toFormat("dd MMMM y")}, ${
                dateAvailablity?.day?.charAt(0)?.toUpperCase() +
                dateAvailablity?.day?.slice(1)
              }`}
            </Text>
          </View>
          <CometChatTimeSlotSelector
            timeFormat="12Hr"
            duration={interactiveData.duration}
            slots={dateAvailablity.availability}
            onSelection={onSlotSelection}
            timeZone={interactiveData.timezoneCode}
            style={style?.timeSlotSelectorStyle}
            slotSelected={selectedSlotState?.startTime}
          />
        </View>
      );
    };

    async function _handleButtonClick(buttonData: ButtonElement) {
      setScheduleLoading(true);
      await getICSFile().catch((err) => {
        console.log(err);
        setSlotError(slotErrorEnum.error);
        setScheduleLoading(false);
      });
      let range = await getMeetingSlots({
        date: selectedSlotState.selectedDate,
        availabilityObject: availablityObjBeforeSlots.current,
      });
      let slotExists = range.find((item) => {
        let startTime = selectedSlotState.startTime;
        return `${startTime?.slice(0, 2)}:${startTime?.slice(2)}` === item;
      });

      if (!slotExists) {
        setSlotError(slotErrorEnum.noSlot);
        setScheduleLoading(false);
        return;
      }
      let conversation = await CometChat.CometChatHelper.getConversationFromMessage(
        message
      ).then(
        (conversation) => {
          return conversation;
        },
        (error) => {
          console.log("Error while converting message object", error);
          setSlotError(slotErrorEnum.error);
          setScheduleLoading(false);
          return undefined;
        }
      );
      if (!conversation) {
        setSlotError(slotErrorEnum.error);
        setScheduleLoading(false);
        return;
      }
      let action = interactiveData.scheduleElement.action;
      let buttonAction = APIAction.fromJSON(action);
      let uiKitSettings = CometChatUIKit.uiKitSettings;
      let body = {
        appID: uiKitSettings.appId,
        trigger: "ui_message_interacted",
        region: uiKitSettings.region,
        payload: {},
        data: {},
      };
      let payload: any = buttonAction.getPayload() || {};
      body.payload = payload;

      body.data = {
        messageId: schedulerMessage.id,
        conversationId: conversation.conversationId,
        receiver: schedulerMessage.getSender().getUid(),
        messageType: CometChatUiKitConstants.MessageTypeConstants.scheduler,
        messageCategory:
          CometChatUiKitConstants.MessageCategoryConstants.interactive,
        schedulerData: {
          meetStartAt: `${
            selectedSlotState.selectedDate
          }T${selectedSlotState?.startTime?.slice(
            0,
            2
          )}:${selectedSlotState?.startTime?.slice(2)}`,
          duration: interactiveData.duration,
        },
        receiverType: schedulerMessage?.getReceiverType(),
        interactedBy: loggedInUser.uid,
        sender: loggedInUser.uid,
        interactionTimezoneCode: currentTimeZoneRef.current,
        interactedElementId: buttonData.getElementId(),
      };
      onScheduleClick && onScheduleClick(message);
      CometChatNetworkUtils.fetcher({
        url: buttonAction.getURL(),
        method: buttonAction.getMethod() || HTTPSRequestMethods.POST,
        body,
        headers: buttonAction.getHeaders(),
      })
        .then((response) => {
          console.log("response", response.status, JSON.stringify(response));
          if (response.status == 200) {
            setCurrentComp((prev) => ({
              current: componentEnum.interacted,
              previous: prev.current,
            }));
          } else {
            setSlotError(slotErrorEnum.error);
          }
          setScheduleLoading(false);
        })
        .catch((error) => {
          setScheduleLoading(false);
          setSlotError(slotErrorEnum.error);
          console.log("CometChatNetworkUtils.fetcher error", error);
        });
    }

    const _renderButton = (data: ButtonElement, isSubmitElement?: boolean) => {
      let buttonData = ButtonElement.fromJSON(data);

      function isDisabled() {
        let isSender = message.getSender()?.getUid() == loggedInUser?.["uid"];
        let allowInteraction = isSender
          ? message?.["data"]?.["allowSenderInteraction"]
          : true;

        return !allowInteraction;
      }

      return (
        <View style={{ opacity: isDisabled() ? 0.5 : 1, marginVertical: 5 }}>
          <CometChatButton
            isLoading={scheduleLoading}
            onPress={
              isDisabled() ? () => {} : () => _handleButtonClick(buttonData)
            }
            text={
              slotError === slotErrorEnum.noSlot
                ? localize("BOOK_NEW_SLOT")
                : slotError === slotErrorEnum.error
                ? localize("TRY_AGAIN_CAMEL")
                : buttonData.getButtonText()
            }
            style={{
              backgroundColor: theme.palette.getPrimary(),
              textColor: theme.palette.getBackgroundColor(),
              borderRadius: 5,
              height: 30,
            }}
          />
        </View>
      );
    };
    const ScheduleView = () => {
      return (
        <View>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
            subTitle={`${interactiveData?.duration} ${localize("MIN")}`}
            onBackPress={() => {
              setCurrentComp((prev) => ({
                current: prev.previous,
                previous: prev.current,
              }));
            }}
          />
          <View style={styles.scheduleSecContainer}>
            <View style={styles.scheduleTimeContainer}>
              <Image
                source={ICONS.CALENDAR}
                style={{ height: 18, width: 18, marginTop: 4, marginRight: 5 }}
              />
              <Text
                style={[
                  theme.typography.subtitle1,
                  {
                    color: theme.palette.getAccent800(),
                  },
                ]}
              >
                {`${selectedSlotState?.startTime?.slice(
                  0,
                  2
                )}:${selectedSlotState?.startTime?.slice(2)}, ${
                  selectedSlotState?.selectedDay?.charAt(0)?.toUpperCase() +
                  selectedSlotState?.selectedDay?.slice(1)
                }, ${DateTime.fromFormat(
                  selectedSlotState.selectedDate,
                  dateFormats.date
                ).toFormat("dd MMMM y")}`}
              </Text>
            </View>
            <View style={styles.scheduleTimeZoneCont}>
              <Image source={ICONS.EARTH} style={{ height: 18, width: 18 }} />
              <Text
                style={[
                  theme.typography.subtitle1,
                  {
                    color: theme.palette.getAccent800(),
                    paddingVertical: 10,
                  },
                ]}
              >
                {" "}
                {interactiveData.timezoneCode}
              </Text>
            </View>
            <View style={styles.scheduleErrorCont}>
              {message &&
                _renderButton(
                  message?.getScheduleElement() as ButtonElement,
                  true
                )}
              {slotError !== slotErrorEnum.noError && (
                <Text
                  style={[
                    theme.typography.subtitle5,
                    {
                      color: theme.palette.getError(),
                      textAlign: "center",
                      marginHorizontal: 15,
                    },
                  ]}
                >
                  {slotError === slotErrorEnum.noSlot
                    ? localize("TIME_SLOT_UNAVAILABLE")
                    : localize("SOMETHING_WRONG")}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    };

    const LoadingView = () => {
      return (
        <View style={{ flex: 1 }}>
          <AvatarView
            avatar={
              interactiveData?.avatarUrl || message?.getSender()?.getAvatar()
            }
            title={
              interactiveData?.title ||
              `${localize("MEET_WITH")} ${message?.getSender()?.getName()}`
            }
          />
          <View style={styles.lodingContainer}>
            <ActivityIndicator
              size="small"
              color={theme?.palette.getAccent()}
            />
          </View>
        </View>
      );
    };

    const InteractedView = () => {
      return (
        <View style={{ padding: 5 }}>
          <CometChatQuickView
            title={message.getTitle()}
            subtitle={localize("MEETING_SCHEDULER")}
            quickViewStyle={style?.quickViewStyle ?? {}}
          />
          <Text
            style={[
              {
                marginTop: 10,
                color:
                  style?.goalCompletionTextColor ??
                  theme.palette.getAccent800(),
              },
              style?.goalCompletionTextFont ?? {},
            ]}
          >
            {message.getGoalCompletionText() ||
              localize("FORM_COMPLETION_MESSAGE")}
          </Text>
        </View>
      );
    };

    const CurrentCommponent = () => {
      switch (currentComp.current) {
        case componentEnum.loading:
          return <LoadingView />;
        case componentEnum.quickSelect:
          return <QuickSelectView />;
        case componentEnum.calendar:
          return <CalendarView />;
        case componentEnum.noTimeSlot:
          return <NoTimeSlotsView />;
        case componentEnum.timeSlot:
          return <TimeSlotView />;
        case componentEnum.schedule:
          return <ScheduleView />;
        case componentEnum.interacted:
          return <InteractedView />;
        default:
          return null;
      }
    };
    const calcDimensions = (currentComp) => {
      switch (currentComp) {
        case componentEnum.quickSelect:
          return { width: 272 };
        case componentEnum.calendar:
          return { width: 280 };
        case componentEnum.timeSlot:
          return { width: 300 };
        case componentEnum.schedule:
          return { width: 280 };
        case componentEnum.interacted:
          return { width: 272 };
        case componentEnum.noTimeSlot:
          return { width: 272 };
        default:
          return { width: 272, height: 300 };
      }
    };
    return (
      <View
        style={[
          styles.mainContainer,
          style?.border ?? {},
          {
            backgroundColor: style?.backgroundColor ?? "transparent",
          },
          compDimensions,
        ]}
      >
        <CurrentCommponent />
      </View>
    );
  }
);
