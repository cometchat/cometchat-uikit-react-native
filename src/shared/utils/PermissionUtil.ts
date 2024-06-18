import {
  Alert,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { localize } from '../resources/CometChatLocalize/CometChatLocalize';
const { FileManager } = NativeModules;

let instance: PermissionUtilIOS;
const permissionStatus = {
  'Not Determined': 0,
  'Restricted': 1,
  'Denied': 2,
  'Authorized': 3,
  'Unknown': -1,
} as const;

const permissionStatusAndroid = {
  granted: 3,
  denied: 2,
  never_ask_again: 2,
} as const;

const permissibleResources = ['camera', 'mic'] as const;

const permissionMapAndroid = {
  camera: PermissionsAndroid.PERMISSIONS.CAMERA,
  mic: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
};

type TPermissibleResources = (typeof permissibleResources)[number];

type ValueOf<T> = T[keyof T];
type TPermissionStatus = ValueOf<typeof permissionStatus>;

const permissionStore: Record<TPermissibleResources, TPermissionStatus> = {
  camera: permissionStatus.Unknown,
  mic: permissionStatus.Unknown,
};

class PermissionUtilIOS {
  status = permissionStatus;
  constructor() {
    if (instance) {
      throw new Error('New instance cannot be created!!');
    }
    instance = this;
  }

  async init() {
    try {
      if (Platform.OS === "ios") {
        const res: Record<TPermissibleResources, TPermissionStatus> =
          await FileManager.checkResourcesPermission(['mic', 'camera']);
        for (const resourceType in res) {
          permissionStore[resourceType as TPermissibleResources] =
            res[resourceType as TPermissibleResources];
        }
        permissionStore.camera = res.camera;
        permissionStore.mic = res.mic;
      } else if (Platform.OS === "android") {
        for (const resourceType of permissibleResources) {
          const isGranted = await PermissionsAndroid.check(permissionMapAndroid[resourceType]);
          permissionStore[resourceType] = isGranted ? permissionStatus.Authorized : permissionStatus['Not Determined'];
        }
      }
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async get(resources: TPermissibleResources[]) {
    return resources.map((resource) => {
      if (!permissibleResources.includes(resource)) {
        throw new Error('Invalid resource type');
      }
      return permissionStore[resource];
    });
  }

  async request(resources: TPermissibleResources[]) {
    for (const resource of resources) {
      if (!permissibleResources.includes(resource)) {
        throw new Error('Invalid resource type');
      }
    }
    if (Platform.OS === 'ios') {
      const res: Record<TPermissibleResources, TPermissionStatus> =
        await FileManager.requestResourcesPermission(resources);
      for (const resourceType in res) {
        permissionStore[resourceType as TPermissibleResources] =
          res[resourceType as TPermissibleResources];
      }
    } else if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.requestMultiple(resources.map(item => permissionMapAndroid[item]));
      const permissionMapAndroidRevert = {};
      for (const resource in permissionMapAndroid) {
        permissionMapAndroidRevert[permissionMapAndroid[resource]] = resource;
      }
      for (const androidResource in res) {
        permissionStore[permissionMapAndroidRevert[androidResource]] =
          permissionStatusAndroid[res[androidResource]];
      }
    }
  }

  async startResourceBasedTask(resources: TPermissibleResources[]) {
    const resourcePermStatuses = await this.get(resources);
    let allResourcesAllowed = true;
    for (let i = 0; i < resourcePermStatuses.length; i++) {
      const resourcePermStatus = resourcePermStatuses[i];
      if (resourcePermStatus === this.status['Not Determined'] || (Platform.OS === "android" && resourcePermStatuses[i] === this.status.Denied)) {
        await this.request([resources[i]]);
        [resourcePermStatuses[i]] = await this.get([resources[i]]);
      }
      if (resourcePermStatuses[i] === this.status.Denied) {
        allResourcesAllowed = false;
      }
    }
    if (allResourcesAllowed === false) {
      Alert.alert(undefined, localize('CAMERA_PERMISSION'), [
        {
          style: 'cancel',
          text: localize('CANCEL'),
        },
        {
          style: 'default',
          text: localize('SETTINGS'),
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]);
    }
    return allResourcesAllowed;
  }
}

export const permissionUtil = Object.freeze(new PermissionUtilIOS());
