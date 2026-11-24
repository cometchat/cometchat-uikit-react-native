export const AppConstants = {
  fcmProviderId: '',
  apnsProviderId: '',
  authKey: '',
  appId: '',
  region: '',
  subscriptionType: 'ALL_USERS',
  versionNumber: 'V5.6.0',
  /**
   * The sample app turns offline support ON (the kit itself keeps it OFF unless the app passes
   * `UIKitSettings.offline`). Set to `false` to run the sample with offline off.
   */
  offlineEnabled: true,
  webClientId:
    '',
  iosClientId:
    '',
};

export const SCREEN_CONSTANTS = {
  LOGIN: 'Login',
  APP_CRED: 'AppCredentials',
  SAMPLE_USER: 'SampleUser',
  BOTTOM_TAB_NAVIGATOR: 'BottomTabNavigator',
  AGENTS: 'Agents',
  MESSAGES: 'Messages',
} as const;
