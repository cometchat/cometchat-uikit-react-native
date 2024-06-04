import { ButtonElement } from "../InteractiveElements/index";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageTypeConstants } from "../../../constants/UIKitConstants";

interface TimeRange {
  from: string;
  to: string;
}

interface Availability {
  [key: string]: TimeRange[];
}

interface InteractiveData {
  title?: string;
  avatarUrl?: string;
  goalCompletionText?: string;
  timezoneCode: string;
  bufferTime?: number;
  duration?: number;
  availability: Availability;
  dateRangeStart?: number;
  dateRangeEnd?: number;
  icsFileUrl?: string;
  scheduleElement: ButtonElement;
}

export class SchedulerMessage extends CometChat.InteractiveMessage {
  private interactiveData: InteractiveData;
  private title?: string;
  private avatarUrl?: string;
  private goalCompletionText?: string;
  private timezoneCode: string;
  private bufferTime?: number;
  private duration?: number;
  private availability: Availability;
  private dateRangeStart?: number;
  private dateRangeEnd?: number;
  private icsFileUrl?: string;
  private scheduleElement: ButtonElement;

  
  constructor(
    receiverId: string,
    receiverType: string,
    interactiveData: InteractiveData
    
  ) {
    super(
      receiverId,
      receiverType,
      MessageTypeConstants.scheduler,
      interactiveData
    );
    this.interactiveData = interactiveData;
    Object.assign(this, interactiveData);
  }

  // Setters
  setInteractiveData(interactiveData: InteractiveData) {
    this.interactiveData = interactiveData;
  }
  setTitle(title: string) {
    this.title = title;
  }
  setAvatarUrl(avatarUrl: string) {
    this.avatarUrl = avatarUrl;
  }
  setGoalCompletionText(goalCompletionText: string) {
    this.goalCompletionText = goalCompletionText;
  }
  setTimezoneCode(timezoneCode: string) {
    this.timezoneCode = timezoneCode;
  }
  setDuration(duration: number) {
    this.duration = duration;
  }
  setBufferTime(bufferTime: number) {
    this.bufferTime = bufferTime;
  }
  setAvailability(availability: Availability) {
    this.availability = availability;
  }
  setDateRangeStart(dateRangeStart: number) {
    this.dateRangeStart = dateRangeStart;
  }
  setDateRangeEnd(dateRangeEnd: number) {
    this.dateRangeEnd = dateRangeEnd;
  }
  setIcsFileUrl(icsFileUrl: string) {
    this.icsFileUrl = icsFileUrl;
  }
  setScheduleElement(scheduleElement: ButtonElement) {
    this.scheduleElement = ButtonElement.fromJSON(scheduleElement);
  }

  // ... more setters as needed

  // Getters
  getInteractiveData() {
    return this.interactiveData;
  }
  getTitle() {
    return this.title;
  }
  getAvatarUrl() {
    return this.avatarUrl;
  }
  getGoalCompletionText() {
    return this.goalCompletionText;
  }
  getTimezoneCode() {
    return this.timezoneCode;
  }
  getDuration() {
    return this.duration;
  }
  getBufferTime() {
    return this.bufferTime;
  }
  getAvailability() {
    return this.availability;
  }
  getDateRangeStart() {
    return this.dateRangeStart;
  }
  getDateRangeEnd() {
    return this.dateRangeEnd;
  }
  getIcsFileUrl() {
    return this.icsFileUrl;
  }
  getScheduleElement() {
    return this.scheduleElement;
  }

  // ... more getters as needed

  // Method to refresh the data in the parent class

  static fromJSON(json: any): SchedulerMessage {
    let interactiveData = json.data.interactiveData;
    const schedulerMessage = new SchedulerMessage(
      json.receiverId,
      json.receiverType,
      interactiveData
    );
    Object.assign(schedulerMessage, { ...json, ...interactiveData });
    return schedulerMessage;
  }
}
