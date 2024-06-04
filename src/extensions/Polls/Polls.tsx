import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Header from './Header';
import { styles } from './style';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  BorderStyleInterface,
  FontStyleInterface,
  ImageType,
} from '../../shared/base';
import { CometChatContext } from "../../shared/CometChatContext";
import { localize } from "../../shared/resources/CometChatLocalize";
import { ICONS } from './resources';
import { CometChatContextType } from '../../shared/base/Types';
import { CometChatSwipeRow } from '../../shared/views/SwipeRow';

export interface PollsStyleInterface {
  titleTextStyle?: FontStyleInterface;
  closeIconTint?: string;
  createIconTint?: string;
  questionPlaceholderTextStyle?: FontStyleInterface;
  answersPlaceholderTextStyle?: FontStyleInterface;
  questionInputTextStyle?: FontStyleInterface;
  answersInputTextStyle?: FontStyleInterface;
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
}
export interface CometChatCreatePollInterface {
  /**
   *
   *
   * @type {string}
   * @description Title of the component
   */
  title?: string;
  /**
   *
   *
   * @type {ImageType}
   * @description Close icon
   */
  closeIcon?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Create icon
   */
  createIcon?: ImageType;
  /**
   *
   *
   * @type {string}
   * @description Text to appear in the input when no value is set
   */
  questionPlaceholderText?: string;
  /**
   *
   * @type {(error: CometChat.CometChatException) => void}
   * @description Method triggered when an error is encountered in the component
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   *
   *
   * @type {PollsStyleInterface}
   * @description Styling properties of the component
   */
  createPollsStyle?: PollsStyleInterface;

  /**
   *
   *
   * @type {CometChat.User}
   * @description CometChatCreatePollInterface
   */
  user?: CometChat.User;
  /**
   *
   *
   * @type {CometChat.Group}
   * @description CometChatCreatePollInterface
   */
  group?: CometChat.Group;
  /**
   *
   *
   * @type {()=>void}
   * @description callback when click on close Icon
   */
  onClose?: () => void;
  /**
   *
   *
   * @type {string}
   * @description PlaceHolder text for answers TextInput
   */
  answerPlaceholderText?: string;
  /**
   *
   *
   * @type {string}
   * @description Error message when answers fields are empty
   */
  answerHelpText?: string;
  /**
   *
   *
   * @type {string}
   * @description Text for Add answers button
   */
  addAnswerText?: string;
  /**
   *
   *
   * @type {ImageType}
   * @description Custom Delete Icon
   */
  deleteIcon?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Custom Create Poll icon
   */
  createPollIcon?: ImageType;
  /**
   *
   * @type {number}
   * @desciption Default no. of Answers
   */
  defaultAnswers?: number;
}
export const CometChatCreatePoll = (props: CometChatCreatePollInterface) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    title,
    closeIcon,
    createIcon,
    questionPlaceholderText,
    onError,
    createPollsStyle,
    user,
    group,
    onClose,
    answerPlaceholderText,
    answerHelpText,
    addAnswerText,
    deleteIcon,
    createPollIcon,
    defaultAnswers,
  } = props;

  const [question, setQuestion] = React.useState('');
  const [error, setError] = React.useState('');
  const [answersList, setAnswersList] = useState([]);
  const [answers, setAnswers] = useState({});
  const loggedInUser = useRef(null);
  const answersFinalValues = useRef([]);

  const validate = () => {
    let answersValues = [];
    if (!question) {
      setError(localize('INVALID_POLL_QUESTION'));
      return false;
    }
    if (answersList.length === 0) {
      setError(localize('INVALID_POLL_OPTION'));
      return false;
    }
    for (const value of Object.values(answers)) {
      if (value) answersValues.push(value);
    }
    if (answersValues.length === 0) {
      setError(answerHelpText ?? localize('INVALID_POLL_OPTION'));
      return false;
    }
    answersFinalValues.current = answersValues;
    setError('');
    return true;
  };

  const polls = () => {
    if (!validate()) return;

    CometChat.callExtension('polls', 'POST', 'v2/create', {
      question: question,
      options: answersFinalValues.current,
      receiver: user ? user['uid'] : group ? group['guid'] : '',
      receiverType: user ? 'user' : group ? 'group' : '',
    })
      .then((response) => {
        console.log('poll created', response);
        onClose && onClose()
        // Details about the created poll
      })
      .catch((error) => {
        console.log('poll error', error);

        onError && onError(error);
        // Error occured
      });
  };

  const ErrorView = () => {
    if (!error && error === '') return null;

    return (
      <View
        style={[
          styles.errorContainer,
          {
            backgroundColor: 'rgba(255, 59, 48, 0.1)', //Note add this color to palette
          },
        ]}
      >
        <View
          style={[
            styles.errorImageContainer,
            {
              backgroundColor: theme.palette.getError(),
            },
          ]}
        >
          <Image
            source={ICONS.WARNING}
            style={[
              styles.errorImage,
              { tintColor: theme.palette.getBackgroundColor() },
            ]}
          />
        </View>
        <View style={styles.errorTextContainer}>
          <Text
            style={[
              styles.errorTextTitle,
              theme.typography.body,
              { color: theme.palette.getError() },
            ]}
          >
            {error?.length > 0 ? error : ''}
          </Text>
          <Text
            style={[
              styles.errorText,
              theme.typography.body,
              { color: theme.palette.getError() },
            ]}
          >
            {localize('TRY_AGAIN_LATER')}
          </Text>
        </View>
      </View>
    );
  };

  const handleAnswerTextChange = (text, index) => {
    setAnswers((prev) => {
      return { ...prev, [index]: text };
    });
  };

  const handleAddAnswerRow = () => {
    setAnswersList((prev) => [
      ...prev,
      { id: prev[prev.length - 1]['id'] + 1 },
    ]);
  };

  const removeRow = (id) => {
    setAnswersList((prev) => prev.filter((_) => _.id !== id));
  };

  const AnswersListItem = ({ item, index }) => {
    return (
      <>
        <CometChatSwipeRow
          id={item.id}
          options={
            defaultAnswers <= item.id
              ? () => [
                  {
                    id: item.id,
                    icon: deleteIcon ?? ICONS.KICK,
                    onPress: removeRow,
                  },
                ]
              : () => []
          }
        >
          <View
            style={{
              backgroundColor:
                createPollsStyle?.backgroundColor ??
                theme.palette.getBackgroundColor(),
            }}
          >
            <TextInput
              value={answers[item.id]}
              onChangeText={(text) => handleAnswerTextChange(text, item.id)}
              placeholder={`${answerPlaceholderText} ${index + 1}`}
              placeholderTextColor={theme.palette.getAccent600()}
              style={[
                styles.textInputAnswers,
                {
                  borderBottomColor: theme.palette.getAccent200(),
                  color: theme.palette.getAccent(),
                },
                theme.typography.body,
                answers[item.id]?.length > 0
                  ? createPollsStyle.answersPlaceholderTextStyle
                  : createPollsStyle.answersInputTextStyle,
              ]}
            />
          </View>
        </CometChatSwipeRow>
      </>
    );
  };

  const AddAnswer = () => {
    return (
      <>
        <TouchableOpacity
          onPress={handleAddAnswerRow}
          style={{
            height: 56,
            width: '100%',
            justifyContent: 'center',
            paddingHorizontal: 5,
          }}
        >
          <Text
            style={[
              theme.typography.name,
              {
                color: theme.palette.getPrimary(),
              },
            ]}
          >
            {addAnswerText ?? localize('ADD_ANOTHER_ANSWER')}
          </Text>
        </TouchableOpacity>
        <ErrorView />
      </>
    );
  };

  useLayoutEffect(() => {
    let answerslist = [];
    for (let index = 0; index < defaultAnswers; index++) {
      answerslist.push({ id: index });
    }
    setAnswersList(answerslist);
    CometChat.getLoggedinUser()
      .then((u) => (loggedInUser.current = u))
      .catch((e) => {});
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          width: createPollsStyle.width ?? 'auto',
          height: createPollsStyle.height ?? 'auto',
          backgroundColor:
            createPollsStyle.backgroundColor ??
            theme.palette.getBackgroundColor(),
          borderRadius: createPollsStyle.borderRadius ?? 0,
        },
        createPollsStyle.border ?? {},
      ]}
    >
      <Header
        title={title}
        joinIcon={createPollIcon ?? createIcon}
        closeIcon={closeIcon}
        titleStyle={[
          createPollsStyle.titleTextStyle ?? theme.typography.heading,
          { color: theme.palette.getAccent() },
        ]}
        closeIconTint={
          createPollsStyle.closeIconTint ?? theme.palette.getPrimary()
        }
        createIconTint={
          createPollsStyle.createIconTint ?? theme.palette.getPrimary()
        }
        onSubmit={polls}
        onCancel={onClose ? onClose : () => {}}
      />
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder={questionPlaceholderText}
        placeholderTextColor={theme.palette.getAccent600()}
        style={[
          styles.textInput,
          {
            borderBottomColor: theme.palette.getAccent200(),
            color: theme.palette.getAccent(),
          },
          theme.typography.body,
          question?.length > 0
            ? createPollsStyle.questionPlaceholderTextStyle
            : createPollsStyle.questionInputTextStyle,
        ]}
      />
      <View style={styles.addAnswerButtonContainer}>
        <Text
          style={
            (theme.typography.text2,
            {
              color: theme.palette.getAccent500(),
            })
          }
        >
          {localize('SET_THE_ANSWERS')}
        </Text>
      </View>
      <FlatList
        keyExtractor={(_, i) => `${i}`}
        data={answersList}
        renderItem={AnswersListItem}
        ListFooterComponent={AddAnswer}
      />
    </View>
  );
};

CometChatCreatePoll.defaultProps = {
  title: 'Create Polls',
  questionPlaceholderText: localize('NAME'),
  answerPlaceholderText: localize('ANSWER'),
  createPollsStyle: {},
  defaultAnswers: 2,
};
