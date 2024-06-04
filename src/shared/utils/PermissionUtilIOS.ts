import { Alert, Linking, NativeModules, Platform } from 'react-native';
import { localize } from '../../shared/resources/CometChatLocalize/CometChatLocalize';
const { FileManager } = NativeModules;

let instance: PermissionUtilIOS;
const permissionStatus = {
  'Not Determined': 0,
  'Restricted': 1,
  'Denied': 2,
  'Authorized': 3,
  'Unknown': -1,
} as const;

const permissibleResources = ['camera', 'mic'] as const;
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
      const res: Record<TPermissibleResources, TPermissionStatus> =
        await FileManager.checkResourcesPermission(['mic', 'camera']);
      for (const resourceType in res) {
        permissionStore[resourceType as TPermissibleResources] =
          res[resourceType as TPermissibleResources];
      }
      permissionStore.camera = res.camera;
      permissionStore.mic = res.mic;
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
    const res: Record<TPermissibleResources, TPermissionStatus> =
      await FileManager.requestResourcesPermission(resources);
    for (const resourceType in res) {
      permissionStore[resourceType as TPermissibleResources] =
        res[resourceType as TPermissibleResources];
    }
  }

  async startResourceBasedTask(resources: TPermissibleResources[]) {
    if (Platform.OS === 'ios') {
      const resourcePermStatuses = await this.get(resources);
      for (let i = 0; i < resourcePermStatuses.length; i++) {
        const resourcePermStatus = resourcePermStatuses[i];
        if (resourcePermStatus === this.status['Not Determined']) {
          await this.request([resources[i]]);
          [resourcePermStatuses[i]] = await this.get([resources[i]]);
        }
        if (resourcePermStatuses[i] === this.status.Denied) {
          Alert.alert(localize('RESOURCE_PERMISSION_REQUIRED'), undefined, [
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
          return false;
        }
      }
    }
    return true;
  }
}

export const permissionUtilIOS = Object.freeze(new PermissionUtilIOS());
