import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUsers, useTheme } from '@cometchat/chat-uikit-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

type UserNavigationProp = StackNavigationProp<RootStackParamList, 'Users'>;

const Users: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<UserNavigationProp>();
  const [shouldHide, setShouldHide] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, []),
  );

  return shouldHide ? null : (
    <View style={{ flex: 1, backgroundColor: theme.color.background1 }}>
      <CometChatUsers
        onItemPress={(user: CometChat.User) => {
          navigation.navigate('Messages', {
            user: user,
          });
        }}
        usersRequestBuilder={new CometChat.UsersRequestBuilder()
          .setLimit(30)
          .hideBlockedUsers(false)
          // .setRoles(['@agentic'])
          .friendsOnly(false)
          .setStatus('')
          .setTags([])
          .sortBy('name')
          .setUIDs([])}
      />
    </View>
  );
};

export default Users;
