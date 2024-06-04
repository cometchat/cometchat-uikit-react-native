import { NativeModules, NativeEventEmitter } from 'react-native';
const {CometChatSoundModule} = NativeModules ;
var IsAndroid = CometChatSoundModule.IsAndroid;
var IsWindows = CometChatSoundModule.IsWindows;
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";
var eventEmitter = new NativeEventEmitter(CometChatSoundModule);

var nextKey = 0;

function isRelativePath(path) {
  return !/^(\/|http(s?)|asset|file)/.test(path);
}

function calculateRelativeVolume(volume, pan) {
  // calculates a lower volume relative to the pan value
  const relativeVolume = (volume * (1 - Math.abs(pan)));
  return Number(relativeVolume.toFixed(1));
}

function setAndroidVolumes(sound) {
  // calculates the volumes for left and right channels
  if (sound._pan) {
    const relativeVolume = calculateRelativeVolume(sound._volume, sound._pan);
    if (sound._pan < 0) {
      // left is louder
      CometChatSoundModule.setVolume(sound._key, sound._volume, relativeVolume);
    } else {
      // right is louder
      CometChatSoundModule.setVolume(sound._key, relativeVolume, sound._volume);
    }
  } else {
    // no panning, same volume on both channels
    CometChatSoundModule.setVolume(sound._key, sound._volume, sound._volume);
  }
}

class Sound {
  constructor(filename, basePath, onError, options) {
    var asset = resolveAssetSource(filename);
    if (asset) {
      this._filename = asset.uri;
      onError = basePath;
    } else {
      this._filename = basePath ? basePath + '/' + filename : filename;

      if (IsAndroid && !basePath && isRelativePath(filename)) {
        this._filename = filename.toLowerCase().replace(/\.[^.]+$/, '');
      }
    }

    

    this._loaded = false;
    this._key = nextKey++;
    this._playing = false;
    this._duration = -1;
    this._numberOfChannels = -1;
    this._volume = 1;
    this._pan = 0;
    this._numberOfLoops = 0;
    this._speed = 1;
    this._pitch = 1;
    CometChatSoundModule.prepare(this._filename, this._key, options || {}, (error, props) => {
      if (props) {
        if (typeof props.duration === 'number') {
          this._duration = props.duration;
        }
        if (typeof props.numberOfChannels === 'number') {
          this._numberOfChannels = props.numberOfChannels;
        }
      }
      if (error === null) {
        this._loaded = true;
        this.registerOnPlay();
      }
     // onError && onError(error, props);
    });
  }

  registerOnPlay() {
    if (this.onPlaySubscription != null) {
      console.warn('On Play change event listener is already registered');
      return;
    }

    if (!IsWindows) {
      this.onPlaySubscription = eventEmitter.addListener(
        'onPlayChange',
        (param) => {
          const { isPlaying, playerKey } = param;
          if (playerKey === this._key) {
            if (isPlaying) {
              this._playing = true;
            }
            else {
              this._playing = false;
            }
          }
        }
      );
    }
  };
  static enable(enabled) {
    CometChatSoundModule.enable(enabled);
  }
  static enableInSilenceMode(enabled) {
    if (!IsAndroid && !IsWindows) {
      CometChatSoundModule.enableInSilenceMode(enabled);
    }
  }
  static setActive(value) {
    if (!IsAndroid && !IsWindows) {
      CometChatSoundModule.setActive(value);
    }
  }
  static setCategory(value, mixWithOthers = false) {
    if (!IsWindows) {
      CometChatSoundModule.setCategory(value, mixWithOthers);
    }
  }
  static setMode(value) {
    if (!IsAndroid && !IsWindows) {
      CometChatSoundModule.setMode(value);
    }
  }
  static setSpeakerPhone(value) {
    if (!IsAndroid && !IsWindows) {
      CometChatSoundModule.setSpeakerPhone(value);
    }
  }
  isLoaded() {
    return this._loaded;
  }
  play(onEnd) {
    if (this._loaded) {
      CometChatSoundModule.play(this._key, (successfully) => onEnd && onEnd(successfully));
    } else {
      onEnd && onEnd(false);
    }
    return this;
  }
  pause(callback) {
    if (this._loaded) {
      CometChatSoundModule.pause(this._key, () => {
        this._playing = false;
        callback && callback();
      });
    }
    return this;
  }
  stop(callback) {
    if (this._loaded) {
      CometChatSoundModule.stop(this._key, () => {
        this._playing = false;
        callback && callback();
      });
    }
    return this;
  }
  reset() {
    if (this._loaded && IsAndroid) {
      CometChatSoundModule.reset(this._key);
      this._playing = false;
    }
    return this;
  }
  release() {
    if (this._loaded) {
      CometChatSoundModule.release(this._key);
      this._loaded = false;
      if (!IsWindows) {
        if (this.onPlaySubscription != null) {
          this.onPlaySubscription.remove();
          this.onPlaySubscription = null;
        }
      }
    }
    return this;
  }
  getFilename() {
    return this._filename;
  }
  getDuration() {
    return this._duration;
  }
  getNumberOfChannels() {
    return this._numberOfChannels;
  }
  getVolume() {
    return this._volume;
  }
  getSpeed() {
    return this._speed;
  }
  getPitch() {
    return this._pitch;
  }
  setVolume(value) {
    this._volume = value;
    if (this._loaded) {
      if (IsAndroid) {
        setAndroidVolumes(this);
      } else {
        CometChatSoundModule.setVolume(this._key, value);
      }
    }
    return this;
  }
  setPan(value) {
    this._pan = value;
    if (this._loaded) {
      if (IsWindows) {
        throw new Error('#setPan not supported on windows');
      } else if (IsAndroid) {
        setAndroidVolumes(this);
      } else {
        CometChatSoundModule.setPan(this._key, value);
      }
    }
    return this;
  }
  getSystemVolume(callback) {
    if (!IsWindows) {
      CometChatSoundModule.getSystemVolume(callback);
    }
    return this;
  }
  setSystemVolume(value) {
    if (IsAndroid) {
      CometChatSoundModule.setSystemVolume(value);
    }
    return this;
  }
  getPan() {
    return this._pan;
  }
  getNumberOfLoops() {
    return this._numberOfLoops;
  }
  setNumberOfLoops(value) {
    this._numberOfLoops = value;
    if (this._loaded) {
      if (IsAndroid || IsWindows) {
        CometChatSoundModule.setLooping(this._key, !!value);
      } else {
        CometChatSoundModule.setNumberOfLoops(this._key, value);
      }
    }
    return this;
  }
  setSpeed(value) {
    this._speed = value;
    if (this._loaded) {
      if (!IsWindows) {
        CometChatSoundModule.setSpeed(this._key, value);
      }
    }
    return this;
  }
  setPitch(value) {
    this._pitch = value;
    if (this._loaded) {
      if (IsAndroid) {
        CometChatSoundModule.setPitch(this._key, value);
      }
    }
    return this;
  }
  getCurrentTime(callback) {
    if (this._loaded) {
      CometChatSoundModule.getCurrentTime(this._key, callback);
    }
  }
  setCurrentTime(value) {
    if (this._loaded) {
      CometChatSoundModule.setCurrentTime(this._key, value);
    }
    return this;
  }
  // android only
  setSpeakerphoneOn(value) {
    if (IsAndroid) {
      CometChatSoundModule.setSpeakerphoneOn(this._key, value);
    }
  }
  isPlaying() {
    return this._playing;
  }
  async checkOtherAudioPlaying() {
    try{
     return await CometChatSoundModule.checkOtherAudioPlaying();
    }
     catch(error){
       return false;
     } 
   }
}

























// ios only

// This is deprecated.  Call the static one instead.

Sound.prototype.setCategory = function(value) {
  Sound.setCategory(value, false);
}

Sound.MAIN_BUNDLE = CometChatSoundModule.MainBundlePath;
Sound.DOCUMENT = CometChatSoundModule.NSDocumentDirectory;
Sound.LIBRARY = CometChatSoundModule.NSLibraryDirectory;
Sound.CACHES = CometChatSoundModule.NSCachesDirectory;

export default Sound;