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
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from 'react-native-vector-icons/MaterialIcons';
import * as actions from '../../../utils/actions';
import * as enums from '../../../utils/enums';
import { logger } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';

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

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.open && this.state.open) {
      this.sheetRef.current.snapTo(0);
    }
  }

  /**
   * handles the change in password TextInput field.
   * @param feedback: TextInput's value
   */

  passwordChangeHandler = (feedback) => {
    this.setState({ password: feedback });
  };

  /**
   * handles the change in groupName TextInputField
   * @param feedback: TextInput's value
   */

  nameChangeHandler = (feedback) => {
    this.setState({ name: feedback });
  };

  /**
   * handles the change in Picker(group-type)
   * @param feedback: picker's selected value
   */

  typeChangeHandler = (feedback) => {
    const type = feedback;
    this.setState({ type });

    if (type === CometChat.GROUP_TYPE.PROTECTED) {
      this.setState({ passwordInput: true });
    } else {
      this.setState({ passwordInput: false });
    }
  };

  /**
   * handles validation of various input fields
   * @param
   * @returns boolean: true if validation is passed else false.
   */

  validate = () => {
    const groupName = this.state.name?.trim();
    const groupType = this.state.type?.trim();

    try {
      if (!groupName) {
        this.dropDownAlertRef?.showMessage(
          'error',
          'Group name cannot be blank.',
        );
        return false;
      }

      if (!groupType || groupType === 'Select group type') {
        this.dropDownAlertRef?.showMessage(
          'error',
          'Group type cannot be blank.',
        );
        return false;
      }

      let password = '';
      if (groupType === CometChat.GROUP_TYPE.PROTECTED) {
        password = this.state.password;

        if (!password.length) {
          this.dropDownAlertRef?.showMessage(
            'error',
            'Group password cannot be blank.',
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      logger(error);
      return false;
    }
  };

  /**
   * handles the creation of new group based on validations.
   * @param
   */

  createGroup = () => {
    try {
      if (!this.validate()) {
        return false;
      }

      const groupType = this.state.type.trim();

      const { password } = this.state;
      const guid = `group_${new Date().getTime()}`;
      const name = this.state.name.trim();
      let type = groupType || CometChat.GROUP_TYPE.PUBLIC;

      const group = new CometChat.Group(guid, name, type, password);
      CometChat.createGroup(group)
        .then((incomingGroup) => {
          this.setState({
            error: null,
            name: '',
            type: '',
            password: '',
            passwordInput: '',
          });
          this.props.actionGenerated(actions.GROUP_CREATED, incomingGroup);
        })
        .catch((error) => {
          logger('Group creation failed with exception:', error);
          this.setState({ error });
        });
    } catch (error) {
      logger(error);
    }
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
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.props.open}>
        <View style={style.container}>
          <View style={style.innerContainer}>
            <View style={style.modalWrapperStyle}>
              <SafeAreaView>
                <TouchableWithoutFeedback
                  onPress={() => {
                    Keyboard.dismiss();
                  }}>
                  <View style={style.modalBodyStyle}>
                    <View style={style.modalTableStyle}>
                      <View style={style.modalHeader}>
                        <Text style={style.tableCaptionStyle}>
                          Create Group
                        </Text>
                        <TouchableOpacity
                          style={style.closeBtn}
                          onPress={() => {
                            this.props.close();
                          }}>
                          {closeIcon}
                        </TouchableOpacity>
                      </View>
                      <View style={style.tableBodyStyle}>
                        <View>
                          <Text style={style.tableErrorStyle}>
                            {this.state.error}
                          </Text>
                        </View>
                        <View>
                          <TextInput
                            autoCompleteType="off"
                            style={[
                              style.inputStyle,
                              {
                                backgroundColor: this.props.theme
                                  .backgroundColor.grey,
                                color: this.props.theme.color.helpText,
                                borderColor: this.props.theme.color.grey,
                              },
                            ]}
                            placeholder="Enter group name"
                            type="text"
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
                            selectedValue={this.state.type}>
                            <Picker.Item
                              style={style.inputOptionStyle}
                              label="Select group type"
                              value="Select group type"
                            />
                            <Picker.Item
                              style={style.inputOptionStyle}
                              label="Public"
                              value={CometChat.GROUP_TYPE.PUBLIC}
                            />
                            <Picker.Item
                              style={style.inputOptionStyle}
                              label="Private"
                              value={CometChat.GROUP_TYPE.PRIVATE}
                            />
                            <Picker.Item
                              style={style.inputOptionStyle}
                              label="Password Protected"
                              value={CometChat.GROUP_TYPE.PROTECTED}
                            />
                          </Picker>
                        </View>
                        {password}
                        <View style={style.groupButtonContainer}>
                          <TouchableOpacity
                            style={[
                              style.groupButtonWrapper,
                              {
                                backgroundColor: this.props.theme
                                  .backgroundColor.blue,
                              },
                            ]}
                            onPress={() => this.createGroup()}>
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
              </SafeAreaView>
            </View>
          </View>
        </View>
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </Modal>
    );
  }
}

export default CometChatCreateGroup;
