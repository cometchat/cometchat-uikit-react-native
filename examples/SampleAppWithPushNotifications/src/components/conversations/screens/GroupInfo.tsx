import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  CometChatAvatar,
  CometChatGroupsEvents,
  CometChatUIEventHandler,
  CometChatConfirmDialog,
  useTheme,
  CometChatConversationEvents,
  CometChatUIEvents,
  useCometChatTranslation,
} from '@cometchat/chat-uikit-react-native';
import { Icon } from '@cometchat/chat-uikit-react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatUIKit,
  CometChatUiKitConstants,
} from '@cometchat/chat-uikit-react-native';
import { RootStackParamList } from '../../../navigation/types';
import { listners } from '../helper/GroupListeners';
import { styles } from './GroupInfoStyles';
import { leaveGroup } from '../../../utils/helper';
import { CommonUtils } from '../../../utils/CommonUtils';
import ArrowBack from '../../../assets/icons/ArrowBack';
import Group from '../../../assets/icons/Group';
import PersonAdd from '../../../assets/icons/PersonAdd';
import PersonOff from '../../../assets/icons/PersonOff';
import Block from '../../../assets/icons/Block';
import Delete from '../../../assets/icons/Delete';
import { useConfig } from '../../../config/store';

type GroupInfoProps = {
  route: RouteProp<RootStackParamList, 'GroupInfo'>;
  navigation: StackNavigationProp<RootStackParamList, 'GroupInfo'>;
};

const GroupInfo: React.FC<GroupInfoProps> = ({route, navigation}) => {
  const addMembersToGroups = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.addMembersToGroups
  );
  const joinLeaveGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.joinLeaveGroup
  );
  const deleteGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.deleteGroup
  );
  const viewGroupMembers = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.viewGroupMembers
  );
  const { group } = route.params;
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const groupListenerId = useRef('groupListener' + new Date().getTime());

  const [data, setData] = useState({ groupDetails: group });
  const [userScope, setUserScope] = useState(
    group?.getOwner() === CometChatUIKit.loggedInUser?.getUid()
      ? CometChatUiKitConstants.GroupMemberScope.owner
      : group?.getScope(),
  );

  // Separate states for each type of modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOwnerLeaveModalOpen, setIsOwnerLeaveModalOpen] = useState(false);
  const [isDeleteExitModalOpen, setIsDeleteExitModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;

  useEffect(() => {
    // Update group details in state whenever group changes
    const handleGroupListener = (updatedGroup: CometChat.Group) => {
      if (updatedGroup.getGuid() === route.params.group.getGuid()) {
        setData({ groupDetails: updatedGroup });
        setUserScope(
          updatedGroup?.getOwner() === CometChatUIKit.loggedInUser?.getUid()
            ? CometChatUiKitConstants.GroupMemberScope.owner
            : (updatedGroup?.getScope() ?? userScope),
        );
      }
    };

    const handleGroupMemberKicked = ({ kickedFrom }: any) => {
      handleGroupListener(CommonUtils.clone(kickedFrom));
    };
    const handleGroupMemberBanned = ({ kickedFrom }: any) => {
      handleGroupListener(CommonUtils.clone(kickedFrom));
    };
    const handleGroupMemberAdded = ({ userAddedIn }: any) => {
      handleGroupListener(CommonUtils.clone(userAddedIn));
    };
    const handleOwnershipChanged = ({ group }: any) => {
      handleGroupListener(group);
    };

    // Add group listeners
    listners.addListener.groupListener({
      groupListenerId: groupListenerId.current,
      handleGroupListener,
    });

    CometChatUIEventHandler.addGroupListener(groupListenerId.current, {
      ccGroupMemberKicked: (item: any) => handleGroupMemberKicked(item),
      ccGroupMemberBanned: (item: any) => handleGroupMemberBanned(item),
      ccGroupMemberAdded: (item: any) => handleGroupMemberAdded(item),
      ccOwnershipChanged: (item: any) => handleOwnershipChanged(item),
    });

    return () => {
      // Cleanup
      listners.removeListner.removeGroupListener({
        groupListenerId: groupListenerId.current,
      });
      CometChatUIEventHandler.removeGroupListener(groupListenerId.current);
      CometChat.removeGroupListener(groupListenerId.current);
    };
  }, [group, userScope]);

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

  const getLabel = (key: string) => {
    const label = t(key);
    // Split into two words if device is small
    if (isSmallDevice && label.split(' ').length === 2) {
      return label.split(' ').join('\n');
    }
    return label;
  };

  /**
   * Handlers for each modal's confirm action
   */

  // 1) Normal "Leave Group" confirm
  const handleLeaveConfirm = () => {
    setIsLeaveModalOpen(false);
    if (data.groupDetails) {
      leaveGroup(data.groupDetails, navigation, 2);
    }
  };

  // 2) "Owner => Transfer Ownership" confirm
  const handleOwnerLeaveConfirm = () => {
    if (!data.groupDetails) return;

    setIsOwnerLeaveModalOpen(false);
    navigation.navigate('TransferOwnershipSection', {
      group: data.groupDetails,
    });
  };

  // 3) "Delete and Exit" confirm
  const handleDeleteExitConfirm = () => {
    setIsDeleteExitModalOpen(false);
    if (!data.groupDetails) return;
    // Delete group
    CometChat.deleteGroup(data.groupDetails.getGuid())
      .then(() => {
        navigation.pop(2);
      })
      .catch(error => {
        console.log('Group deletion failed:', error);
      });
    // Emit group deleted event
    CometChatUIEventHandler.emitGroupEvent(
      CometChatGroupsEvents.ccGroupDeleted,
      {
        group: data.groupDetails,
      },
    );
  };

  /** DELETE CONVERSATION LOGIC **/
  const handleDeleteConversationConfirm = () => {
    setDeleteModalOpen(false); // close the dialog
    if (group) {
      CometChat.getConversation(group.getGuid(), 'group')
        .then(conversation => {
          CometChat.deleteConversation(group.getGuid(), 'group')
            .then(deletedConversation => {
              console.log(deletedConversation);
              CometChatUIEventHandler.emitConversationEvent(
                CometChatConversationEvents.ccConversationDeleted,
                { conversation: conversation },
              );
              navigation.pop(2);
            })
            .catch(error => {
              console.log('Error while deleting conversation:', error);
            });
        })
        .catch(error => {
          console.log('Error while deleting conversation:', error);
        });
    }
  };

  return (
    <View
      style={[styles.flexOne, { backgroundColor: theme.color.background1 }]}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => navigation.goBack()}
        >
          <Icon
            icon={
              <ArrowBack
                color={theme.color.iconPrimary}
                height={24}
                width={24}
              />
            }
          />
        </TouchableOpacity>
        <Text
          style={[
            theme.typography.heading1.bold,
            styles.pL5,
            { color: theme.color.textPrimary },
          ]}
        >
          {t('GROUP_INFO')}
        </Text>
      </View>

      {/* Main Group Info Container */}
      <View
        style={[
          styles.groupInfoSection,
          { borderColor: theme.color.borderLight },
        ]}
      >
        <View style={styles.infoTitleContainer}>
          <CometChatAvatar
            style={{
              containerStyle: styles.avatarContainer,
              textStyle: styles.avatarText,
              imageStyle: styles.avatarImage,
            }}
            image={
              data.groupDetails?.getIcon()
                ? { uri: data.groupDetails?.getIcon() }
                : undefined
            }
            name={data.groupDetails?.getName() ?? ''}
          />
          <View style={styles.ellipseTail}>
            <Text
              style={[
                theme.typography.heading3.medium,
                styles.titleName,
                { color: theme.color.textPrimary },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {data.groupDetails?.getName()}
            </Text>
          </View>
          <Text
            style={[
              theme.typography.caption1.medium,
              styles.boxLabel,
              { color: theme.color.textSecondary },
            ]}
          >
            {data.groupDetails?.getMembersCount() +
              ' ' +
              t(
                data.groupDetails?.getMembersCount() === 1
                  ? 'MEMBER'
                  : 'MEMBERS',
              )}
          </Text>
        </View>

        {/* Action Boxes: Add Members / View Members / Banned Members */}
        <View style={styles.boxContainerRow}>
          {/* Add Members */}
          {addMembersToGroups &&
            [CometChatUiKitConstants.GroupMemberScope.owner,
            CometChatUiKitConstants.GroupMemberScope.admin
            ].includes(userScope) && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('AddMember', { group });
                }}
                style={[
                  styles.buttonContainer,
                  { borderColor: theme.color.borderDefault },
                ]}
              >
                <Icon
                  icon={
                    <PersonAdd color={theme.color.primary} height={24} width={24} />
                  }
                  containerStyle={styles.buttonIcon}
                />
                <Text
                  style={[
                    theme.typography.caption1.regular,
                    styles.boxLabel,
                    { color: theme.color.textSecondary },
                  ]}
                >
                  {getLabel('ADD_MEMBERS')}
                </Text>
              </TouchableOpacity>
            )}

          {/* View Members */}
          {viewGroupMembers && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ViewMembers', { group });
            }}
            style={[
              styles.buttonContainer,
              { borderColor: theme.color.borderDefault },
            ]}
          >
            <Icon
              icon={
                <Group color={theme.color.primary} height={24} width={24} />
              }
              containerStyle={styles.buttonIcon}
            />
            <Text
              style={[
                theme.typography.caption1.regular,
                styles.boxLabel,
                { color: theme.color.textSecondary },
              ]}
            >
              {getLabel('VIEW_MEMBERS')}
            </Text>
          </TouchableOpacity>
          )}
          {/* Banned Members */}
          {(userScope === CometChatUiKitConstants.GroupMemberScope.owner ||
            userScope === CometChatUiKitConstants.GroupMemberScope.admin ||
            userScope ===
              CometChatUiKitConstants.GroupMemberScope.moderator) && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BannedMember', { group });
              }}
              style={[
                styles.buttonContainer,
                { borderColor: theme.color.borderDefault },
              ]}
            >
              <Icon
                icon={
                  <PersonOff
                    color={theme.color.primary}
                    height={24}
                    width={24}
                  />
                }
                containerStyle={styles.buttonIcon}
              />
              <Text
                style={[
                  theme.typography.caption1.regular,
                  styles.boxLabel,
                  { color: theme.color.textSecondary },
                ]}
              >
                {getLabel('BANNED_MEMBERS')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => setDeleteModalOpen(true)}
            style={styles.iconContainer}
          >
            <Icon
              icon={<Delete color={theme.color.error} height={24} width={24} />}
            />
            <Text
              style={[
                theme.typography.heading4.regular,
                styles.mL5,
                { color: theme.color.error },
              ]}
            >
              {t('DELETE_CHAT_TEXT')}
            </Text>
          </TouchableOpacity>
        </View>
        {/* If user is owner but group has multiple members => must TRANSFER ownership.
           Otherwise => normal leave.  */}
        {joinLeaveGroup &&
          (data.groupDetails.getMembersCount() > 1 ||
            userScope !== CometChatUiKitConstants.GroupMemberScope.owner) && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => {
                  if (userScope === CometChatUiKitConstants.GroupMemberScope.owner) {
                    setIsOwnerLeaveModalOpen(true);
                  } else {
                    setIsLeaveModalOpen(true);
                  }
                }}
                style={styles.iconContainer}
              >
                <Icon icon={<Block color={theme.color.error} height={24} width={24} />} />
                <Text
                  style={[
                    theme.typography.heading4.regular,
                    styles.mL5,
                    { color: theme.color.error },
                  ]}
                >
                  {t('LEAVE')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Delete and Exit (Group owner only) */}
        {deleteGroup && 
        [
          CometChatUiKitConstants.GroupMemberScope.owner,
          CometChatUiKitConstants.GroupMemberScope.admin,
        ].includes(userScope) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => setIsDeleteExitModalOpen(true)}
              style={styles.iconContainer}
            >
              <Icon
                icon={
                  <Delete color={theme.color.error} height={24} width={24} />
                }
              />
              <Text
                style={[
                  theme.typography.heading4.regular,
                  styles.mL5,
                  { color: theme.color.error },
                ]}
              >
                {t('DELETE_AND_EXIT')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ============== LEAVE GROUP (Regular) Dialog ============== */}
      <CometChatConfirmDialog
        isOpen={isLeaveModalOpen}
        onCancel={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveConfirm}
        titleText={t('LEAVE_GROUP_TEXT')}
        messageText={t('LEAVE_SURE')}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('LEAVE')}
        icon={<Block color={theme.color.error} height={45} width={45} />}
      />

      {/* ============== TRANSFER OWNERSHIP Dialog ============== */}
      <CometChatConfirmDialog
        isOpen={isOwnerLeaveModalOpen}
        onCancel={() => setIsOwnerLeaveModalOpen(false)}
        onConfirm={handleOwnerLeaveConfirm}
        titleText={t('TRANSFER_OWNERSHIP')}
        messageText={t('TRANSFER_SURE')}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('TRANSFER')}
        icon={<Block color={theme.color.error} height={45} width={45} />}
      />

      {/* ============== DELETE AND EXIT Dialog ============== */}
      <CometChatConfirmDialog
        isOpen={isDeleteExitModalOpen}
        onCancel={() => setIsDeleteExitModalOpen(false)}
        onConfirm={handleDeleteExitConfirm}
        titleText={`${t('DELETE_AND_EXIT')}?`}
        messageText={t('DELETE_AND_EXIT_SURE')}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('DELETE_AND_EXIT')}
        icon={<Delete color={theme.color.error} height={45} width={45} />}
      />

      {/* =============== DELETE CHAT MODAL =============== */}
      <CometChatConfirmDialog
        isOpen={isDeleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConversationConfirm}
        onDismiss={() => console.log('Delete Modal dismissed')}
        titleText={t('DELETE_CHAT')}
        messageText={t('SURE_TO_DELETE_CHAT')}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('DELETE')}
        icon={<Delete color={theme.color.error} height={45} width={45} />}
      />
    </View>
  );
};

export default GroupInfo;
