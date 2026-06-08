import React from "react";
import { DeepPartial } from "./types";
import { useCometChatTranslation } from "../resources/CometChatLocalizeNew";
import { localizedDateHelperInstance } from "./LocalizedDateHelper";
import dayjs from "dayjs";

export function deepMerge<
  T extends Record<string, any>,
  U extends DeepPartial<T> & Record<string, any>
>(obj1: T, obj2: U, ...rest: (DeepPartial<T> & Record<string, any>)[]): T & U {
  // Helper function to determine if a value is a plain object
  function isObject(value: any): value is object {
    if (React.isValidElement(value)) return false;
    return value && typeof value === "object" && !Array.isArray(value);
  }

  // Main deep merge function
  function merge(
    target: Record<string, any>,
    source: Record<string, any>,
    replace: boolean = false
  ): Record<string, any> {
    const output = replace ? target : { ...target };

    for (const key in source) {
      if (isObject(source[key])) {
        if (isObject(target[key])) {
          output[key] = merge(target[key], source[key]);
        } else {
          output[key] = merge({}, source[key]);
        }
      } else if (source[key] !== undefined) {
        output[key] = source[key];
      }
    }

    return output;
  }

  // Start merging obj1 and obj2, then recursively merge the rest of the objects
  let result = merge(obj1, obj2) as T & U;
  for (const obj of rest) {
    merge(result, obj, true) as T & U;
  }

  return result;
}

export function deepClone<T>(obj: T, seen = new WeakMap()): T {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (seen.has(obj)) {
    return seen.get(obj);
  }

  let clone: any;
  if (Array.isArray(obj)) {
    clone = [];
    seen.set(obj, clone);
    for (const item of obj) {
      clone.push(deepClone(item, seen));
    }
  } else {
    clone = Object.create(null); // Avoid prototype issues
    seen.set(obj, clone);

    for (const key of Object.keys(obj)) {
      clone[key] = deepClone((obj as any)[key], seen);
    }
  }

  return clone as T;
}

export function getLastSeenTime(timestamp: number | null | undefined): string {
  try {
    // Hook must be called unconditionally (Rules of Hooks)
    const { language, t } = useCometChatTranslation();

    if (timestamp === null || timestamp === undefined) {
      return t("OFFLINE");
    }

    // Convert to milliseconds if in seconds
    if (String(timestamp).length === 10) {
      timestamp *= 1000;
    }

    // Set the appropriate Day.js locale

    // Set the appropriate Day.js locale
    dayjs.locale(language);

    const now = dayjs();
    const lastSeenTime = dayjs(timestamp);
    const diffInMinutes = now.diff(lastSeenTime, "minute");
    const diffInHours = now.diff(lastSeenTime, "hour");
    const diffInDays = now.diff(lastSeenTime, "day");

    // For very recent times (< 1 min) → "a few seconds ago"
    if (diffInMinutes < 1) {
      const relativeTimeString = lastSeenTime.fromNow();
      // Day.js will give "a few seconds ago" localized
      return `${t("LAST_SEEN")} ${relativeTimeString}`;
    }

    // For times less than 24 hours → relative ("X minutes ago", "X hours ago")
    if (diffInHours < 24) {
      const relativeTimeString = lastSeenTime.fromNow();
      return `${t("LAST_SEEN")} ${relativeTimeString}`;
    }

    // For yesterday with time
    if (diffInDays === 1) {
      const timeFormat = localizedDateHelperInstance.getFormattedDate(
        timestamp,
        "timeFormat",
        language
      );
      return `${t("LAST_SEEN")} ${t("YESTERDAY")} ${timeFormat}`;
    }

    // For dates within the past week → weekday + time
    if (diffInDays < 7) {
      const formattedDate = localizedDateHelperInstance.getFormattedDate(
        timestamp,
        "dayWeekDayDateTimeFormat",
        language
      );
      return `${t("LAST_SEEN")} ${formattedDate}`;
    }

    // Older dates → full date + time
    return `${t("LAST_SEEN")} ${localizedDateHelperInstance.getFormattedDate(
      timestamp,
      "dayDateTimeFormat",
      language
    )}`;
  } catch (e) {
    console.log(e);
    return "";
  }
}