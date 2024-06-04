// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

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


    static getComponentIdFromMessage(message :  CometChat.BaseMessage):Object{
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

    static checkIdBelongsToThisComponent(id, user :CometChat.User, group: CometChat.Group, parentMessageId :string| number): boolean{
        if(id){
          if(id['parentMessageId']  && ( id['parentMessageId'] != parentMessageId ))return false
          if((id['uid']  ||  user) && id['uid'] != user?.uid) return false;
          if( (id['guid'] ||  group)    && id['guid'] != group?.guid) return false;
        }
        return true;
    }

}