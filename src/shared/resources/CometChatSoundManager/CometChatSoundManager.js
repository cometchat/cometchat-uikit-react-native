import { Vibration, NativeModules } from 'react-native';
const { CometChatSoundModule } = NativeModules;
import * as consts from '../../constants/UIKitConstants';
import Sound from './sound';
import {
  incomingMessageAlert,
  incomingCallAlert,
  incomingOtherMessageAlert,
  outgoingMessageAlert,
  outgoingCallAlert,
} from './resources/index';
export class CometChatSoundManager {
  static SoundOutput = Object.freeze({
    incomingCall: incomingCallAlert,
    incomingMessage: incomingMessageAlert,
    incomingMessageFromOther: incomingOtherMessageAlert,
    outgoingCall: outgoingCallAlert,
    outgoingMessage: outgoingMessageAlert,
  });

  static audio = null;
  static onPlay = async (resource, loop, isRequire) => {
    try {
      let otherAudioPlaying =
        await CometChatSoundModule.checkOtherAudioPlaying();
      if (otherAudioPlaying) {
        Vibration.vibrate(consts.PATTERN, loop);
      } else {
        if (CometChatSoundManager.audio != null) {
          CometChatSoundManager.pause();
        }
        if (isRequire) {
          CometChatSoundManager.audio = new Sound(
            resource,
            () => { },
          );
        } else {
          CometChatSoundManager.audio = new Sound(
            resource,
            Sound.MAIN_BUNDLE,
            () => { },
          );
        }
        CometChatSoundManager.audio.setCategory('playback', true);
        CometChatSoundManager.audio.setVolume(1);
        CometChatSoundManager.audio.setCurrentTime(0);
        setTimeout(() => {
          if (loop) {
            CometChatSoundManager.audio.setNumberOfLoops(-1);
          }
          CometChatSoundManager.audio.play((e) => { console.log({ e }) });
        }, 500);

      }
    } catch (error) {
      console.log("error : ", error);
    }
  };

  static async play(sound, customSound, isRequire = false) {
    let resource = null;
    if (customSound) {
      resource = customSound;
    } else {
      resource = CometChatSoundManager.SoundOutput[sound];
    }
    switch (sound) {
      case 'incomingCall':
        this.onPlay(resource, true, isRequire);
        break;
      case 'incomingMessage':
        this.onPlay(resource, false, isRequire);
        break;
      case 'incomingMessageFromOther':
        this.onPlay(resource, false, isRequire);
        break;
      case 'outgoingCall':
        this.onPlay(resource, true, isRequire);
        break;
      case 'outgoingMessage':
        this.onPlay(resource, false, isRequire);
        break;
      case 'default':
        return false;
    }
  }

  static pause() {
    if (CometChatSoundManager.audio) {
      CometChatSoundManager.audio.pause();
      Vibration.cancel();
      CometChatSoundManager.audio.release();
    }
  }
}