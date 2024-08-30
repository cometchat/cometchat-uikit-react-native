// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { anyObject } from './TypeUtils';

export class CommonUtils {

    static clone<T extends any>(arg: T): T {
        /*
            If there are additional properties attached to a function or an array object other than the standard properties,
                those properties will be ignored
            Cannot copy private properties (those that start with a "#" symbol inside a class block)
            Functions are copied by reference
        */
        if (typeof arg !== "object" || !arg) {
            return arg;
        }
        let res;
        if (Array.isArray(arg)) {
            // arg is an array, there's no hatch to fool the Array.isArray method, so lets create an array
            res = [];
            for (const value of arg) {
                res.push(CommonUtils.clone(value));
            }
            return res as T;
        }
        else {
            // arg is an object
            res = {};
            const descriptor = Object.getOwnPropertyDescriptors(arg);
            for (const k of Reflect.ownKeys(descriptor)) {
                const curDescriptor = descriptor[k as any];
                if (curDescriptor.hasOwnProperty("value")) {
                    // Property is a data property
                    Object.defineProperty(res, k, {
                        ...curDescriptor,
                        value: CommonUtils.clone(curDescriptor["value"])
                    });
                }
                else {
                    // Property is an accessor property
                    Object.defineProperty(res, k, curDescriptor);
                }
            }
            Object.setPrototypeOf(res, Object.getPrototypeOf(arg));
        }
        return res as T;
    }

    static mergeObjects(obj1: object, obj2: object) {
        // Create a new instance of the same class as obj1
        let merged = Object.create(Object.getPrototypeOf(obj1));

        // Copy properties from obj1 to the new instance
        Object.assign(merged, obj1);

        // Copy properties from obj2 to the new instance
        Object.assign(merged, obj2);

        return merged;
    }

    /**
     * Merge two arrays of objects based on a key
    */
    static mergeArrays(arr1: Array<object>, arr2: Array<object>, key: string) {
        let map = new Map();

        arr1.forEach(obj => {
            if(!obj[key]) {
                map.set("" + Date.now() + Math.random(), obj);
                return;
            }
            map.set(obj[key], obj);
        });

        arr2.forEach(obj => {
            if (map.has(obj[key]) && obj[key]) {
                let mergedObj = this.mergeObjects(map.get(obj[key]), obj);
                map.set(obj[key], mergedObj);
            } else {
                if(!obj[key]) {
                    map.set("" + Date.now() + Math.random(), obj);
                    return;
                }
                map.set(obj[key], obj);
            }
        });

        return Array.from(map.values());
    }

    static getComponentIdFromMessage(message: CometChat.BaseMessage): Object {
        let id = {};
        if (message.receiver instanceof CometChat.User) {
            id['uid'] = (message.sender as CometChat.User).uid;
        } else if (message.receiver instanceof CometChat.Group) {
            id['guid'] = (message.receiver as CometChat.Group).guid;
        }
        if (message.parentMessageId && message.parentMessageId !== 0) {
            id['parentMessageId'] = message.parentMessageId;
        }
        return id;
    }

    static checkIdBelongsToThisComponent(id, user: CometChat.User, group: CometChat.Group, parentMessageId: string | number): boolean {
        if (id) {
            if (id['parentMessageId'] && (id['parentMessageId'] != parentMessageId)) return false
            if ((id['uid'] || user) && id['uid'] != user?.uid) return false;
            if ((id['guid'] || group) && id['guid'] != group?.guid) return false;
        }
        return true;
    }

    /**
     * 
     * @param {number} timestamp
     * @returns {string} - ${Today/Yesterday/Week Of the Day/DD MONTH}, ${Year if not equal to current year} HH:MM AM/PM
     * 
     * Example return values:
     * - "Today 5:15 PM"
     * - "Yesterday 11:45 AM"
     * - "Wed 2:30 PM"
     * - "17 July 2:30 PM"
     * - "17 July, 2023 2:30 PM"
     */
    static getFormattedDateTime = (timestamp: number) => {
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
        const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
        const date = new Date(timestamp * 1000);
    
        const getWeekOfDay = () => {
          const weekDay = date.getDay();
          return weekNames[weekDay];
        };
    
        const getMonthAndDay = () => {
          const day = date.getDate();
          const month = monthNames[date.getMonth()];
          return `${day} ${month}`;
        };
    
        const getMonthDayAndYear = () => {
          const day = date.getDate();
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          return `${day} ${month}, ${year}`;
        };
    
        const getTimeFormat = () => {
          let hours = date.getHours();
          const minutes =
            date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
          const postString = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          return `${hours}:${minutes} ${postString}`;
        };
    
        const today = new Date();
        const diff = today.getTime() - date.getTime();
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const isCurrentYear = today.getFullYear() === date.getFullYear();
    
        if (diffDays === 0) {
          return `Today ${getTimeFormat()}`;
        } else if (diffDays === 1) {
          return `Yesterday ${getTimeFormat()}`;
        } else if (diffDays < 7) {
          return `${getWeekOfDay()} ${getTimeFormat()}`;
        } else if (isCurrentYear) {
          return `${getMonthAndDay()} ${getTimeFormat()}`;
        } else {
          return `${getMonthDayAndYear()} ${getTimeFormat()}`;
        }
      };
}