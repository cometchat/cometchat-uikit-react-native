import { CometChat } from '@cometchat/chat-sdk-react-native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  NativeModules,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import {
  CometChatGroupsEvents,
  CometChatUIEventHandler,
  CometChatUIKit,
  CometChatUiKitConstants,
  CometChatUsers,
  CometChatUsersActionsInterface,
  useCometChatTranslation,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { Icon } from '@cometchat/chat-uikit-react-native';
import {
  useRoute,
  useNavigation,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { styles } from './AddMemberStyles';
import { commonVars } from '@cometchat/chat-uikit-react-native/src/shared/base/vars';
import ArrowBack from '../../../assets/icons/ArrowBack';
import { RootStackParamList } from '../../../navigation/types';
import { useConfig } from '../../../config/store';
const { CommonUtil } = NativeModules;

const AddMember: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AddMember'>>();
  const navigation = useNavigation();
  const { group } = route.params;
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const userRef = useRef<CometChatUsersActionsInterface>(null);
  const [selectedUsers, setSelectedUsers] = useState<CometChat.User[]>([]);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState('');
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [kbOffset, setKbOffset] = React.useState(900);
  const userAndFriendsPresence = useConfig(
      (state) => state.settings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
    );

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

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

  useLayoutEffect(() => {
    if (Platform.OS === 'ios') {
      if (Number.isInteger(commonVars.safeAreaInsets.top)) {
        setKbOffset(commonVars.safeAreaInsets.top ?? 0);
        return;
      }

      CommonUtil.getSafeAreaInsets().then((res: any) => {
        if (Number.isInteger(res.top)) {
          commonVars.safeAreaInsets.top = res.top;
          commonVars.safeAreaInsets.bottom = res.bottom;
          setKbOffset(res.top);
        }
      });
    }
  }, []);

  const addMembersToGroup = useCallback(
    async (users: Array<CometChat.User>) => {
      try {
        const membersList = users.map((item: CometChat.User) => {
          const groupMember = new CometChat.GroupMember(
            item.getUid(),
            CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
          );
          groupMember.setName(item.getName());
          return groupMember;
        });

        const guid = group.getGuid();
        const response = await CometChat.addMembersToGroup(
          guid,
          membersList,
          [],
        );

        const addedUIDs = Object.entries(response)
          .filter(([_, status]) => status === 'success')
          .map(([uid]) => uid);

        const addedMembers = membersList.filter(member =>
          addedUIDs.includes(member.getUid()),
        );

        if (addedUIDs.length > 0) {
          navigation.goBack();
        } else {
          setErrorToastMessage('Error, Unable to add members');
          setErrorToastVisible(true);
          errorTimeoutRef.current = setTimeout(() => {
            setErrorToastVisible(false);
          }, 3000);
        }

        // If all succeeded, emit individual events for each member
        if (addedMembers.length > 0) {
          const groupInfo  = await CometChat.getGroup(group.getGuid());
          group.setMembersCount(groupInfo.getMembersCount());
          // Create separate action for each added member
          addedMembers.forEach(member => {
            const action: CometChat.Action = new CometChat.Action(
              guid,
              CometChatUiKitConstants.MessageTypeConstants.groupMember,
              CometChat.RECEIVER_TYPE.GROUP,
              CometChat.CATEGORY_ACTION as CometChat.MessageCategory,
            );
            action.setConversationId(guid);
            action.setActionBy(CometChatUIKit.loggedInUser!);
            action.setActionFor(group);
            action.setSender(CometChatUIKit.loggedInUser!);

            // Emit individual event for each member added
            CometChatUIEventHandler.emitGroupEvent(
              CometChatGroupsEvents.ccGroupMemberAdded,
              {
                addedBy: CometChatUIKit.loggedInUser,
                message: action,
                usersAdded: [member],
                userAddedIn: group,
              },
            );
          });
        }
      } catch (error) {
        console.error('Something went wrong', error);
        setErrorToastMessage('Error, Unable to add members');
        setErrorToastVisible(true);
        errorTimeoutRef.current = setTimeout(() => {
          setErrorToastVisible(false);
        }, 2000);
      }
    },
    [group, navigation],
  );

  const handleUserSelection = useCallback((users: CometChat.User[]) => {
    setSelectedUsers(users);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'ios' ? true : false}
      keyboardVerticalOffset={kbOffset}
      style={{ flex: 1, backgroundColor: theme.color.background1 }}
    >
      {/* Header */}
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.addMemberContainer,
            { borderBottomColor: theme.color.borderLight },
          ]}
        >
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
              styles.addMemberText,
              { color: theme.color.textPrimary },
            ]}
          >
            {t('ADD_MEMBERS')}
          </Text>
        </View>

        {/* Users List */}
        <CometChatUsers
          hideHeader={true}
          ref={userRef}
          usersRequestBuilder={new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .hideBlockedUsers(false)
            .setRoles([])
            .friendsOnly(false)
            .setStatus('')
            .setTags([])
            .sortBy('name')
            .setUIDs([])}
          selectionMode="multiple"
          onSelection={handleUserSelection}
          showBackButton={true}
          onBack={() => navigation.goBack()}
          usersStatusVisibility={userAndFriendsPresence}
        />

        {/* Add Members Button */}
        <TouchableOpacity
          onPress={() => addMembersToGroup(selectedUsers)}
          style={styles.addMembersButton}
        >
          <View
            style={[
              styles.addMembersButtonContainer,
              { backgroundColor: theme.color.primaryButtonBackground },
            ]}
          >
            <Text
              style={[
                theme.typography.heading4.medium,
                { color: theme.color.primaryButtonText, alignSelf: 'center' },
              ]}
            >
              {t('ADD_MEMBERS')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Error Toast */}
        {errorToastVisible && (
          <View
            style={[
              styles.toastContainer,
              { backgroundColor: theme.color.error },
            ]}
          >
            <Text style={styles.toastTextStyle}>{errorToastMessage}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddMember;
