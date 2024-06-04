const NEW_LINE = /\r\n|\n|\r/;

const EVENT = 'VEVENT';
const EVENT_START = 'BEGIN';
const EVENT_END = 'END';
const START_DATE = 'DTSTART';
const END_DATE = 'DTEND';
const DESCRIPTION = 'DESCRIPTION';
const SUMMARY = 'SUMMARY';
const LOCATION = 'LOCATION';
const ALARM = 'VALARM';
const TZID = 'TZID';
const TZOFFSETFROM = 'TZOFFSETFROM';
const TZOFFSETTO = 'TZOFFSETTO';

const keyMap = {
  [START_DATE]: 'startDate',
  [END_DATE]: 'endDate',
  [DESCRIPTION]: 'description',
  [SUMMARY]: 'summary',
  [LOCATION]: 'location',
  [TZID]: 'tzid',
  [TZOFFSETFROM]: 'tzOffsetFrom',
  [TZOFFSETTO]: 'tzOffsetTo',
};

const clean = (string) => unescape(string).trim();

const icsToJson = (icsData) => {
  const array = [];
  let currentObj = {};
  let timeZoneObj = {};
  let lastKey = '';

  const lines = icsData.split(NEW_LINE);

  let isAlarm = false;
  for (let i = 0, iLen = lines.length; i < iLen; ++i) {
    const line = lines[i];
    const lineData = line.split(':');

    let key = lineData[0];
    const value = lineData[1];
    let kyParts = [];
    // console.log('--->>>   ',{key:key,value:value});
    if (key.indexOf(';') !== -1) {
      const keyParts = key.split(';');
      key = keyParts[0];
      kyParts = keyParts;
      // Maybe do something with that second part later
    }

    if (lineData.length < 2) {
      if (key.startsWith(' ') && lastKey !== undefined && lastKey.length) {
        currentObj[lastKey] += clean(line.substr(1));
      }
      continue;
    } else {
      lastKey = keyMap[key];
    }
    switch (key) {
      case EVENT_START:
        if (value === EVENT) {
          currentObj = { ...timeZoneObj };
        } else if (value === ALARM) {
          isAlarm = true;
        }
        break;
      case EVENT_END:
        isAlarm = false;
        if (value === EVENT) {
          timeZoneObj = {};
          array.push(currentObj);
        }
        break;
      case START_DATE:
        // console.log({ key, value, lineData, kyParts });
        if (kyParts.length > 1) {
          let tzid = kyParts[1]?.split('=');
          if (tzid.length > 1) currentObj[keyMap[TZID]] = tzid[1];
        }
        currentObj[keyMap[START_DATE]] = value;
        break;
      case END_DATE:
        currentObj[keyMap[END_DATE]] = value;
        break;
      case DESCRIPTION:
        if (!isAlarm) currentObj[keyMap[DESCRIPTION]] = clean(value);
        break;
      case SUMMARY:
        currentObj[keyMap[SUMMARY]] = clean(value);
        break;
      case LOCATION:
        currentObj[keyMap[LOCATION]] = clean(value);
        break;
      case TZID:
        timeZoneObj[keyMap[TZID]] = value;
        break;
      case TZOFFSETFROM:
        timeZoneObj[keyMap[TZOFFSETFROM]] = value;
        break;
      case TZOFFSETTO:
        timeZoneObj[keyMap[TZOFFSETTO]] = value;
        break;
      default:
        continue;
    }
  }

  return array;
};

export default icsToJson;
