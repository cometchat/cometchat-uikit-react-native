import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Slider } from 'react-native-elements';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob';
import Icon from 'react-native-vector-icons/MaterialIcons';
// const imgSpeaker = require('./resources/ui_speaker.png');
// const imgPause = require('./resources/ui_pause.png');
// const imgPlay = require('./resources/ui_play.png');
// const imgPlayJumpLeft = require('./resources/ui_playjumpleft.png');
// const imgPlayJumpRight = require('./resources/ui_playjumpright.png');

export default class AudioControls extends React.Component {
  constructor() {
    super();
    this.state = {
      playState: 'paused', // playing, paused
      playSeconds: 0,
      duration: 0,
      volumeState: 'unmute',
    };
    this.sliderEditing = false;
  }

  componentDidMount() {
    this.timeout = setInterval(() => {
      if (
        this.sound &&
        this.sound.isLoaded() &&
        this.state.playState === 'playing' &&
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
      this.setState({ playState: 'paused', playSeconds: 0 });
      this.sound.setCurrentTime(0);
    }
  };

  pause = () => {
    if (this.sound) {
      this.sound.pause();
    }

    this.setState({ playState: 'paused' });
  };

  mute = () => {
    if (this.sound) {
      this.sound.setVolume(0.0);
    }

    this.setState({ volumeState: 'mute' });
  };

  unmute = () => {
    if (this.sound) {
      this.sound.setVolume(1.0);
    }

    this.setState({ volumeState: 'unmute' });
  };

  //   jumpPrev15Seconds = () => {
  //     this.jumpSeconds(-15);
  //   };
  //   jumpNext15Seconds = () => {
  //     this.jumpSeconds(15);
  //   };
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
    if (this.sound) {
      this.setState({ playState: 'playing' }, () => {
        this.sound.play(this.playComplete);
      });
    } else {
      const filepath = this.props.source;
      this.setState({ playState: 'loading' }, () => {
        this.sound = new Sound(filepath, '', (error) => {
          if (error) {
            Alert.alert('Notice', 'audio file error. (Error code : 1)');
            this.setState({ playState: 'paused' });
          } else {
            this.setState(
              {
                playState: 'playing',
                duration: this.sound.getDuration(),
              },
              () => {
                this.sound.play(this.playComplete);
              }
            );
          }
        });
      });
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        {this.state.playState === 'playing' && (
          <TouchableOpacity onPress={this.pause}>
            <Icon name="pause" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.playState === 'paused' && (
          <TouchableOpacity onPress={this.play}>
            <Icon name="play-arrow" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.playState === 'loading' && (
          // <TouchableOpacity onPress={this.play}>
          <ActivityIndicator color="#000000" size="small" />
          // </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: 'black', alignSelf: 'center', fontSize: 15 }}>
            {currentTimeString}
          </Text>
          <Text style={{ color: 'black', alignSelf: 'center', fontSize: 15 }}>
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
          thumbTouchSize={{ height: 15, width: 15 }}
          thumbStyle={{
            height: 15,
            width: 15,
            backgroundColor: 'black',
          }}
          style={{
            width: 60,
            alignSelf: 'center',
          }}
        />
        {this.state.volumeState === 'mute' && (
          <TouchableOpacity onPress={this.unmute}>
            <Icon name="volume-up" size={20} color="#000000" />
          </TouchableOpacity>
        )}
        {this.state.volumeState === 'unmute' && (
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
