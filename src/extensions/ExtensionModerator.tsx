export const CheckPropertyExists = (obj: any, propkey: PropertyKey) => {
    return Object.prototype.hasOwnProperty.call(obj, propkey);
}

/**
 * Returns extention data object or null if extention data not found.
 * @param {object} message - message Object from SDK
 * @param {string} extentionKey extention tobe searched
 * @returns object or null.
 */
 export const getExtentionData = (message: any, extentionKey: string) => {
    if (message?.metadata) {
        var injectedObject = message.metadata["@injected"];
        if (injectedObject != null && injectedObject.hasOwnProperty("extensions")) {
            var extensionsObject = injectedObject["extensions"];
            if (
                extensionsObject != null &&
                extensionsObject.hasOwnProperty(extentionKey)
            ) {
                return extensionsObject[extentionKey];
            }
        }
    }
    return null;
}


/**
 * Returns extention data object or null if extention data not found.
 * @param {object} message - message Object from SDK
 * @param {string} extentionKey extention tobe searched
 * @returns object or null.
 */
export const getExtentionDataByMetaData = (metadata: any, extentionKey: string | number) => {
    
    if (metadata) {
        var injectedObject = metadata["@injected"];
        if (injectedObject != null && injectedObject.hasOwnProperty("extensions")) {
            var extensionsObject = injectedObject["extensions"];
            if (
                extensionsObject != null &&
                extensionsObject.hasOwnProperty(extentionKey)
            ) {
                return extensionsObject[extentionKey];
            }
        }
    }
    return null;
}

export const getMetadataByKey = (message: any, metadataKey: string | number) => {
    if (message.hasOwnProperty("metadata")) {
        const metadata = message["metadata"];
        if (metadata.hasOwnProperty(metadataKey)) {
            return metadata[metadataKey];
        }
    }

    return null;
};