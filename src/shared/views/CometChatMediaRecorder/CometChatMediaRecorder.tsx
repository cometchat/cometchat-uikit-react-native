import React, { useContext, useEffect } from 'react';
import { CometChatContext, CometChatContextType, ImageType } from "../..";
import { View, TouchableOpacity, Text, Image, NativeModules, FlatList } from "react-native";
import { Style } from "./style";
import { ICONS } from '../../framework/resources';
import { MediaRecorderStyle, MediaRecorderStyleInterface } from './MediaRecorderStyle';

let recordedTime = 0, stopRecordingIntervalId = null;
export interface CometChatMediaRecorderInterface {
    onClose?: Function;
    onPlay?: Function;
    onPause?: Function;
    onStop?: Function;
    onSend?: Function;
    onStart?: Function;
    style?: MediaRecorderStyleInterface;
    mediaRecorderStyle?: MediaRecorderStyleInterface;
    pauseIconUrl?: ImageType;
    playIconUrl?: ImageType;
    recordIconUrl?: ImageType;
    deleteIconUrl?: ImageType;
    stopIconUrl?: ImageType;
    submitIconUrl?: ImageType;
}

let timerIntervalId = null;
export const CometChatMediaRecorder = (props: CometChatMediaRecorderInterface) => {
    const {
        onClose, style, onPause, onPlay, onSend, onStop, onStart, mediaRecorderStyle,
        pauseIconUrl, playIconUrl, recordIconUrl, deleteIconUrl, stopIconUrl, submitIconUrl
    } = props;

    const [time, setTime] = React.useState(0);
    const [recordedFile, setRecordedFile] = React.useState("");
    const [recordedPlaying, setRecordedPlaying] = React.useState(false);

    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const _style = new MediaRecorderStyle({
        ...style,
        ...mediaRecorderStyle,
        submitIconTint: Boolean(recordedFile) ? theme?.palette.getPrimary() : theme?.palette.getAccent400(),
    });

    const {
        pauseIconTint,
        playIconTint,
        closeIconTint,
        stopIconTint,
        submitIconTint,
        audioBarTint,
        timerTextFont,
        timerTextstyle,
        timerTextColor,
    } = _style;

    useEffect(() => {
        NativeModules.FileManager.startRecording((filepath) => { console.log("Filepath startRecording", filepath) });
        startInterval();
        return () => {
            NativeModules.FileManager.deleteFile((success) => console.log("Filepath delete", success));
            NativeModules.FileManager.releaseMediaResources((result) => { });
            clearInterval(timerIntervalId)
            setRecordedFile("");
            recordedPlaying && setRecordedPlaying(false);
        }
    }, [])

    const startInterval = () => {
        timerIntervalId = setInterval(timer, 1000);
    }

    const ImageButton = (props: any) => {
        const { image, onClick, buttonStyle, imageStyle, disabled } = props;
        return (
            <TouchableOpacity onPress={disabled ? () => { } : onClick}
                activeOpacity={disabled ? 1 : .5}
                style={buttonStyle}>
                <Image source={image} style={[{ height: 24, width: 24 }, imageStyle]} />
            </TouchableOpacity>
        );
    };

    const _onStop = () => {
        NativeModules.FileManager.releaseMediaResources((result) => {
            console.log(time, "Filepath _stopRecorderAudio", result);
            recordedTime = time;
            setRecordedFile(JSON.parse(result)?.file);
            onStop && onStop(JSON.parse(result)?.file);
        })

        clearInterval(timerIntervalId)
    }

    const _onStart = () => {
        _onPause();
        setTime(0);
        startInterval();
        setRecordedFile("");
        setRecordedPlaying(false);
        NativeModules.FileManager.deleteFile((success) => {
            console.log("Filepath delete", success)
            NativeModules.FileManager.startRecording((result) => {
                console.log("Filepath onRecorderAudioStarted", result);
            })
        });
        onPause && onPause();
        onStart && onStart();
    }

    const _onPlay = () => {
        NativeModules.FileManager.playAudio((filepath) => {
            console.log(recordedTime, "Filepath _playRecorderAudio", filepath);
            onPlay && onPlay();
            setRecordedPlaying(true);
            stopRecordingIntervalId = setTimeout(() => {
                onPause && onPause();
                setRecordedPlaying(false);
                clearTimeout(stopRecordingIntervalId);
            }, recordedTime * 1000)
        })
    }

    const _onPause = () => {
        NativeModules.FileManager.pausePlaying((filepath) => {
            console.log("Filepath onRecorderAudioPaused", filepath);
            onPause && onPause();
            setRecordedPlaying(false);
            clearTimeout(stopRecordingIntervalId);
            console.log("timeout cleared", stopRecordingIntervalId)
        })
    }

    const _onClose = () => {
        _onPause();
        setRecordedFile("");
        setRecordedPlaying(false);
        NativeModules.FileManager.releaseMediaResources((filepath) => {
            console.log("Filepath onClose", filepath);
        })
        onClose && onClose();
    }

    const _onSend = () => {
        NativeModules.FileManager.releaseMediaResources((result) => {
            console.log("Filepath _stopRecorderAudio", result);
        })
        onSend && onSend(recordedFile);
    }

    const timer = () => {
        setTime(time => time + 1);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    const _render = ({ item, index }) => {
        return (
            <View style={[Style.soundBar, audioBarTint && { backgroundColor: audioBarTint }]} />
        )
    }

    console.log("timer", time)
    if (time === 1200 && !recordedFile) {
        _onStop();
    }

    let soundBars = Array.from(Array(time).keys());

    console.log("soundBars", soundBars)

    return (
        <View style={Style.container}>
            <View
                style={[Style.soundBarContainer]}>
                {Boolean(recordedFile) && <>
                    {!recordedPlaying ? <ImageButton
                        image={playIconUrl || ICONS.PLAY}
                        imageStyle={[Style.imageStyle, playIconTint && { tintColor: playIconTint }]}
                        onClick={_onPlay}
                        buttonStyle={[Style.buttonStyle, { width: "10%" }]}
                    /> :
                        <ImageButton
                            image={pauseIconUrl || ICONS.PAUSE}
                            imageStyle={[Style.imageStyle, pauseIconTint && { tintColor: pauseIconTint }]}
                            onClick={_onPause}
                            buttonStyle={[Style.buttonStyle, { width: "10%" }]}
                        />
                    }
                </>}
                <View style={[Style.timerContainer, { flexDirection: Boolean(recordedFile) ? "row-reverse" : "row" }]}>
                    <Text style={[Style.timerText,
                    timerTextFont && { fontFamily: timerTextFont },
                    timerTextColor && { color: timerTextColor },
                    timerTextstyle && { fontStyle: timerTextstyle },
                    !Boolean(recordedFile) && { marginRight: 10 }
                    ]}>{formatTime(time)}</Text>
                    <FlatList
                        data={soundBars}
                        keyExtractor={(item) => item}
                        renderItem={_render}
                        horizontal={true}
                        style={{
                            marginRight: Boolean(recordedFile) ? 10 : 0,
                            width: Boolean(recordedFile) ? "75%" : "85%",
                        }}
                    />
                </View>
            </View>
            <View
                style={Style.buttonContainer}
            >
                <ImageButton
                    image={deleteIconUrl || ICONS.DELETE}
                    imageStyle={[Style.imageStyle, closeIconTint && { tintColor: closeIconTint }]}
                    onClick={_onClose}
                    buttonStyle={[Style.buttonStyle]}
                />
                {Boolean(recordedFile) ?
                    <ImageButton
                        image={recordIconUrl || ICONS.MICROPHONE}
                        imageStyle={[Style.imageStyle, stopIconTint && { tintColor: stopIconTint }]}
                        onClick={_onStart}
                        buttonStyle={[Style.buttonStyle]}
                    />
                    : <ImageButton
                        image={stopIconUrl || ICONS.STOP_PLAYER}
                        imageStyle={[Style.imageStyle, stopIconTint && { tintColor: stopIconTint }]}
                        onClick={_onStop}
                        buttonStyle={[Style.buttonStyle]}
                    />}
                <ImageButton
                    image={submitIconUrl || ICONS.SEND}
                    imageStyle={[Style.imageStyle, submitIconTint && { tintColor: submitIconTint }]}
                    onClick={_onSend}
                    disabled={!Boolean(recordedFile)}
                    buttonStyle={[Style.buttonStyle]}
                />
            </View>
        </View>
    )
}

CometChatMediaRecorder.defaultProps = {
    style: new MediaRecorderStyle({}),
}