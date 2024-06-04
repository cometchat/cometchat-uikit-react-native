//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";

const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

export const makeExtentionCall = (extentionType, callMethod, extentionAction, parameters) => {
  return CometChat.callExtension(extentionType, callMethod, extentionAction, parameters);
}

export const messageStatus = Object.freeze({
  inprogress: "inprogress",
  success: "success",
  error: "error"
});

export const emailPattern =
    wordBoundary.start +
    `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
    wordBoundary.end

export const urlPattern =
    wordBoundary.start +
    `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
    wordBoundary.end

export const phoneNumPattern =
    wordBoundary.start +
    `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
    wordBoundary.end

export const ID = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return "_" + Math.random().toString(36).substr(2, 9);
};

export const getUnixTimestamp = () => {
  return Math.round(+new Date() / 1000);
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
