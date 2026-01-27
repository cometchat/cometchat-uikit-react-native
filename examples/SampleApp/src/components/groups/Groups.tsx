import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  CometChatGroups,
  CometChatUIEventHandler,
  CometChatUIEvents,
  CometChatUIKit,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

import {
  GroupScreenAppBarOptions,
  CreateGroupBottomSheet,
  JoinGroupBottomSheet,
} from './GroupHelper';
import {SCREEN_CONSTANTS} from '../../utils/AppConstants';
import { useConfig } from '../../config/store';

type GroupNavigationProp = StackNavigationProp<RootStackParamList, 'Groups'>;

interface GroupsProps {
  hideHeader?: boolean;
}

const Groups: React.FC<GroupsProps> = ({hideHeader = false}) => {
  const createGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.createGroup
  );
  const theme = useTheme();
  const navigation = useNavigation<GroupNavigationProp>();
  const [pendingChat, setPendingChat] = useState<CometChat.Group | null>(null);

  // State to handle showing/hiding bottom sheets
  const [isCreateGroupSheetVisible, setCreateGroupSheetVisible] =
    useState(false);
  const [isJoinGroupSheetVisible, setJoinGroupSheetVisible] = useState(false);

  // State for the group that user wants to join
  const [groupToJoin, setGroupToJoin] = useState<CometChat.Group | null>(null);

  // Condition to hide the entire screen if needed
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (!isCreateGroupSheetVisible && !isJoinGroupSheetVisible && pendingChat) {
      const timer = setTimeout(() => {
        navigation.navigate(SCREEN_CONSTANTS.MESSAGES, { group: pendingChat });
        setPendingChat(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCreateGroupSheetVisible, isJoinGroupSheetVisible, pendingChat]);

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, [navigation]),
  );

  /**
   * Navigates to the Messages screen after group creation or join.
   */
  const handleNavigateToMessages = (group: CometChat.Group) => {
    // close any open sheet first
    setCreateGroupSheetVisible(false);
    setJoinGroupSheetVisible(false);

    // save the group – navigation will happen in a useEffect below
    setPendingChat(group);
  };

  /**
   * Handle group item press:
   * - If joined, open chat
   * - If public, join automatically
   * - If password, show the join modal
   */
  const handleGroupItemPress = (group: CometChat.Group) => {
    if (group.getHasJoined()) {
      handleNavigateToMessages(group);
      return;
    }

    if (group.getType() === CometChat.GROUP_TYPE.PUBLIC) {
      joinPublicGroup(group);
    } else if (group.getType() === CometChat.GROUP_TYPE.PASSWORD) {
      setGroupToJoin(group);
      setJoinGroupSheetVisible(true);
    }
    // For private group, you'd have a different flow.
  };

  const joinPublicGroup = async (group: CometChat.Group) => {
    try {
      const joinedGroup = await CometChat.joinGroup(
        group.getGuid(),
        group.getType() as CometChat.GroupType,
        '',
      );

      handleNavigateToMessages(joinedGroup);
      CometChatUIEventHandler.emitGroupEvent(
        CometChatUIEvents.ccGroupMemberJoined,
        {
          joinedUser: CometChatUIKit.loggedInUser,
          joinedGroup: joinedGroup,
        },
      );
    } catch (error) {
      console.log('Error joining public group:', error);
    }
  };

  if (shouldHide) return null;

  return (
    <View
      style={[
        styles.safeAreaContainer,
        { backgroundColor: theme.color.background1 },
      ]}
    >
      {/* CometChatGroups list component */}
      <CometChatGroups
        AppBarOptions={
          createGroup
            ? () => (
              <GroupScreenAppBarOptions
                onPress={() => setCreateGroupSheetVisible(true)}
              />
            )
            : undefined
        }
        onItemPress={handleGroupItemPress}
        hideHeader={hideHeader}
      />

      {/* Create Group Bottom Sheet */}
      <CreateGroupBottomSheet
        visible={isCreateGroupSheetVisible}
        onClose={() => setCreateGroupSheetVisible(false)}
        onGroupCreated={handleNavigateToMessages}
      />

      {/* Join Group Bottom Sheet */}
      <JoinGroupBottomSheet
        visible={isJoinGroupSheetVisible}
        groupToJoin={groupToJoin}
        onClose={() => {
          setJoinGroupSheetVisible(false);
          setGroupToJoin(null);
        }}
        onJoinSuccess={handleNavigateToMessages}
      />
    </View>
  );
};

export default Groups;
