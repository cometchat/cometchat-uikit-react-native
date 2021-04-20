<div style="width:100%">
    <div style="width:50%;">
        <div align="center">
        <img align="center" width="180" height="180" alt="CometChat" src="./screenshots/logo.png">    
        </div>    
    </div>    
</div>

<br/><br/>

# CometChat React Native UI Kit

</br></br>

<div style="width:100%">
    <div style="width:100%; display:inline-block">
        <div align="center">
          <img align="left" alt="Main" src="./screenshots/main.png">    
        </div>    
    </div>    
</div>

</br></br>

CometChat React Native UI Kit is a collection of custom UI Components designed to build text chat and voice/video calling features in your application.

The UI Kit is developed to keep developers in mind and aims to reduce development efforts significantly.

---

## Prerequisites

Before you begin, ensure you have met the following requirements:

- A text editor. (e.g. [Visual Studio Code](https://code.visualstudio.com/), [Notepad++](https://notepad-plus-plus.org/), [Sublime Text](https://www.sublimetext.com/), [Atom](https://atom.io/), or [VIM](https://www.vim.org/))

- [Node](https://nodejs.org/)

- [npm](https://www.npmjs.com/get-npm)

- [React-Native](https://reactnative.dev/docs/environment-setup)

| <div align="left"><span>**Note:**<span style="font-weight:500"> Support for Expo CLI based apps.</span> </span></div>                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| If you are using Expo CLI to build a React Native app, the calling component will not work as our calling component needs native-level changes.However, you can create a React Native app using React Native CLI or use the 'expo eject' command to convert your app from an expo-managed workflow to a bare workflow. |

---

## Installing CometChat React Native UI Kit

## 1. Setup 🛠

To install React-Native UI Kit, you need to first register on CometChat Dashboard. <a href="https://app.cometchat.com/" target="_blank">Click here to sign up</a>

### i. Get your Application Keys :key:

- Create a new app
- Head over to the Quick Start or API & Auth Keys section and note the `App ID`, `Auth Key`, and `Region`.

### ii. Add the CometChat Dependency

```javascript
 npm install @cometchat-pro/react-native-chat@2.3.0 --save
```

### iii. Other required DEPENDENCIES

These packages help make the ui-kit smooth and functioning

[react-native-sound](https://github.com/zmxv/react-native-sound)</br>
[react-native-vector-icons](https://github.com/oblador/react-native-vector-icons)</br>
[react-native-elements](https://reactnativeelements.com/docs/)</br>
[react-native-fast-image](https://github.com/DylanVann/react-native-fast-image)</br>
[react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker)</br>
[react-native-document-picker](https://github.com/rnmods/react-native-document-picker)</br>
[react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler)</br>
[react-native-reanimated](https://github.com/software-mansion/react-native-reanimated)</br>
[reanimated-bottom-sheet](https://github.com/osdnk/react-native-reanimated-bottom-sheet)</br>
[react-native-video](https://github.com/react-native-video/react-native-video)</br>
[react-native-video-controls](https://github.com/itsnubix/react-native-video-controls)</br>
[@react-navigation/bottom-tabs](https://reactnavigation.org/docs/bottom-tab-navigator/)</br>
[@react-navigation/native](https://reactnavigation.org/docs/getting-started)</br>
[@react-navigation/stack](https://reactnavigation.org/docs/stack-navigator/)</br>
[@react-native-picker/picker](https://github.com/react-native-picker/picker)</br>
[react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage)</br>
[@cometchat-pro/react-native-calls](https://www.npmjs.com/package/@cometchat-pro/react-native-calls)</br>
[rn-fetch-blob](https://www.npmjs.com/package/rn-fetch-blob)</br>
[react-native-autolink](https://www.npmjs.com/package/react-native-autolink)</br>
[react-native-screens](https://www.npmjs.com/package/react-native-screens)</br>
[emoji-mart-native](https://www.npmjs.com/package/emoji-mart-native)</br>
[react-native-keep-awake](https://www.npmjs.com/package/react-native-keep-awake)</br>

<br/>

## 2. Configure CometChat inside your app

### i. Initialize CometChat 🌟

The `init()` method initializes the settings required for CometChat.
We suggest calling the `init()` method on app startup, preferably in the `created()` method of the Application class.

```javascript
import { CometChat } from '@cometchat-pro/react-native-chat';

const appID = 'APP_ID';
const region = 'REGION';
const appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .build();
CometChat.init(appID, appSetting).then(
  () => {
    console.log('Initialization completed successfully');
    // You can now call login function.
  },
  (error) => {
    console.log('Initialization failed with error:', error);
    // Check the reason for error and take appropriate action.
  },
);
```

**Note:**</br>

- Replace APP_ID and REGION with your CometChat `App ID` and `Region` in the above code.

### ii. Login your user 👤

This method takes `UID` and `Auth Key` as input parameters and returns the User object containing all the information of the logged-in user..

```javascript
import { CometChat } from '@cometchat-pro/react-native-chat';

const authKey = 'AUTH_KEY';
const uid = 'SUPERHERO1';

CometChat.login(uid, authKey).then(
  (user) => {
    console.log('Login Successful:', { user });
  },
  (error) => {
    console.log('Login failed with exception:', { error });
  },
);
```

**Note:** </br>

- Replace `AUTH_KEY` with your CometChat `Auth Key` in the above code.

- We have setup 5 users for testing having UIDs: `SUPERHERO1`, `SUPERHERO2`, `SUPERHERO3`,`SUPERHERO4` and `SUPERHERO5`.

<br/>

## 3. Add UI Kit to your project

- Clone this repository.
- Copy the `react-native-chat-ui-kit` folder to your source folder.
- Copy all the peer dependencies from package.json into your project's package.json and install them using `npm install`.

<br/>

## 4. Launch CometChat

**CometChatUI** is an option to launch a fully functional chat application using the UI Kit. In CometChatUI all the UI Components are interlinked and work together to launch a fully functional chat on your React Native application.

Usage of application in project

```javascript
import React from 'react';
import { View } from 'react-native';
import { CometChatUI } from '../cometchat-pro-react-native-ui-kit';

export default function CometChatUIView() {
  return (
    <View style={{ flex: 1 }}>
      <CometChatUI />
    </View>
  );
}
```

---

# Checkout our sample app

Visit our [React-Native sample app](https://github.com/cometchat-pro/react-native-chat-app) repo to run the React-Native sample app.

---

# Troubleshooting

- To read the full documentation on UI Kit integration visit our [Documentation](https://prodocs.cometchat.com/docs/react-native-ui-kit).

- Facing any issues while integrating or installing the UI Kit please <a href="https://app.cometchat.com/" target="_blank"> connect with us via real time support present in CometChat Dashboard.</a>

---

# Contact :mailbox:

Contact us via real time support present in [CometChat Dashboard](https://app.cometchat.com/).
