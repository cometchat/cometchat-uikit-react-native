import React, {useContext} from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {RoundedButton} from '../common/RoundedButton';
import {AppLogo} from '../../resources';
import {Style} from './style';
import {Create} from './Create';
import {
  CometChatContext,
  CometChatUIKit,
} from '@cometchat/chat-uikit-react-native';
import {users} from '../../utils/usersList';
export const Login = ({navigation}: any) => {
  const [isLoginInProgress, setLoginInProgress] = React.useState(false);
  const [usersList, setUsersList] = React.useState<any>([]);

  const {theme} = useContext(CometChatContext);

  React.useEffect(() => {
    fetch('https://assets.cometchat.io/sampleapp/sampledata.json')
      .then(response => {
        if (response.status === 200) return response.json();
        else {
          setUsersList(users);
          return {};
        }
      })
      .then((res: any) => {
        if (res.users)
          setUsersList(() =>
            res.users.map((item: any) => ({
              ...item,
              avatar: {uri: item.avatar},
            })),
          );
      });
  }, []);

  React.useEffect(() => {
    CometChatUIKit.getLoggedInUser()
      .then(user => {
        if (user != null) navigation.navigate('Home');
      })
      .catch(e => console.log('Unable to get loggedInUser', e));
  }, []);

  const makeLogin = (uid: string) => {
    setLoginInProgress(true);
    CometChatUIKit.login({uid})
      .then(user => {
        setLoginInProgress(false);
        navigation.navigate('Home');
      })
      .catch(err => {
        setLoginInProgress(false);
        console.log('Error while login:', err);
      });
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#ffffffff'}}>
      {isLoginInProgress ? (
        <Modal transparent>
          <View
            style={{
              backgroundColor: 'rgba(20,20,20,0.5)',
              flex: 1,
              justifyContent: 'center',
            }}>
            <View
              style={{
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                width: '80%',
                padding: 16,
                borderRadius: 16,
              }}>
              <Image
                style={{
                  height: 200,
                  width: 200,
                  marginBottom: 8,
                  alignSelf: 'center',
                }}
                source={require('./logo.png')}
              />
              <ActivityIndicator
                size="large"
                color={theme.palette.getPrimary()}
              />
            </View>
          </View>
        </Modal>
      ) : null}
      <View
        style={{
          padding: 15,
          flex: 1,
          justifyContent: 'space-between',
        }}>
        <View style={{marginTop: 16}}>
          <Image source={AppLogo} style={Style.LogoImage} />
          <Text style={Style.Version}>CometChat</Text>
        </View>
        <View>
          <Text style={{color: theme.palette.getAccent(), textAlign: 'center'}}>
            Login with one of our sample users
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 15,
              flexWrap: 'wrap',
            }}>
            {Boolean(usersList.length) &&
              usersList.map((user: any) => {
                return (
                  <RoundedButton
                    key={user.uid}
                    style={Style.LoginButton}
                    onPress={() => makeLogin(user.uid)}>
                    <Image style={Style.ButtonImage} source={user.avatar} />
                    <Text style={Style.ButtonText}>{user.name}</Text>
                  </RoundedButton>
                );
              })}
          </View>

          <Text style={{textAlign: 'center'}}>
            or else login countinue with
          </Text>

          <RoundedButton
            style={Style.CustomLoginButton}
            onPress={() => {
              navigation.navigate('SignIn');
            }}>
            <Text style={{fontWeight: 'bold', color: 'white'}}>
              Login using UID
            </Text>
          </RoundedButton>
        </View>
        <View style={{alignItems: 'center'}}>
          <Create navigator={navigation} />
        </View>
      </View>
    </SafeAreaView>
  );
};
