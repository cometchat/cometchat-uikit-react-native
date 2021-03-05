import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Slider } from 'react-native-elements';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob';
import Icon from 'react-native-vector-icons/MaterialIcons';
import style from './styles';
import { logger } from '../../../utils/common';

const PLAY_STATE_PAUSED = PLAY_STATE_PAUSED;
const PLAY_STATE_PLAYING = 'playing';
const PLAY_STATE_LOADING = 'loading';
const VOLUME_STATE_UNMUTE = 'unmute';
const VOLUME_STATE_MUTE = 'mute';

export default class AudioControls extends React.Component {
  constructor() {
    super();
    this.state = {
      playState: PLAY_STATE_PAUSED, // playing, paused
      playSeconds: 0,
      duration: 0,
      volumeState: VOLUME_STATE_UNMUTE,
    };
    this.sliderEditing = false;
  }

  componentDidMount() {
    this.timeout = setInterval(() => {
      if (
        this.sound &&
        this.sound.isLoaded() &&
        this.state.playState === PLAY_STATE_PLAYING &&
        !this.sliderEditing
      ) {
        this.sound.getCurrentTime((seconds) => {
          this.setState({ playSeconds: seconds });
        });
      }
    }, 100);
  }

  componentWillUnmount() {
    if (this.sound) {
      this.sound.release();
      this.sound = null;
    }
    if (this.timeout) {
      clearInterval(this.timeout);
    }
  }

  getAudioTimeString(seconds) {
    this.m = parseInt(seconds / 60, 10);
    this.s = parseInt(seconds % 60, 10);

    return `${this.m}:${this.s < 10 ? `0${this.s}` : this.s}`;
  }

  onSliderEditStart = () => {
    this.sliderEditing = true;
  };

  onSliderEditEnd = () => {
    this.sliderEditing = false;
  };

  onSliderEditing = (value) => {
    if (this.sound) {
      this.sound.setCurrentTime(value);
      this.setState({ playSeconds: value });
    }
  };

  playComplete = (success) => {
    if (this.sound) {
      if (!success) {
        Alert.alert('Notice', 'audio file error. (Error code : 2)');
      }
      this.setState({ playState: PLAY_STATE_PAUSED, playSeconds: 0 });
      this.sound.setCurrentTime(0);
    }
  };

  pause = () => {
    if (this.sound) {
      this.sound.pause();
    }

    this.setState({ playState: PLAY_STATE_PAUSED });
  };

  mute = () => {
    if (this.sound) {
      this.sound.setVolume(0.0);
    }

    this.setState({ volumeState: VOLUME_STATE_MUTE });
  };

  unmute = () => {
    if (this.sound) {
      this.sound.setVolume(1.0);
    }

    this.setState({ volumeState: VOLUME_STATE_UNMUTE });
  };

  jumpSeconds = (secsDelta) => {
    if (this.sound) {
      this.sound.getCurrentTime((secs) => {
        let nextSecs = secs + secsDelta;
        if (nextSecs < 0) nextSecs = 0;
        else if (nextSecs > this.state.duration) nextSecs = this.state.duration;
        this.sound.setCurrentTime(nextSecs);
        this.setState({ playSeconds: nextSecs });
      });
    }
  };

  play = async () => {
    try {
      if (this.sound) {
        this.setState({ playState: PLAY_STATE_PLAYING }, () => {
          this.sound.play(this.playComplete);
        });
      } else {
        const filepath = this.props.source;
        this.setState({ playState: PLAY_STATE_LOADING }, () => {
          this.sound = new Sound(filepath, '', (error) => {
            if (error) {
              Alert.alert('Notice', 'audio file error. (Error code : 1)');
              this.setState({ playState: PLAY_STATE_PAUSED });
            } else {
              this.setState(
                {
                  playState: PLAY_STATE_PLAYING,
                  duration: this.sound.getDuration(),
                },
                () => {
                  this.sound.play(this.playComplete);
                },
              );
            }
          });
        });
      }
    } catch (error) {
      logger(error);
    }
  };

  download = () => {
    RNFetchBlob.config({
      // add this option that makes response data to be stored as a file,
      // this is much more performant.
      fileCache: true,
      appendExt: 'mp3',
    })
      .fetch('GET', this.props.source, {
        // some headers ..
      })
      .then(() => {
        Alert.alert('Audio Downloaded');
      });
  };

  render() {
    const currentTimeString = this.getAudioTimeString(this.state.playSeconds);
    const durationString = this.getAudioTimeString(this.state.duration);

    return (
      <View style={style.audioControlContainer}>
        {this.state.playState === PLAY_STATE_PLAYING && (
          <TouchableOpacity onPress={this.pause}>
            <Icon name="pause" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.playState === PLAY_STATE_PAUSED && (
          <TouchableOpacity onPress={this.play}>
            <Icon name="play-arrow" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.playState === PLAY_STATE_LOADING && (
          <ActivityIndicator color="#000000" size="small" />
        )}
        <View style={style.audioControlTimeContainer}>
          <Text style={style.audioControlTimeText}>{currentTimeString}</Text>
          <Text style={style.audioControlTimeText}>
            {'/'}
            {durationString}
          </Text>
        </View>
        <Slider
          onTouchStart={this.onSliderEditStart}
          onTouchEnd={this.onSliderEditEnd}
          onSlidingComplete={this.onSliderEditing}
          value={this.state.playSeconds}
          maximumValue={this.state.duration}
          maximumTrackTintColor="#595a5a"
          minimumTrackTintColor="black"
          step={1}
          allowTouchTrack
          thumbTouchSize={style.thumbTouchSize}
          thumbStyle={style.thumbStyle}
          style={style.sliderStyle}
        />
        {this.state.volumeState === VOLUME_STATE_MUTE && (
          <TouchableOpacity onPress={this.unmute}>
            <Icon name="volume-up" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.volumeState === VOLUME_STATE_UNMUTE && (
          <TouchableOpacity onPress={this.mute}>
            <Icon name="volume-off" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={this.download}>
          <Icon name="file-download" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
    );
  }
}
