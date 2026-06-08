import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageStyle,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  DimensionValue,
  ColorValue,
  Pressable,
} from "react-native";
import { makeExtentionCall } from "../../shared/utils/CometChatMessageHelper";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTheme } from "../../theme/type";
import { CometChatAvatar } from "../../shared/views/CometChatAvatar";
import { useTheme } from "../../theme";
import { Icon } from "../../shared/icons/Icon";

/**
 *
 *
 * @type {string}
 * @description poll question
 */
export interface PollsBubbleInterface {
  /**
   *
   *
   * @type {string}
   * @description poll question
   */
  pollQuestion?: string;
  /**
   *
   *
   * @type {({ id: string | number; value: string }[])}
   * @description options
   */
  options?: { id: string | number; value: string }[];
  /**
   *
   *
   * @type {string}
   * @description poll id
   */
  pollId?: string;
  /**
   *
   *
   * @type {CometChat.User}
   * @description logged in user
   */
  loggedInUser?: CometChat.User;
  /**
   *
   *
   * @description callback function which returns the id when user votes
   */
  choosePoll?: (id: string) => void;
  /**
   *
   *
   * @type {string}
   * @description uid of poll creator
   */
  senderUid?: string;
  /**
   *
   *
   * @type {object}
   * @description metadata attached to the poll message
   */
  metadata?: any;

  /***************************/
  /**
   *
   *
   * @type {TextStyle}
   * @description Style for the poll question text
   */
  titleStyle?: TextStyle;
  /**
   *
   *
   * @type {TextStyle}
   * @description Style for the option text
   */
  optionTextStyle?: TextStyle;
  /**
   *
   *
   * @type {TextStyle}
   * @description Style for the vote count text
   */
  voteCountTextStyle?: TextStyle;
  /**
   *
   *
   * @type {ImageStyle}
   * @description Style for the selected icon
   */
  selectedIconStyle?: ImageStyle;
  /**
   *
   *
   * @type {ViewStyle}
   * @description Style for the radio button container
   */
  radioButtonStyle?: ViewStyle;
  /**
   *
   *
   * @type {CometChatTheme["avatarStyle"]}
   * @description Style for the voter avatar
   */
  voteravatarStyle?: CometChatTheme["avatarStyle"];
  /**
   *
   *
   * @type {ViewStyle}
   * @description Style for the progress bar container
   */
  progressBarStyle?: ViewStyle;
  /**
   *
   *
   * @type {ColorValue}
   * @description Active tint color for the progress bar
   */
  activeProgressBarTint?: ColorValue;
}

export const PollsBubble = (props: PollsBubbleInterface) => {
  const {
    pollQuestion,
    options,
    pollId,
    loggedInUser,
    choosePoll,
    senderUid,
    metadata,
    titleStyle,
    optionTextStyle,
    voteCountTextStyle,
    selectedIconStyle,
    radioButtonStyle,
    voteravatarStyle,
    progressBarStyle,
    activeProgressBarTint,
  } = props;
  const theme = useTheme();
  const [optionsList, setOptionsList] = useState<Array<{ id: any; value: any }>>([]);
  const [optionsMetaData, setOptionsMetaData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  // Track which option is being voted on for showing the loader
  const [loadingOption, setLoadingOption] = useState<string | number | null>(null);
  // State to track the selected vote so that the tick icon appears
  const [selectedVote, setSelectedVote] = useState<string | number | null>(null);

  useEffect(() => {
    let allOptions: Array<{ id: any; value: any }> = [];
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        allOptions.push({ id: key, value });
      }
    }
    setOptionsList(allOptions);
    if (metadata) {
      setOptionsMetaData(metadata);
    }
    const optionsFromResult = metadata?.results?.options ?? {};

    for (const key in optionsFromResult) {
      if (
        optionsFromResult[key] &&
        optionsFromResult[key].voters &&
        Object.keys(optionsFromResult[key].voters).length
      ) {
        if (loggedInUser && optionsFromResult[key].voters[loggedInUser.getUid()]) {
          setSelectedVote(key);
        }
      }
    }
  }, [metadata, options, loggedInUser]);

  /**
   * Handles the vote action for a poll option.
   *
   * @param {string} id - The id of the option being voted for.
   */
  const handleResult = (id: string) => {
    let newOptionsMetaData = { ...optionsMetaData };
    if (newOptionsMetaData.results?.options[id]?.["voters"]?.[loggedInUser?.getUid()]) return;
    // Set the loading option id here
    setLoadingOption(id);
    setIsLoading(true);
    choosePoll && choosePoll(id);
    makeExtentionCall("polls", "POST", "v2/vote", {
      vote: id,
      id: pollId ?? optionsMetaData.id,
    })
      .then((s) => {
        console.log("success", s);
        // Update the selected vote so that the check icon appears
        setSelectedVote(id);
        setIsLoading(false);
        setLoadingOption(null);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
        setLoadingOption(null);
      });
  };

  /**
   * Renders an option item.
   *
   * @param {any} param0 - Object containing id and value of the option.
   * @returns {JSX.Element} The rendered option item.
   */
  const OptionItem = ({ id, value }: any) => {
    // Adjust avatar styles if needed
    const secondavatarStyle = voteravatarStyle;
    const thirdavatarStyle = voteravatarStyle;
    if (secondavatarStyle && secondavatarStyle.containerStyle) {
      secondavatarStyle.containerStyle.marginLeft = -10;
    }
    if (thirdavatarStyle && thirdavatarStyle.containerStyle) {
      thirdavatarStyle.containerStyle.marginLeft = -10;
    }
    // Ensure value is a string for rendering
    let optionText = typeof value === 'string' ? value : (value && value.value ? value.value : String(value));
    return (
      <Pressable
        style={{ flexDirection: "row", marginBottom: 15, gap: 10 }}
        onPress={() => handleResult(id)}
      >
        {isLoading && loadingOption === id ? (
          <ActivityIndicator
            size="small"
            color={activeProgressBarTint}
            // Remove circle border/background during loading
            style={[radioButtonStyle, { borderWidth: 0, backgroundColor: "transparent" }]}
          />
        ) : selectedVote !== id ? (
          <View style={radioButtonStyle}></View>
        ) : (
          <Icon
            name="check"
            color={selectedIconStyle?.tintColor}
            height={selectedIconStyle?.height}
            width={selectedIconStyle?.width}
            containerStyle={{
              ...radioButtonStyle,
              borderWidth: 0,
              backgroundColor: activeProgressBarTint,
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        )}

        <View style={{ gap: 5, width: "100%", flex: 1 }}>
          <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={optionTextStyle}>{optionText}</Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.spacing.s1 }}>
              <View style={{ left: 0, flexDirection: "row" }}>
                {optionsMetaData?.results?.options?.[id]?.voters &&
                  Object.keys(optionsMetaData.results.options[id].voters)
                    .slice(0, 3)
                    .map((key, index) => {
                      const voter = optionsMetaData.results.options[id].voters[key];
                      return (
                        <CometChatAvatar
                          key={key} // Unique key for each voter
                          image={{ uri: voter.avatar }}
                          style={
                            index === 0
                              ? secondavatarStyle
                              : index === 1
                              ? thirdavatarStyle
                              : voteravatarStyle
                          } // Apply different styles based on index
                          name={voter.name}
                        />
                      );
                    })}
              </View>

              <Text style={voteCountTextStyle}>
                {optionsMetaData?.results?.options?.[id]?.count ?? 0}
              </Text>
            </View>
          </View>
          <View style={progressBarStyle}>
            <View
              style={[
                progressBarStyle,
                {
                  backgroundColor: activeProgressBarTint,
                  width: getSliderWidth(
                    optionsMetaData?.results?.options?.[id]?.voters
                      ? Object.keys(optionsMetaData.results.options[id].voters).length
                      : 0
                  ),
                },
              ]}
            ></View>
          </View>
        </View>
      </Pressable>
    );
  };

  /**
   * Calculates the width of the progress bar based on the number of voters.
   *
   * @param {number} voters - The number of voters for an option.
   * @returns {DimensionValue} The width percentage for the progress bar.
   */
  const getSliderWidth = useCallback(
    (voters: number) => {
      const totalVotes = metadata?.results?.total ?? 0;
      return totalVotes ? (((voters / totalVotes) * 100 + "%") as DimensionValue) : "0%";
    },
    [metadata]
  );

  return (
    <View style={[style.container]}>
      <Text style={titleStyle}>{pollQuestion}</Text>
      {optionsList.map((item) => (
        <OptionItem key={item["id"]} {...item} />
      ))}
    </View>
  );
};

const style = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginBottom: 20,
  },
  questionText: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  voteText: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  optionItemContainer: {
    marginHorizontal: 5,
    marginTop: 5,
    height: 42,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    flexDirection: "row",
  },
  optionsOption: {
    height: 20,
    width: 20,
    borderRadius: 20,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    marginHorizontal: 10,
  },
  resultMask: {
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
    height: "100%",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  centerPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
