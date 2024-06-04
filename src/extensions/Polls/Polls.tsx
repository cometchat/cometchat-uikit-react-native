import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import React, {
  useCallback,
  useContext,
  useEffect,
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
import { commonVars } from '../../shared/base/vars';
const { CommonUtil } = NativeModules;

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
  const [answers, setAnswers] = useState([]);
  const [kbOffset, setKbOffset] = React.useState(59);
  const [loader, setLoader] = React.useState(false);
  const loggedInUser = useRef(null);

  function validate() {
    if (!question) {
      setError(localize('INVALID_POLL_QUESTION'));
      return false;
    } else if (answers.length < 3 && !(answers.every(item => Boolean(item)))) {
      setError(answerHelpText || localize('INVALID_POLL_OPTION'));
      return false;
    } else {
      setError('');
      return true;
    }
  };

  function polls() {
    if (!validate()) return;
    setLoader(true);

    CometChat.callExtension('polls', 'POST', 'v2/create', {
      question: question,
      options: answers.filter(item => item),
      receiver: user ? user['uid'] : group ? group['guid'] : '',
      receiverType: user ? 'user' : group ? 'group' : '',
    })
      .then((response) => {
        console.log('poll created', response);
        onClose && onClose()
        setLoader(false);
        // Details about the created poll
      })
      .catch((error) => {
        console.log('poll error', error);
        setLoader(false);
        onError && onError(error);
        // Error occured
      });
  };

  function ErrorView() {
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

  function handleAnswerTextChange(text, index) {
    let existingAnswers = [...answers];
    existingAnswers[index] = text;
    setAnswers(existingAnswers);
  };

  function handleAddAnswerRow() {
    let existingAnswers = [...answers];
    existingAnswers.push("");
    setAnswers(existingAnswers);
  };

  function removeRow(id) {
    setAnswers((prev) => prev.filter((_, index) => id !== index));
  };

  function AnswersListItem({ item, index }: { item: string, index: number }) {
    return (
      <CometChatSwipeRow
        id={index + answers.length}
        options={
          defaultAnswers <= index
            ? () => [
              {
                id: index,
                icon: deleteIcon ?? ICONS.KICK,
                onPress: () => removeRow(index),
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
            value={item}
            onChangeText={(text) => handleAnswerTextChange(text, index)}
            placeholder={`${answerPlaceholderText} ${index + 1}`}
            placeholderTextColor={theme.palette.getAccent600()}
            style={[
              styles.textInputAnswers,
              {
                borderBottomColor: theme.palette.getAccent200(),
                color: theme.palette.getAccent(),
              },
              theme.typography.body,
              item?.length > 0
                ? createPollsStyle.answersPlaceholderTextStyle
                : createPollsStyle.answersInputTextStyle,
            ]}
          />
        </View>
      </CometChatSwipeRow>
    );
  };

  function AddAnswer() {
    return (
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
    );
  };

  useEffect(() => {
    let answerslist = new Array(defaultAnswers).fill("");
    setAnswers(answerslist);

    CometChat.getLoggedinUser()
      .then((u) => (loggedInUser.current = u))
      .catch((e) => { });

    if (Platform.OS === "ios") {
      if (Number.isInteger(commonVars.safeAreaInsets.top)) {
        setKbOffset(commonVars.safeAreaInsets.top)
        return;
      }
      CommonUtil.getSafeAreaInsets().then(res => {
        if (Number.isInteger(res.top)) {
          commonVars.safeAreaInsets.top = res.top;
          commonVars.safeAreaInsets.bottom = res.bottom;
          setKbOffset(res.top)
        }
      })
    }

  }, []);

  function getPollAnswers() {
    return (
      answers.map((item: string, index: number) => (
        AnswersListItem({ item, index })
      ))
    )
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: kbOffset + 10 })}
    >
      <ScrollView
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
        contentContainerStyle={{
          paddingBottom: 50
        }}
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
          onCancel={onClose ? onClose : () => { }}
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

        {getPollAnswers()}
        <AddAnswer />
        <ErrorView />
      </ScrollView>

      {loader && <View style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        zIndex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <ActivityIndicator size="large" />
      </View>}
    </KeyboardAvoidingView>
  );
};

CometChatCreatePoll.defaultProps = {
  title: 'Create Polls',
  questionPlaceholderText: localize('NAME'),
  answerPlaceholderText: localize('ANSWER'),
  createPollsStyle: {},
  defaultAnswers: 2,
};
