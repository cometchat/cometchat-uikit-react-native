import React, { useState, useRef, createRef } from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import DropDownAlert from '../../../Shared/DropDownAlert';
import { CometChatCreatePollOptions } from '../index';
import styles from './styles';
import Icon from 'react-native-vector-icons/AntDesign';
import { heightRatio } from '../../../../utils/consts';

import * as enums from '../../../../utils/enums';
import * as actions from '../../../../utils/actions';

const close = <Icon name="close" style={styles.closeIcon} />;

const CometChatCreatePoll = (props) => {
  const [showScroll, setScroll] = useState(false);
  const [optionArray, setOptions] = useState([]);
  const [error, setError] = useState('');
  const thirdInputReference = useRef(null);
  const secondInputReference = useRef(null);
  const [questionRef, setQuestionRef] = useState('');
  const [optionOneRef, setOneRef] = useState('');
  const [optionTwoRef, setTwoRef] = useState('');
  const dropDownAlertRef = useRef(null);
  const QuestionChangeHandler = (value) => {
    setQuestionRef(value);
  };
  const OptionOneChangeHandler = (value) => {
    setOneRef(value);
  };
  const OptionTwoChangeHandler = (value) => {
    setTwoRef(value);
  };
  function addPollOption() {
    const optionList = [...optionArray];
    optionList.push({ value: '', id: Math.random() });
    setOptions(optionList);
  }
  const removePollOption = (option) => {
    const optionList = [...optionArray];
    setOptions(optionList.filter((opt) => opt.id !== option.id));
  };
  const optionChangeHandler = (inputValue, option) => {
    const optionList = [...optionArray];
    const optionKey = optionArray.findIndex((opt) => opt.id === option.id);
    if (optionKey > -1) {
      const newOption = { ...option, value: inputValue };
      optionList.splice(optionKey, 1, newOption);
      setOptions(optionList);
    }
  };

  /**
   * Handler for creating a poll based on validations.
   * @param
   */
  const createPoll = () => {
    const question = questionRef.trim();
    const firstOption = optionOneRef.trim();
    const secondOption = optionTwoRef.trim();
    const optionItems = [firstOption, secondOption];
    if (question.length === 0) {
      setError({ error: 'Question cannot be blank.' });
      return false;
    }
    if (firstOption.length === 0 || secondOption.length === 0) {
      setError({ error: 'Option cannot be blank.' });
      return false;
    }
    optionArray.forEach((option) => {
      optionItems.push(option.value);
    });
    let receiverId;
    const receiverType = props.type;
    if (props.type === CometChat.RECEIVER_TYPE.USER) {
      receiverId = props.item.uid;
    } else if (props.type === CometChat.RECEIVER_TYPE.GROUP) {
      receiverId = props.item.guid;
    }
    CometChat.callExtension('polls', 'POST', 'v2/create', {
      question,
      options: optionItems,
      receiver: receiverId,
      receiverType,
    })
      .then(() => {
        const resultOptions = {};
        optionItems.map((option) => {
          resultOptions[option] = {
            text: optionItems[option],
            count: 0,
          };
        });
        const polls = {
          options: optionItems,
          results: {
            total: 0,
            options: resultOptions,
            question,
          },
          question,
        };
        const message = {
          metadata: { '@injected': { extensions: { polls } } },
        };
        props.actionGenerated(actions.POLL_CREATED, message);
      })
      .catch((err) => {
        console.log('err', err);
        const errorCode = err?.details?.message || err?.message || 'ERROR';
        dropDownAlertRef?.current?.showMessage('error', errorCode);
        setError(err);
      });
  };
  const onChangeScreenSize = (contentWidth, contentHeight) => {
    if (contentHeight > heightRatio * 400) {
      setScroll(true);
    } else {
      setScroll(false);
    }
  };
  const HeaderComponentForList = (
    <View style={styles.ModalBody}>
      <View style={styles.ModalBodyItemContainer}>
        <View style={styles.ModalBodyItem}>
          <Text style={styles.ItemText}>Question</Text>
        </View>
        <TextInput
          placeholder="Enter your question"
          style={styles.InputBox}
          onChangeText={(feedback) => {
            QuestionChangeHandler(feedback);
          }}
          onSubmitEditing={() => {
            secondInputReference.current.focus();
          }}
        />
      </View>
      <View style={styles.ModalBodyItemContainer}>
        <View style={styles.ModalBodyItem}>
          <Text style={styles.ItemText}>Options</Text>
        </View>
        <TextInput
          placeholder="Enter your option"
          onChangeText={(feedback) => {
            OptionOneChangeHandler(feedback);
          }}
          style={styles.InputBox}
          onSubmitEditing={() => {
            thirdInputReference.current.focus();
          }}
          ref={secondInputReference}
        />
      </View>
      <View style={styles.ModalBodyItemContainer}>
        <View style={styles.ModalBodyItem}>
          <Text style={styles.ItemText} />
        </View>
        <TextInput
          onChangeText={(feedback) => {
            OptionTwoChangeHandler(feedback);
          }}
          style={styles.InputBox}
          placeholder="Enter your option"
          ref={thirdInputReference}
        />
      </View>
    </View>
  );
  const FooterComponentForList = (
    <View style={styles.ModalBodyItemContainer}>
      <View style={styles.ModalBodyItem}>
        <Text style={styles.SpecificItemText} />
      </View>
      <View style={styles.WrapperForTextAndAdd}>
        <Text style={styles.TextInAddWrapper}>Add new option</Text>
        <TouchableOpacity
          style={styles.AddButtonContainer}
          onPress={() => {
            addPollOption();
          }}>
          <Image
            source={require('./resources/add.png')}
            style={styles.AddButton}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Implemented to combine and display whole create poll view screen.
   * @param
   */
  const pollOptionView = (
    <FlatList
      data={optionArray}
      style={styles.ModalListContainer}
      renderItem={({ item }) => {
        return (
          <CometChatCreatePollOptions
            key={String(item.id)}
            option={item}
            optionChangeHandler={optionChangeHandler}
            removePollOption={removePollOption}
          />
        );
      }}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={showScroll}
      ListHeaderComponent={HeaderComponentForList}
      ListFooterComponent={FooterComponentForList}
      onContentSizeChange={onChangeScreenSize}
    />
  );

  return (
    <Modal transparent animated animationType="fade" visible={props.open}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <View style={styles.ModalWrapperStyle}>
            <View style={styles.ModalHeader}>
              <View style={styles.ModalHeadingContainer}>
                <Text style={styles.HeadingText}>Create Poll</Text>
                <TouchableOpacity
                  style={styles.ModalCloseButtonContainer}
                  onPress={() => {
                    props.close(); // props.close needed to be send as a function
                  }}>
                  {close}
                </TouchableOpacity>
              </View>
              {error && (error.error || error.error?.message) ? (
                <View style={styles.ModalErrorContainer}>
                  <Text style={styles.ErrorText}>
                    {error.error.message || error.error}
                  </Text>
                </View>
              ) : null}
            </View>
            {pollOptionView}
            <View style={styles.WrapperForCreateButton}>
              <TouchableOpacity
                style={styles.CreateButtonContainer}
                onPress={() => {
                  createPoll();
                }}>
                <Text style={styles.CreateButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <DropDownAlert ref={dropDownAlertRef} />
    </Modal>
  );
};
export default CometChatCreatePoll;
