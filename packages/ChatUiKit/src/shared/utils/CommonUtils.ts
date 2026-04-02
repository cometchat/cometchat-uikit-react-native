import { CometChat } from "@cometchat/chat-sdk-react-native";
import { IMAGE_PREFETCH_MAX_ATTEMPTS, IMAGE_PREFETCH_TIMEOUT } from "../constants/UIKitConstants";
import { Image } from "react-native";

export class CommonUtils {
  static clone<T extends any>(arg: T, seen = new WeakMap()): T {
    if (typeof arg !== "object" || !arg) {
      return arg;
    }

    // Handle circular references
    if (seen.has(arg)) {
      return seen.get(arg);
    }

    let res: any;
    if (Array.isArray(arg)) {
      res = [];
      seen.set(arg, res);
      for (const value of arg) {
        res.push(CommonUtils.clone(value, seen));
      }
      return res as T;
    } else {
      res = {};
      seen.set(arg, res);
      const descriptor = Object.getOwnPropertyDescriptors(arg);

      for (const k of Reflect.ownKeys(descriptor)) {
        const curDescriptor = descriptor[k as any];
        if (curDescriptor.hasOwnProperty("value")) {
          Object.defineProperty(res, k, {
            ...curDescriptor,
            value: CommonUtils.clone(curDescriptor["value"], seen),
          });
        } else {
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

  // Preserve SDK message class identity after merge.
    // When obj2 is a raw JSON object from the REST API history fetch,
    // it contains flat `category` and `type` own properties (e.g. "message"/"text")
    const protectedProps = ['category', 'type'];
    for (const prop of protectedProps) {
      const getterName = `get${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
      if (
        typeof (obj1 as any)[getterName] === 'function' &&
        typeof (obj2 as any)[getterName] !== 'function'
      ) {
        const correctValue = (obj1 as any)[getterName]();
        if (correctValue !== undefined && (merged as any)[prop] !== correctValue) {
          (merged as any)[prop] = correctValue;
        }
      }
    }

    return merged;
  }

  /**
   * Merge two arrays of objects based on provided keys
   */
  static mergeArrays(arr1: Array<object>, arr2: Array<object>, keys: string[]) {
    let map = new Map<string, any>();

    const getKeyValues = (obj: any, keys: string[]) => {
      const keyValues: { [key: string]: string } = {};
      keys.forEach((key) => {
        if (obj[key]) {
          keyValues[key] = obj[key];
        }
      });
      return keyValues;
    };

    // Add objects from arr1 to the map
    arr1.forEach((obj: any) => {
      const keyValues = getKeyValues(obj, keys);
      if (Object.keys(keyValues).length === 0) {
        // No keys present, use a fallback unique key
        map.set("" + Date.now() + Math.random(), obj);
      } else {
        // Store the object using the stringified key-value pairs as the key
        const compositeKey = JSON.stringify(keyValues);
        map.set(compositeKey, obj);
      }
    });

    // Process arr2 and merge with arr1 if there are matching values for any key
    arr2.forEach((obj: any) => {
      const keyValues = getKeyValues(obj, keys);

      let foundMatch = false;

      // Iterate through the map to find matches
      for (const [mapKey, mapObj] of map.entries()) {
        const mapKeyValues = JSON.parse(mapKey);

        // Check for matches with any key-value pair in the object from arr2
        for (const keyInArr2 in keyValues) {
          const valueInArr2 = keyValues[keyInArr2]; // Corresponding value

          // Check if the current key from arr2 has a matching value in map's key values
          if (mapKeyValues[keyInArr2] === valueInArr2) {
            // If match is found, merge the objects and update the map
            const mergedObj = this.mergeObjects(mapObj, obj);
            map.set(mapKey, mergedObj);
            foundMatch = true;
            break; // Exit inner loop once a match is found
          }
        }

        if (foundMatch) break; // Exit outer loop if a match was found
      }

      if (!foundMatch) {
        // No match, add object from arr2 to the map
        const compositeKey = JSON.stringify(
          Object.keys(keyValues).length ? keyValues : { key: Date.now() + Math.random() }
        );
        map.set(compositeKey, obj);
      }
    });

    // Return the merged array from the map values
    return Array.from(map.values());
  }

  static getComponentIdFromMessage(message: CometChat.BaseMessage): Object {
    let id: any = {};
    if (message.getReceiver() instanceof CometChat.User) {
      id["uid"] = message.getSender().getUid();
    } else if (message.getReceiver() instanceof CometChat.Group) {
      id["guid"] = (message.getReceiver() as CometChat.Group).getGuid();
    }
    if (message.getParentMessageId() && message.getParentMessageId() !== 0) {
      id["parentMessageId"] = message.getParentMessageId();
    }
    return id;
  }

  static checkIdBelongsToThisComponent(
    id: any,
    user: CometChat.User,
    group: CometChat.Group,
    parentMessageId: string | number
  ): boolean {
    if (id) {
      if (id["parentMessageId"] && id["parentMessageId"] != parentMessageId) return false;
      if ((id["uid"] || user) && id["uid"] != user?.getUid()) return false;
      if ((id["guid"] || group) && id["guid"] != group?.getGuid()) return false;
    }
    return true;
  }

  static async prefetchThumbnail(
    url: string,
    attempts: number = IMAGE_PREFETCH_MAX_ATTEMPTS
  ): Promise<boolean> {
    if (attempts <= 0) return false;

    try {
      // Attempt to prefetch the thumbnail image
      const result = await Image.prefetch(url);
      return result;
    } catch (error) {
      // console.log(
      //   `Failed to prefetch ${url}. Retrying in ${IMAGE_PREFETCH_TIMEOUT}ms... (${
      //     IMAGE_PREFETCH_MAX_ATTEMPTS - attempts + 1
      //   })`
      // );

      // Wait for IMAGE_PREFETCH_TIMEOUT before retrying
      await new Promise<void>((resolve) => setTimeout(resolve, IMAGE_PREFETCH_TIMEOUT));


      // Retry with reduced attempt count
      return CommonUtils.prefetchThumbnail(url, attempts - 1);
    }
  }
}
