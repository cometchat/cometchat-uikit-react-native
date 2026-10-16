import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { commonVars } from "../../shared/base/vars";
import { Icon } from "../../shared/icons/Icon";
import { useTheme } from "../../theme";
import { useCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CometChatMessageEvents } from "../../shared/events/CometChatMessageEvents";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";
import { runAfterInteractions } from "../../shared/utils/runAfterInteractions";

const { CommonUtil } = NativeModules;

/**
 * Props for the CometChatCreatePoll component.
 */
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
   * @type {string}
   * @description Placeholder text for the poll question input
   */
  questionPlaceholderText?: string;
  /**
   *
   *
   * @type {(error: CometChat.CometChatException) => void}
   * @description Callback invoked when an error occurs
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   *
   *
   * @type {CometChat.User}
   * @description The user for which the poll is being created
   */
  user?: CometChat.User;
  /**
   *
   *
   * @type {CometChat.Group}
   * @description The group for which the poll is being created
   */
  group?: CometChat.Group;
  /**
   *
   *
   * @type {() => void}
   * @description Callback triggered when the close icon is pressed
   */
  onClose?: () => void;
  /**
   *
   *
   * @type {string}
   * @description Placeholder text for the answer inputs
   */
  answerPlaceholderText?: string;
  /**
   *
   *
   * @type {string}
   * @description Error message when answer fields are empty
   */
  answerHelpText?: string;
  /**
   *
   *
   * @type {string}
   * @description Text for the "Add Answers" button
   */
  addAnswerText?: string;
  /**
   *
   *
   * @type {number}
   * @description Default number of answer options
   */
  defaultAnswers?: number;
  /**
   *
   *
   * @type {CometChat.BaseMessage}
   * @description The message to reply to
   */
  replyToMessage?: CometChat.BaseMessage;
  /**
   *
   *
   * @type {() => void}
   * @description Function to close the reply preview
   */
  closeReplyPreview?: () => void;
}

/**
 * CometChatCreatePoll component allows the user to create a poll with a question and multiple answers.
 *
 * It validates the poll inputs, handles keyboard behavior, and makes an API call to create the poll.
 *
 * @param {CometChatCreatePollInterface} props - The props for the component.
 *
 * @returns {JSX.Element} The rendered poll creation UI.
 */
export const CometChatCreatePoll = (props: CometChatCreatePollInterface) => {
  const {
    title,
    questionPlaceholderText = "Ask question",
    onError,
    user,
    group,
    onClose,
    answerPlaceholderText = "Answers",
    answerHelpText,
    addAnswerText,
    defaultAnswers = 2,
    replyToMessage,
    closeReplyPreview,
  } = props;

  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [kbOffset, setKbOffset] = useState(59);
  const [loader, setLoader] = useState(false);
  const loggedInUser = useRef<CometChat.User | null>(null);
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const answerRefs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);
  const [lastRemovedIndex, setLastRemovedIndex] = useState<number | null>(null);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const LIMIT_ERROR = t("REACHED_MAX_LIMIT");

  /**
   * Validates the poll question and answer inputs.
   *
   * @returns True if validation passes; otherwise, false.
   */
  function validate() {
    if (!question.trim()) {
      setError(t("INVALID_POLL_QUESTION"));
      return false;
    }
    const filledAnswers = answers.filter((item) => item.trim() !== "");
    const hasEmptyAnswers = answers.some((item) => item.trim() === "");
    if (filledAnswers.length < 2) {
      setError(answerHelpText || t("INVALID_POLL_OPTION"));
      return false;
    }
    if (hasEmptyAnswers) {
      setError(answerHelpText || t("INVALID_POLL_OPTION"));
      return false;
    }
    setError("");
    return true;
  }

  /**
   * Submits the poll by calling the 'polls' extension.
   */
  function polls() {
    if (!validate()) return;
    setLoader(true);

    const payload: any = {
      question: question,
      options: answers.filter((item) => item),
      receiver: user ? user?.getUid() : group ? group?.getGuid() : "",
      receiverType: user ? "user" : group ? "group" : "",
    };

    if (replyToMessage) {
      payload.quotedMessageId = replyToMessage.getId();
    }

    if (closeReplyPreview) {
      closeReplyPreview();
    }

    CometChat.callExtension("polls", "POST", "v2/create", payload)
      .then((response) => {
        console.log("poll created", response);
        onClose && onClose();
        setLoader(false);
        if (replyToMessage) {
          CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
            message: replyToMessage,
            status: messageStatus.success,
          });
        }
      })
      .catch((error) => {
        console.log("poll error", error);
        setLoader(false);
        setError(t("SOMETHING_WRONG"));
        onError && onError(error);
      });
  }

  /**
   * Renders an error view if any validation error exists.
   *
   * @returns The error view or null if no error.
   */
  function ErrorView() {
    if (!error) return null;
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 8,
          backgroundColor: "rgba(255, 59, 48, 0.1)",
          justifyContent: "center",
          marginBottom: 10,
          paddingVertical: 10,
          paddingHorizontal: 15,
        }}
      >
        <Icon name='info' color={theme.color.error} size={20} />
        <Text
          style={[theme.typography.caption1.regular, { color: theme.color.error, marginLeft: 10 }]}
        >
          {error}
        </Text>
      </View>
    );
  }

  /**
   * Handles changes to the question input.
   *
   * @param {string} text - The updated question text.
   */
  function handleQuestionChange(text: string) {
    setQuestion(text);
    if (error) {
      setError("");
    }
  }

  /**
   * Handles changes to an answer input.
   *
   * @param {string} text - The updated answer text.
   * @param {number} index - The index of the answer being updated.
   */
  function handleAnswerTextChange(text: string, index: number) {
    let existingAnswers = [...answers];
    existingAnswers[index] = text;
    setAnswers(existingAnswers);
    if (error && error !== LIMIT_ERROR) {
      setError("");
    }
    if (index >= 2 && text.trim() === "") {
      const previousIndex = index - 1;
      if (previousIndex >= 0 && answerRefs.current[previousIndex]) {
        answerRefs.current[previousIndex]?.focus();
      }
      const currentIndex = index;
      setTimeout(() => {
        setAnswers((prevAnswers) => {
          const updatedAnswers = [...prevAnswers];
          if (
            currentIndex >= 0 &&
            currentIndex < updatedAnswers.length &&
            updatedAnswers[currentIndex].trim() === ""
          ) {
            updatedAnswers.splice(currentIndex, 1);
          }
          return updatedAnswers;
        });
      }, 100);
    }
  }

  /**
   * Adds a new answer row if the limit is not reached.
   */
  function handleAddAnswerRow() {
    if (answers.length < 12) {
      let existingAnswers = [...answers];
      existingAnswers.push("");
      setAnswers(existingAnswers);
      setNewlyAddedIndex(existingAnswers.length - 1);
    } else {
      setError(LIMIT_ERROR);
    }
  }

  /**
   * Renders each answer row.
   *
   * @param {{item: string, index: number}} param0 - The answer text and its index.
   * @returns {JSX.Element} The rendered answer input.
   */
  const renderAnswerItem = ({ item, index }: { item: string; index: number }) => (
    <View
      onStartShouldSetResponder={() => true}
      style={{
        flexDirection: "row",
        width: "100%",
        alignSelf: "center",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <TextInput
        ref={(el) => {
          answerRefs.current[index] = el;
        }}
        value={item}
        autoFocus={index === newlyAddedIndex}
        onChangeText={(text) => handleAnswerTextChange(text, index)}
        placeholder={answerPlaceholderText}
        placeholderTextColor={theme.color.textTertiary}
        style={{
          flex: 1,
          padding: Platform.select({ android: 5, ios: 10 }),
          borderWidth: 1,
          borderColor: theme.color.borderLight,
          borderRadius: 8,
          paddingLeft: 10,
          color: theme.color.textPrimary,
        }}
      />
    </View>
  );

  /**
   * Renders the "Add Answer" button.
   *
   * @returns The add answer button or null if limit reached.
   */
  function AddAnswer() {
    if (answers.length >= 12) {
      return <View style={{ height: 10 }} />;
    }
    return (
      <TouchableOpacity
        onPress={handleAddAnswerRow}
        style={{
          height: 56,
          width: "100%",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 10,
        }}
      >
        <Text
          style={[
            theme.typography.caption1.medium,
            { color: theme.color.primary, textAlign: "center" },
          ]}
        >
          {"+ " + (addAnswerText || t("ADD_OPTIONS"))}
        </Text>
      </TouchableOpacity>
    );
  }

  useLayoutEffect(() => {
    if (lastRemovedIndex !== null) {
      const previousIndex = lastRemovedIndex - 1;
      if (previousIndex >= 0 && answerRefs.current[previousIndex]) {
        answerRefs.current[previousIndex]?.focus();
      }
      setLastRemovedIndex(null);
    }
  }, [lastRemovedIndex]);

  useEffect(() => {
    if (newlyAddedIndex !== null) {
      const timer = setTimeout(() => {
        if (answerRefs.current[newlyAddedIndex]) {
          answerRefs.current[newlyAddedIndex]?.focus();
        }
        setNewlyAddedIndex(null);
      }, 50);

      return () => clearTimeout(timer);
    }
    return;
  }, [newlyAddedIndex]);

  useEffect(() => {
    answerRefs.current = answers.map((_, i) => answerRefs.current[i] || null);
  }, [answers]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (answers.length > 0 && flatListRef.current) {
      timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [answers.length]);

  useEffect(() => {
    if (answers.length) {
      runAfterInteractions(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [answers.length]);

  useEffect(() => {
    if (error === LIMIT_ERROR && answers.length < 12) {
      setError("");
    }
  }, [answers, error]);

  useEffect(() => {
    const isMaxAndAllFilled = answers.length >= 12 && answers.every((a) => a.trim() !== "");
    if (isMaxAndAllFilled) {
      setError(LIMIT_ERROR);
    }
    // do nothing when condition not met — the other effect you already added clears LIMIT_ERROR when answers < 12
  }, [answers]);

  useEffect(() => {
    let answerslist = new Array(defaultAnswers).fill("");
    setAnswers(answerslist);
    CometChat.getLoggedinUser()
      .then((u) => (loggedInUser.current = u))
      .catch((e) => {});
    if (Platform.OS === "ios") {
      if (Number.isInteger(commonVars.safeAreaInsets.top)) {
        setKbOffset(commonVars.safeAreaInsets.top!);
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.background1 }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        enabled={Platform.OS === "ios"}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingTop: Platform.OS === "ios" ? insets.top : 0,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{ flexDirection: "row", paddingVertical: 20, paddingLeft: 10 }}
              >
                <Icon name='arrow-back' />
              </TouchableOpacity>
              <Text
                style={[
                  theme.typography.heading2.bold,
                  { color: theme.color.iconPrimary, paddingLeft: 10 },
                ]}
              >
                {title ? title : t("CREATE_POLL")}
              </Text>
            </View>
            {/* Question Input */}
            <View style={{ borderTopWidth: 1, borderColor: theme.color.borderLight }}>
              <View style={{ paddingHorizontal: 20 }}>
                <Text
                  style={[
                    theme.typography.heading4.medium,
                    { marginTop: 15, color: theme.color.textPrimary },
                  ]}
                >
                  {t("QUESTION")}
                </Text>
                <TextInput
                  value={question}
                  onChangeText={handleQuestionChange}
                  placeholder={questionPlaceholderText}
                  placeholderTextColor={theme.color.textTertiary}
                  style={[
                    {
                      padding: Platform.select({ android: 5, ios: 10 }),
                      borderWidth: 1,
                      borderColor: theme.color.borderLight,
                      borderRadius: 8,
                      marginTop: 10,
                      paddingLeft: 10,
                      color: theme.color.textPrimary,
                    },
                  ]}
                />
                <Text
                  style={[
                    theme.typography.heading4.medium,
                    { marginTop: 25, color: theme.color.textPrimary, marginBottom: 2 },
                  ]}
                >
                  {t("OPTIONS")}
                </Text>
              </View>
            </View>
            {/* Main Content: Answers list */}
            <View style={{ flex: 1 }}>
              <FlatList
                ref={flatListRef}
                data={answers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderAnswerItem}
                // render a footer only when needed, avoiding a permanently present wrapper that causes extra space
                ListFooterComponent={() => (
                  <View style={{ paddingBottom: answers.length >= 12 ? 10 : 20 }}>
                    <AddAnswer />
                  </View>
                )}
                removeClippedSubviews={false}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='interactive'
                contentContainerStyle={{
                  paddingBottom: 20,
                  paddingTop: 10,
                  paddingHorizontal: 20,
                }}
                automaticallyAdjustContentInsets={false}
                onScrollToIndexFailed={() => {}}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
        {/* Loader Overlay */}
        {loader && (
          <View
            style={{
              position: "absolute",
              height: "100%",
              width: "100%",
              zIndex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <ActivityIndicator size='large' color={theme.color.primary} />
          </View>
        )}
        {/* Fixed Create Button */}
        <View
          style={{
            paddingHorizontal: 20,
            backgroundColor: theme.color.background1,
            // Both platforms: an edge-to-edge Android window (RN 0.86+ Modals, targetSdk 35+)
            // draws under the navigation bar, so the fixed 10 left Create hidden behind it.
            // Non-edge-to-edge Android reports a 0 inset, so this stays 10 there.
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          {error && <ErrorView />}
          <TouchableOpacity
            onPress={polls}
            style={{
              width: "100%",
              backgroundColor: theme.color.primaryButtonBackground,
              alignItems: "center",
              borderRadius: 8,
              paddingVertical: 12,
              marginBottom: Platform.select({ ios: 0, android: 10 }),
            }}
          >
            <Text
              style={[theme.typography.button.medium, { color: theme.color.primaryButtonText }]}
            >
              {t("CREATE")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
