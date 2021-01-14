import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import style from './styles';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from 'react-native-vector-icons/MaterialIcons';

// import BottomSheet from 'reanimated-bottom-sheet';

const closeIcon = <Icon name="close" style={style.modalCloseStyle} />;
class CometChatCreateGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      passwordInput: false,
      name: '',
      type: 'Select group type',
      password: '',
    };

    this.sheetRef = React.createRef(null);
  }
  // componentDidUpdate()         //for development purpose.
  // {
  //     console.log("password",this.state.name);
  // }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.open && this.state.open) {
      this.sheetRef.current.snapTo(0);
    }
  }

  passwordChangeHandler = (feedback) => {
    this.setState({ password: feedback });
  };

  nameChangeHandler = (feedback) => {
    this.setState({ name: feedback });
  };

  typeChangeHandler = (feedback) => {
    const type = feedback;
    this.setState({ type });

    if (type === 'protected') {
      this.setState({ passwordInput: true });
    } else {
      this.setState({ passwordInput: false });
    }
  };

  validate = () => {
    const groupName = this.state.name.trim();
    const groupType = this.state.type.trim();

    if (!groupName) {
      this.setState({ error: 'Group name cannnot be blank.' });
      return false;
    }

    if (!groupType) {
      this.setState({ error: 'Group type cannnot be blank.' });
      return false;
    }

    let password = '';
    if (groupType === 'protected') {
      password = this.state.password;

      if (!password.length) {
        this.setState({ error: 'Group password cannnot be blank.' });
        return false;
      }
    }
    return true;
  };

  createGroup = () => {
    if (!this.validate()) {
      return false;
    }

    const groupType = this.state.type.trim();

    const { password } = this.state;
    const guid = `group_${new Date().getTime()}`;
    const name = this.state.name.trim();
    let type = CometChat.GROUP_TYPE.PUBLIC;

    switch (groupType) {
      case 'public':
        type = CometChat.GROUP_TYPE.PUBLIC;
        break;
      case 'private':
        type = CometChat.GROUP_TYPE.PRIVATE;
        break;
      case 'protected':
        type = CometChat.GROUP_TYPE.PASSWORD;
        break;
      default:
        break;
    }

    const group = new CometChat.Group(guid, name, type, password);
    CometChat.createGroup(group)
      .then((incomingGroup) => {
        // console.log('Group created successfully:', group);
        this.setState({
          error: null,
          name: '',
          type: '',
          password: '',
          passwordInput: '',
        });
        this.props.actionGenerated('groupCreated', incomingGroup);
      })
      .catch((error) => {
        // console.log('Group creation failed with exception:', error);
        this.setState({ error });
      });
  };

  render() {
    let password = null;
    if (this.state.passwordInput) {
      password = (
        <View>
          <View>
            <TextInput
              autoCompleteType="off"
              style={[
                style.inputStyle,
                {
                  backgroundColor: this.props.theme.backgroundColor.grey,
                  color: this.props.theme.color.helpText,
                  borderColor: this.props.theme.color.grey,
                },
              ]}
              placeholder="Enter group password"
              secureTextEntry // for password
              onChangeText={(value) => {
                this.passwordChangeHandler(value);
              }}
              value={this.state.password}
            />
          </View>
        </View>
      );
    }

    return (
      <Modal transparent animated animationType="fade" visible={this.props.open}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',justifyContent:"flex-end" }}>
          {/* <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
            borderRadius={30}
            initialSnap={0}
            // enabledInnerScrolling={false}
            enabledContentTapInteraction={false}
            // enabledContentGestureInteraction={false}
            overdragResistanceFactor={10}
            renderContent={() => {
              return (
                
              );
            }}
            onCloseEnd={() => {
              this.props.close();
            }}
          /> */}
          <View style={{ height: '90%', backgroundColor: 'white',borderTopLeftRadius:15,borderTopRightRadius:15 }}>
                  <View style={style.modalWrapperStyle}>
                    <SafeAreaView>
                      {/* <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={style.groupWrapperStyle}> */}
                        <TouchableWithoutFeedback
                          onPress={() => {
                            Keyboard.dismiss();
                          }}>
                          <View style={style.modalBodyStyle}>
                            <View style={style.modalTableStyle}>
                              <View style={style.modalHeader}>
                                <Text style={style.tableCaptionStyle}>Create Group</Text>
                                <TouchableOpacity
                                  style={{ borderRadius: 15, marginTop: 2 }}
                                  onPress={() => {
                                    this.props.close();
                                  }}>
                                  {closeIcon}
                                </TouchableOpacity>
                              </View>
                              <View style={style.tableBodyStyle}>
                                <View>
                                  <Text style={style.tableErrorStyle}>{this.state.error}</Text>
                                </View>
                                <View>
                                  <TextInput
                                    autoCompleteType="off"
                                    style={[
                                      style.inputStyle,
                                      {
                                        backgroundColor: this.props.theme.backgroundColor.grey,
                                        color: this.props.theme.color.helpText,
                                        borderColor: this.props.theme.color.grey,
                                      },
                                    ]}
                                    placeholder="Enter group name"
                                    type="text"
                                    // tabIndex="1"
                                    onChangeText={(value) => {
                                      this.nameChangeHandler(value);
                                    }}
                                    value={this.state.name}
                                  />
                                </View>
                                <View>
                                  <Picker
                                    style={style.inputPickerStyle}
                                    onValueChange={(feedback) => {
                                      this.typeChangeHandler(feedback);
                                    }}
                                    selectedValue={this.state.type}
                                    // tabIndex="2"
                                  >
                                    <Picker.Item
                                      style={style.inputOptionStyle}
                                      label="Select group type"
                                      value="Select group type"
                                    />
                                    <Picker.Item
                                      style={style.inputOptionStyle}
                                      label="Public"
                                      value="public"
                                    />
                                    <Picker.Item
                                      style={style.inputOptionStyle}
                                      label="Private"
                                      value="private"
                                    />
                                    <Picker.Item
                                      style={style.inputOptionStyle}
                                      label="Password Protected"
                                      value="protected"
                                    />
                                  </Picker>
                                </View>
                                {password}
                                <View style={{ alignItems: 'center',flex:1,justifyContent:"center" }}>
                                <TouchableOpacity
                                 style={[
                                    style.groupButtonWrapper,
                                    {
                                      backgroundColor: this.props.theme.backgroundColor.blue,
                                    },
                                  ]}
                                  onPress={()=>this.createGroup()}>
                                  <Text
                                    style={[
                                      style.btnText,
                                      { color: this.props.theme.color.white },
                                    ]}>
                                    Create
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              </View>
                              
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      {/* </KeyboardAvoidingView> */}
                    </SafeAreaView>
                  </View>
                </View>
        </View>
      </Modal>
    );
  }
}

export default CometChatCreateGroup;
