import { DateTime } from "../libs/luxon/src/luxon";
export const convert24to12 = (time) => {
  if (time && typeof time === "string") {
    let [hours, minutes] = time.split(":"); // split hours and minutes
    let suffix = +hours >= 12 ? "PM" : "AM"; // set suffix as AM or PM
    hours = (+hours % 12 || 12).toString(); // convert hours from 24 to 12 hour format
    return `${hours}:${minutes} ${suffix}`; // return the format as a string
  }
  return "";
};

export const addMinutes = (time: string, minutes: number) => {
  // create a new date object
  const date = new Date();

  // split the time string into hours and minutes
  const parts = time.split(":");

  // set the time on the date object
  date.setHours(+parts[0]);
  date.setMinutes(+parts[1]);

  // add the minutes
  date.setMinutes(date.getMinutes() + minutes);

  // format and return the new time
  return `${date
    .getHours()
    .toString()
    .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}`;
};

export const convertToATimeZone = (
  time: number | string,
  timeZone: string,
  formats: "yyyy-MM-dd" | "HHmm" | string,
  usingFunc: "fromMillis" | "fromFormat" | "fromISO",
  fromFormat?: string
) => {
  if (usingFunc === "fromMillis" && typeof time === "number") {
    //@ts-ignore
    let timeZoneTime = DateTime.fromMillis(time, { zone: timeZone });
    let localTime = timeZoneTime.setZone();
    return localTime.toFormat(formats);
  }
  if (usingFunc === "fromFormat" && typeof time === "string") {
    //@ts-ignore
    let timeZoneTime = DateTime.fromFormat(time, fromFormat, {
      zone: timeZone,
    });
    let localTime = timeZoneTime.setZone();
    return localTime.toFormat(formats);
  }
  if (usingFunc === "fromISO" && typeof time === "string") {
    //@ts-ignore
    let timeZoneTime = DateTime.fromISO(time, {
      zone: timeZone,
    });
    let localTime = timeZoneTime.setZone();
    if (formats === "toISO") {
      return localTime;
    }
    return localTime.toFormat(formats);
  }
  return "";
};

export const convertToLocalTimeZone = (
  time: string,
  timeZone: string,
  formats: "yyyy-MM-dd" | "HHmm" | string
) => {
  const isoTime = DateTime.fromISO(time, {
    zone: timeZone,
  });
  const utcTime = isoTime.toUTC();
  const timeZoneOffsetInMins = new Date().getTimezoneOffset();
  const localTime = utcTime
    .minus({ minutes: timeZoneOffsetInMins })
    .toFormat(formats);
  return localTime;
};

export const convertDate = (dateStr) => {
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const time = dateStr.slice(9);
  return `${year}-${month}-${day}T${time.slice(0, 2)}:${time.slice(
    2,
    4
  )}:${time.slice(4)}`;
};

export const getFormatedDateString = ({
  date,
  format,
}: {
  date: string | Date | number;
  format: "YYYY-DD-MM" | "HHmm" | string;
}) => {
  if (typeof date === "number") {
    return DateTime.fromMillis(date).toFormat(format);
  }
  if (typeof date === "object") {
    return DateTime.fromISO(date.toISOString()).toFormat(format);
  }
  return "";
};
export const getMinSlotsFromRange = ({
  startTime,
  endTime,
  slotDuration = 30,
  selectedSlots = [],
  bufferDuration = 0,
}) => {
  const slots = []; // Array to hold all available slots

  // Convert start time and end time (HHMM format) to total minutes
  let currentStartMinutes =
    Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(2));
  let endMinutesTotal =
    Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(2));
  if (endMinutesTotal === 1439) endMinutesTotal += 1;

  // Add buffer time if the availability starts immediately after a blocked time
  const prevSlot = selectedSlots.find(
    (slot) =>
      Number(slot.endTime!.slice(0, 2)) * 60 +
        Number(slot.endTime!.slice(2)) ===
      currentStartMinutes
  );
  if (prevSlot) currentStartMinutes += bufferDuration;

  // Keep generating slots until the end of the availability range
  while (currentStartMinutes + slotDuration <= endMinutesTotal) {
    let conflictSlot = null;

    // Iterate over each selected slot to find a conflict
    for (let i = 0; i < selectedSlots.length; i++) {
      const { startTime: start, endTime: end } = selectedSlots[i];
      const slotStart = Number(start.slice(0, 2)) * 60 + Number(start.slice(2));
      const slotEnd = Number(end.slice(0, 2)) * 60 + Number(end.slice(2));

      let currentEndMinutes = currentStartMinutes + slotDuration;

      // The current slot is within the selected slot or
      // The current slot starts before and ends after the start of the selected slot or
      // The current slot starts before the end of the selected slot but ends after
      if (
        (currentStartMinutes >= slotStart && currentEndMinutes <= slotEnd) ||
        (currentStartMinutes < slotStart && currentEndMinutes > slotStart) ||
        (currentStartMinutes < slotEnd && currentEndMinutes > slotEnd)
      ) {
        conflictSlot = selectedSlots[i];
        break;
      }
    }

    // If there is no conflict, add the slot
    if (!conflictSlot) {
      slots.push(
        `${String(Math.floor(currentStartMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(currentStartMinutes % 60).padStart(2, "0")}`
      );
    } else {
      // If a conflict arises, remove the last added slot if it is not possible to add the buffer duration to it without overlapping the selected slot
      if (
        slots.length &&
        Number(conflictSlot.startTime.slice(0, 2)) * 60 +
          Number(conflictSlot.startTime.slice(2)) <
          Number(slots[slots.length - 1].slice(0, 2)) * 60 +
            Number(slots[slots.length - 1].slice(3)) +
            slotDuration +
            bufferDuration
      ) {
        slots.pop();
      }

      // Skip to the end of the conflict slot and continue to the next iteration
      currentStartMinutes =
        Number(conflictSlot.endTime.slice(0, 2)) * 60 +
        Number(conflictSlot.endTime.slice(2)) +
        bufferDuration;
      continue;
    }

    // Move to the next slot by adding the slot duration
    currentStartMinutes += slotDuration;
  }

  // Return all available slots
  return slots;
};
