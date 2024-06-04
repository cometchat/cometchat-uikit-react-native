import React from "react";
import { View, Animated, Dimensions, Easing, SafeAreaView } from "react-native";
import { Style } from "./style";
import heart from "./resources/heart.png";
import { LiveReactionStyles, LiveReactionStylesInterface } from "./LiveReactionstyles";
import { ImageType } from "../../base";

const { height: deviceHeight } = Dimensions.get('window');

const ANIMATION_END_Y = Math.ceil(deviceHeight * 0.5);
const NEGATIVE_END_Y = ANIMATION_END_Y * -1;

export interface LiveReactionsInterface {
  reaction?: ImageType,
  style?: LiveReactionStylesInterface,
} 

const AnimteReaction = ({ left = 0, timeout = 0, onComplete = () => { }, reactionIcon = heart, style = {} }) => {
  const position = new Animated.Value(0)
  const opacity = new Animated.Value(0)

  React.useEffect(() => {
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          useNativeDriver: true,
          duration: 300
        }),
        Animated.timing(position, {
          toValue: 50,
          useNativeDriver: true,
          duration: 800,
          easing: Easing.sin
        }),

        Animated.timing(opacity, {
          toValue: 0,
          useNativeDriver: true,
          duration: 100
        })
      ]).start(onComplete)
    }, timeout);
  }, [])

  let signWave = position.interpolate({
    inputRange: [0, 10, 20, 30, 40],
    outputRange: [0, 20, -5, 20, 0]
  });

  let signWaveY = position.interpolate({
    inputRange: [0, 50],
    outputRange: [0, NEGATIVE_END_Y / 2],
  });

  let fade = position.interpolate({
    inputRange: [0, 45, 50],
    outputRange: [1, 0.8, 0]
  })

  return (
    <View style={{
      position: 'absolute',
      left,
      ...style
    }}>
      <Animated.Image
        source={reactionIcon}
        style={{
          resizeMode: 'contain',
          height: 25,
          width: 25,
          opacity: opacity,
          transform: [
            { translateX: signWave },
            { translateY: signWaveY }
          ]
        }}>
      </Animated.Image>
    </View>
  )
}

/**
 *
 * CometChatLiveReaction component allows user to show animated images as a reaction in real-time.
 * @version 1.0.0
 * @author CometChatTeam
 *
 */
export const CometChatLiveReactions = (props: LiveReactionsInterface) => {

  const reactionPosition = [
    {id: "1", timeout:10, left:-20},
    {id: "2", timeout:200, left:-50},
    {id: "3", timeout:500, left:-30},
    {id: "4", timeout:400, left:-20},
    {id: "5", timeout:100, left:-40},
    {id: "6", timeout:180, left:-50},
    {id: "7", timeout:150, left:-20},
    {id: "8", timeout:80, left:-45},
    {id: "9", timeout:160, left:-20},
    {id: "10", timeout:200, left:-70},
  ];

  return (
    <View style={Style.reactionStyle}>
      {
          reactionPosition.map(i =>
            <AnimteReaction
              key={i['id']}
              reactionIcon={props.reaction || heart}
              timeout={i['timeout']}
              left={i['left']}
            />
          )
      }
    </View>
  );
};
