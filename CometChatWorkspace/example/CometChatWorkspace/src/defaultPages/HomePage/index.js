import React from 'react';
import {connect} from 'react-redux';

import styles from './styles';
import * as actions from '../../store/action';
import {Text, View, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const HomePage = (props) => {
  if (!props.isLoggedIn) {
    props.navigation.navigate('LoginPage');
  }

  return (
    <ScrollView>
      <SafeAreaView>
        <View style={styles.wrapperStyle}>
          <Text style={styles.titleStyle}>
            The UI Kit has different ways to make fully customizable UI required
            to build a chat application.
          </Text>
          <Text style={styles.subTitleStyle}>
            The UI Kit has been developed to help developers of different levels
            of experience to build a chat application in a few minutes to a
            couple of hours.
          </Text>

          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>CometChatUI</Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The <Text style={styles.descTextColor}>CometChatUI</Text>{' '}
                    component launches a fully working chat application.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('CometChatUI');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>Conversations</Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The{' '}
                    <Text style={styles.descTextColor}>
                      CometChatConversationListWithMessages
                    </Text>{' '}
                    component launches a Conversation list with messaging.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('Conversation');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>Groups</Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The
                    <Text style={styles.descTextColor}>
                      {' '}
                      CometChatGroupListWithMessages
                    </Text>{' '}
                    component launches a Group list with messaging.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('Group');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.componentStyle}>
              <View style={styles.boxStyle}>
                <View style={styles.boxContent}>
                  <View style={styles.titleWrapperStyle}>
                    <Text style={styles.componentTitleStyle}>Users</Text>
                  </View>
                  <View style={styles.descWrapperStyle}>
                    <Text>
                      The{' '}
                      <Text style={styles.descTextColor}>
                        CometChatUserListWithMessages
                      </Text>{' '}
                      component launches a User list with messaging.
                    </Text>
                  </View>
                  <View style={styles.linkContainer}>
                    <TouchableOpacity
                      style={styles.linkWrapperStyle}
                      onPress={() => {
                        props.navigation.navigate('Users');
                      }}>
                      <Text style={styles.linkStyle}>Launch</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>
                    Conversation List
                  </Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The{' '}
                    <Text style={styles.descTextColor}>
                      CometChatConversationList
                    </Text>{' '}
                    component launches Conversation list.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('ConversationComponent');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>Group List</Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The{' '}
                    <Text style={styles.descTextColor}>CometChatGroupList</Text>{' '}
                    component launches Group list.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('GroupComponent');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.componentStyle}>
            <View style={styles.boxStyle}>
              <View style={styles.boxContent}>
                <View style={styles.titleWrapperStyle}>
                  <Text style={styles.componentTitleStyle}>User List</Text>
                </View>
                <View style={styles.descWrapperStyle}>
                  <Text>
                    The{' '}
                    <Text style={styles.descTextColor}>CometChatUserList</Text>{' '}
                    component launches User list.
                  </Text>
                </View>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={styles.linkWrapperStyle}
                    onPress={() => {
                      props.navigation.navigate('UsersComponent');
                    }}>
                    <Text style={styles.linkStyle}>Launch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => props.dispatch(actions.logout())}>
            <Text style={styles.btnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const mapStateToProps = ({reducer}) => {
  return {
    loading: reducer.loading,
    error: reducer.error,
    isLoggedIn: reducer.isLoggedIn,
  };
};

export default connect(mapStateToProps)(HomePage);