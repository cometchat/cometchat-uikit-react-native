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

}