import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import {
  CometChatConfirmDialog,
  CometChatList,
  CometChatListActionsInterface,
} from '@cometchat/chat-uikit-react-native/src/shared';
import { Skeleton } from '@cometchat/chat-uikit-react-native/src/CometChatUsers/Skeleton';
import {
  Icon,
  useCometChatTranslation,
} from '@cometchat/chat-uikit-react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatGroupsEvents,
  CometChatUIEventHandler,
  CometChatUIKit,
  CometChatUiKitConstants,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { ErrorEmptyView } from '@cometchat/chat-uikit-react-native/src/shared/views/ErrorEmptyView/ErrorEmptyView';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  getBannedMemberStyleLight,
  styles,
  getBannedMemberStyleDark,
} from './BannedMemberStyles';
import UserEmptyIcon from '../../../assets/icons/UserEmptyIcon';
import Close from '../../../assets/icons/Close';
import Block from '../../../assets/icons/Block';

type BannedMembersRouteProp = {
  route: RouteProp<RootStackParamList, 'BannedMember'>;
  navigation: StackNavigationProp<RootStackParamList, 'BannedMember'>;
};

const BannedMember: React.FC<BannedMembersRouteProp> = ({
  route,
  navigation,
}) => {
  const { group } = route.params;
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const bannedListRef = useRef<CometChatListActionsInterface>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);

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

  /**
   * --- Callbacks / Handlers ---
   */

  const openUnbanModal = (user: CometChat.User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeUnbanModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const handleUnbanUser = async () => {
    if (!group || !selectedUser) return;
    try {
      const guid = group.getGuid();
      const uid = selectedUser.getUid();

      // Unban the user
      await CometChat.unbanGroupMember(guid, uid);

      // Create and dispatch an Action message for the unban event
      const actionMessage = new CometChat.Action(
        guid,
        CometChatUiKitConstants.MessageTypeConstants.groupMember,
        CometChat.RECEIVER_TYPE.GROUP,
        CometChat.CATEGORY_ACTION as CometChat.MessageCategory,
      );
      actionMessage.setConversationId(guid);
      actionMessage.setActionFor(group);
      actionMessage.setActionOn(selectedUser);
      actionMessage.setActionBy(CometChatUIKit.loggedInUser!);
      actionMessage.setSender(CometChatUIKit.loggedInUser!);
      // Initialize data to prevent crash when SDK accesses getData().metadata during render
      actionMessage.setData({ metadata: {} });
      actionMessage.setMessage(
        `${CometChatUIKit.loggedInUser?.getName()} ${t(
          'UNBANNED',
        )} ${selectedUser.getName()}`,
      );
      CometChatUIEventHandler.emitGroupEvent(
        CometChatGroupsEvents.ccGroupMemberUnBanned,
        {
          unbannedBy: CometChatUIKit.loggedInUser,
          userUnbanned: selectedUser,
          group,
          message: actionMessage,
        },
      );

      // Remove from the banned list
      bannedListRef.current?.removeItemFromList(uid);

      // Close modal
      closeUnbanModal();
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  /**
   * --- Render Helpers ---
   */

  const renderEmptyView = useCallback(() => {
    return (
      <View style={styles.flexContainer}>
        <ErrorEmptyView
          title={t('NO_BANNED_MEMBERS_FOUND')}
          Icon={
            <Icon
              icon={
                <UserEmptyIcon
                  color={theme.color.neutral300}
                  height={100}
                  width={100}
                />
              }
              size={theme.spacing.spacing.s20}
              containerStyle={{ marginBottom: theme.spacing.spacing.s5 }}
            />
          }
          containerStyle={styles.emptyViewContainer}
          titleStyle={[
            theme.userStyles.emptyStateStyle.titleStyle,
            { color: theme.color.textPrimary },
          ]}
        />
      </View>
    );
  }, [theme]);

  const renderLoadingView = () => <Skeleton />;

  const renderTailView = (user: CometChat.User) => (
    <TouchableOpacity onPress={() => openUnbanModal(user)}>
      <Icon
        icon={<Close height={24} width={24} color={theme.color.iconTertiary} />}
      />
    </TouchableOpacity>
  );

  const renderUnbanModal = () => {
    if (!selectedUser) return null;

    return (
      <CometChatConfirmDialog
        titleText={`${t('UNBAN')} ${selectedUser.getName()}`}
        icon={<Block color={theme.color.error} height={40} width={40} />}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('UNBAN')}
        messageText={t('UNBAN_SURE') + ' ' + selectedUser.getName()}
        isOpen={true}
        onCancel={closeUnbanModal}
        onConfirm={handleUnbanUser}
      />
    );
  };

  /**
   * --- Main JSX ---
   */
  return (
    <>
      <View
        style={[
          styles.flexContainer,
          { backgroundColor: theme.color.background1 },
        ]}
      >
        <CometChatList
          title={t('BANNED_MEMBERS')}
          hideStickyHeader={true}
          ref={bannedListRef}
          onBack={() => navigation.goBack()}
          listItemKey="uid"
          hideBackButton={false}
          LoadingView={renderLoadingView}
          EmptyView={renderEmptyView}
          TrailingView={renderTailView}
          listStyle={
            theme.mode === 'light'
              ? getBannedMemberStyleLight(theme)
              : getBannedMemberStyleDark(theme)
          }
          requestBuilder={new CometChat.BannedMembersRequestBuilder(
            group.getGuid(),
          ).setLimit(30)}
        />
      </View>
      {renderUnbanModal()}
    </>
  );
};

export default BannedMember;
