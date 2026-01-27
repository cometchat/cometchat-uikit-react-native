import {CometChatCallLogs, useTheme, Icon} from '@cometchat/chat-uikit-react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {View, TouchableOpacity} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import { useConfig } from '../../config/store';

type CallNavigationProp = StackNavigationProp<RootStackParamList, 'CallLogs'>;

const Calls: React.FC = () => {
  const [shouldHide, setShouldHide] = React.useState(false);
  const navigation = useNavigation<CallNavigationProp>();

  const oneOnOneVoiceCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVoiceCalling
  );
  const oneOnOneVideoCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVideoCalling
  );
  const groupVideoConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVideoConference
  );
  const groupVoiceConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVoiceConference
  );

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, []),
  );

  const theme = useTheme();
  const onItemPress = (item: any) => {
    navigation.navigate('CallDetails', {
      call: item,
    });
  };
  // Create TrailingView that respects visibility configuration
  const TrailingView = useCallback((call?: any, onPress?: (call: any) => void) => {
    if (!call || !onPress) return (<></>);
    const receiverType = call?.getReceiverType?.();
    const callType = call?.getType?.();
    const isUser = receiverType === 'user';
    const isAudio = callType === 'audio';

    // Check if button should be hidden based on configuration
    const shouldHide =
      (isUser && isAudio && !oneOnOneVoiceCalling) ||
      (isUser && !isAudio && !oneOnOneVideoCalling) ||
      (!isUser && isAudio && !groupVoiceConference) ||
      (!isUser && !isAudio && !groupVideoConference);

    if (shouldHide) {
      return <View />;
    }

    // Return call button - styling matches CometChatCallLogs default button
    return (
      <TouchableOpacity
        onPress={() => onPress(call)}
        style={{
          marginLeft: "auto",
        }}
      >
        <Icon
          name={call.type === "audio" ? "call" : "videocam"}
          size={24}
          color={theme.callLogsStyles.itemStyle.callIconStyle.tintColor}
          imageStyle={theme.callLogsStyles.itemStyle.callIconStyle}
        />
      </TouchableOpacity>
    );
  }, [oneOnOneVoiceCalling, oneOnOneVideoCalling, groupVoiceConference, groupVideoConference, theme]);

  return (
    <View style={{flex: 1, backgroundColor: theme.color.background1}}>
      {!shouldHide && (
        <CometChatCallLogs 
          onItemPress={onItemPress}
          TrailingView={TrailingView}
        />
      )}
    </View>
  );
};

export default Calls;
