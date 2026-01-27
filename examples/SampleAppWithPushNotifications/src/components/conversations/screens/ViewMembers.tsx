import React from 'react';
import { BackHandler, View } from 'react-native';
import {
  CometChatGroupMembers,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import {
  useRoute,
  useNavigation,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { useConfig } from '../../../config/store';

const ViewMembers: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ViewMembers'>>();
  const navigation = useNavigation();
  const { group } = route.params;
  const theme = useTheme();
  const kickUsers =  useConfig(
    (state) => state.settings.chatFeatures.moderatorControls.kickUsers
  );
  const banUsers =  useConfig(
    (state) => state.settings.chatFeatures.moderatorControls.banUsers
  );
  const promoteDemoteMembers =  useConfig(
    (state) => state.settings.chatFeatures.moderatorControls.promoteDemoteMembers
  );
  const userAndFriendsPresence = useConfig(
      (state) => state.settings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
   );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Navigate back to message screen (same as your onPress handler)
        navigation.goBack();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  return (
    <View style={[{ flex: 1, backgroundColor: theme.color.background1 }]}>
      <CometChatGroupMembers
        group={group}
        onBack={() => {
          navigation.goBack();
        }}
        selectionMode="none"
        showBackButton={true}
        hideKickMemberOption={!kickUsers}
        hideBanMemberOption={!banUsers}
        hideScopeChangeOption={!promoteDemoteMembers}
        usersStatusVisibility={userAndFriendsPresence}
      />
    </View>
  );
};

export default ViewMembers;
