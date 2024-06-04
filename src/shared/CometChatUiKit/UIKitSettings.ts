import { AIEnabler } from "../../AI/AIEnabler"
import { ExtensionsDataSource } from "../framework"

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
    aiFeatures?:AIEnabler,
    extensions?:ExtensionsDataSource[]
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
    aiFeatures,
    extensions
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
        aiFeatures,
        extensions
    }
}