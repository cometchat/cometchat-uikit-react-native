
export type UIKitSettings = {
    appId: string,
    region: string,
    authKey: string,
    subscriptionType?: string,
    autoEstablishSocketConnection?: boolean,
    overrideAdminHost?: string,
    overrideClientHost?: string,
    deviceToken?: string,
    googleApiKey?: string,
    disableCalling?: boolean,
}

export function UIKitSettings({
    appId = "xxxxxxxxxx",
    region = "xx",
    authKey = "xxxxxxxxxxxxxxxxxxxxx",
    subscriptionType,
    autoEstablishSocketConnection,
    overrideAdminHost,
    overrideClientHost,
    deviceToken,
    googleApiKey,
    disableCalling,
}: UIKitSettings): UIKitSettings {
    return {
        appId,
        region,
        authKey,
        subscriptionType,
        autoEstablishSocketConnection,
        overrideAdminHost,
        overrideClientHost,
        deviceToken,
        googleApiKey,
        disableCalling,
    }
}