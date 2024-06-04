export const CheckPropertyExists = (obj, propkey) => {
    return Object.prototype.hasOwnProperty.call(obj, propkey);
}

/**
 * Returns extention data object or null if extention data not found.
 * @param {object} message - message Object from SDK
 * @param {string} extentionKey extention tobe searched
 * @returns object or null.
 */
 export const getExtentionData = (message, extentionKey) => {
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
export const getExtentionDataByMetaData = (metadata, extentionKey) => {
    
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

export const getMetadataByKey = (message, metadataKey) => {
    if (message.hasOwnProperty("metadata")) {
        const metadata = message["metadata"];
        if (metadata.hasOwnProperty(metadataKey)) {
            return metadata[metadataKey];
        }
    }

    return null;
};