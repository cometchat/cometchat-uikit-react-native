import { StyleSheet } from 'react-native';

export const Styles = StyleSheet.create({
  messageReactionListStyle: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: 6,
    marginBottom: 5,
    borderRadius: 11,
  },
  reactionCountStyle: {
    paddingRight: 2,
    paddingLeft: 4,
  },
});
