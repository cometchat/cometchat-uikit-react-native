import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { FontStyle } from '../../shared/base';
import { CometChatContext } from "../../shared/CometChatContext";
import { makeExtentionCall } from '../../shared/utils/CometChatMessageHelper';
import { ICONS } from './resources';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface PollsBubbleStyleInterface {
  questionTextStyle: FontStyle;
  questionTextColor: string;
  // pollResultTextStyle: FontStyle;
  // pollResultTextColor: string;
  voteCountTextStyle: FontStyle;
  voteCountTextColor: string;
  pollOptionsTextStyle: FontStyle;
  pollOptionsTextColor: string;
  radioButtonColor: string;
  pollOptionsBackgroundColor: string;
  selectedOptionColor: string;
  unSelectedOptionColor: string;
}
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
   * @description callback function which return id when user votes
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
  metadata?: object;
  /**
   *
   *
   * @type {PollsBubbleStyleInterface}
   * @description PollsBubbleInterface
   */
  pollsBubbleStyle?: PollsBubbleStyleInterface;
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
    pollsBubbleStyle,
  } = props;
  const { theme } = useContext(CometChatContext);
  const [optionsList, setOptionsList] = useState([]);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [result, setResult] = useState<any>({});
  const [optionsMetaData, setOptionsMetaData] = useState<any>({});
  const [selectedOption, setSelectedOption] = useState<any>({});
  const maxScore = useRef(0);

  const getResult = (self, metadata) => {
    let allOptions = {};
    if (metadata.results?.options) {
      for (const [key, value] of Object.entries(metadata.results?.options)) {
        if (typeof value === 'object') {
          if (maxScore.current < value['count'])
            maxScore.current = value['count'];
          allOptions[key] = {
            ...value,
            percent: self
              ? (value['count'] / metadata.results.total) * 100
              : (value['count'] / (metadata.results.total + 1)) * 100,
          };
        }
      }
      setResult(allOptions);
      setIsResultVisible(true);
    }
  };

  const handleResult = ({ id }: any) => {
    if (loggedInUser['uid'] == senderUid)
      return;
    choosePoll && choosePoll(id);
    setSelectedOption((prev) => ({ ...prev, [id]: !prev[id] }));
    makeExtentionCall('polls', 'POST', 'v2/vote', {
      vote: id,
      id: pollId ?? optionsMetaData.id,
    })
      .then((s) => {
        console.log('success', s);
        getResult(false, optionsMetaData);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const OptionItem = ({ id, value }) => {
    return (
      <TouchableOpacity
        key={id}
        onPress={() => handleResult({ id })}
        style={[
          style.optionItemContainer,
          {
            backgroundColor:
              pollsBubbleStyle.pollOptionsBackgroundColor ??
              theme.palette.getBackgroundColor(),
          },
        ]}
      >
        {isResultVisible ? (
          <View
            style={[
              style.resultMask,
              {
                borderTopRightRadius: result[id]['percent'] > 99 ? 6 : 0,
                borderBottomRightRadius: result[id]['percent'] > 99 ? 6 : 0,
                backgroundColor:
                  maxScore.current === result[id]['count']
                    ? pollsBubbleStyle.selectedOptionColor ??
                      'rgba(51, 153, 255,0.2)'
                    : pollsBubbleStyle.unSelectedOptionColor ??
                      theme.palette.getAccent200(),
                width: result[id] ? `${result[id]['percent']}%` : 0,
              },
            ]}
          />
        ) : (
          <View
            style={[
              style.optionsOption,
              {
                backgroundColor:
                  pollsBubbleStyle.radioButtonColor ??
                  theme.palette.getAccent200(),
              },
            ]}
          >
            {selectedOption[id] === true && (
              <Image
                source={ICONS.TICK}
                resizeMode="contain"
                style={{
                  height: 14,
                  tintColor: theme.palette.getAccent(),
                }}
              />
            )}
          </View>
        )}
        <Text
          style={[
            style.valueText,
            {
              color:
                pollsBubbleStyle.pollOptionsTextColor ??
                theme.palette.getAccent(),
            },
            theme.typography.subtitle1,
            pollsBubbleStyle.pollOptionsTextStyle,
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  const getVoters = (metadata) => {
    let voters: {};
    if (metadata)
      for (const value of Object.values(metadata)) {
        if (typeof value === 'object') {
          for (const value2 of Object.values(value)) {
            for (const value3 of Object.values(value2)) {
              if (value3['voters']) {
                let votersKey = Object.keys(value3['voters'])[0];
                voters = {
                  ...voters,
                  [votersKey]: true,
                };
              }
            }
          }
        }
      }

    return voters;
  };

  useLayoutEffect(() => {
    let allOptions = [];
    for (const [key, value] of Object.entries(options)) {
      allOptions.push({ id: key, value });
    }
    setOptionsList(allOptions);
    if (metadata) {
      setOptionsMetaData(metadata);

      loggedInUser['uid'] == senderUid && getResult(true, metadata);
      let voters = getVoters(metadata);
      if (voters) voters[loggedInUser['uid']] && getResult(true, metadata);
    }
  }, []);

  return (
    <View style={[style.container]}>
      <Text
        style={[
          theme.typography.subtitle1,
          {
            color:
              pollsBubbleStyle.questionTextColor ?? theme.palette.getAccent(),
          },
          style.questionText,
          pollsBubbleStyle.questionTextStyle,
        ]}
      >
        {pollQuestion}
      </Text>

      {optionsList.map((item) => (
        <OptionItem key={item['id']} {...item} />
      ))}
      <Text
        style={[
          theme.typography.subtitle1,
          style.voteText,
          {
            color:
              pollsBubbleStyle.voteCountTextColor ??
              theme.palette.getAccent600(),
          },
          pollsBubbleStyle.voteCountTextStyle,
        ]}
      >
        {optionsMetaData.results?.total} people voted
      </Text>
    </View>
  );
};

const style = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginBottom: 5,
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
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
  },
  optionsOption: {
    height: 20,
    width: 20,
    borderRadius: 20,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    marginLeft: 10,
  },
  resultMask: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    height: '100%',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
});
PollsBubble.defaultProps = {
  options: {},
  loggedInUser: {},
  pollsBubbleStyle: {},
};
