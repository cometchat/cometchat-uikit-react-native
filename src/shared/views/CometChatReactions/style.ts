import { StyleSheet } from 'react-native';

export const Styles = StyleSheet.create({
  messageReactionListStyle: {
    marginTop: -3,
    flexDirection: 'row',
    alignItems: 'center',
    // flexWrap: 'wrap',
  },
  reactionListStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: 'black',
    marginVertical: 0,
    padding: 0,
  },
  messageAddReactionStyle: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
    width: 30,
    marginHorizontal: 5,
  },
  emojiButtonStyle: {
    padding: 0,
  },
  messageReactionsStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 2,
    // marginBottom: 5,
    borderRadius: 20,
  },
  reactionCountStyle: {
    paddingRight: 2,
    paddingLeft: 4,
  },
});
