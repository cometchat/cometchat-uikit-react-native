import { StyleSheet } from 'react-native';

export const Styles = StyleSheet.create({
  emojiContainerStyle: {
    padding: 0,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
  },

  scrollViewStyle: {
    // marginTop: 10,
  },

  emojiListStyle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },

  emojiCategoryWrapper: {
    // justifyContent: "center",
    // alignItems: "center",
  },

  emojiCategoryTitle: {
    // let color = theme?.palette?.getAccent500();
    // let font = theme?.typography?.caption1;
    textAlign: 'left',
    paddingLeft: 16,
    paddingTop: 8,
    // ...font,
    // ...style?.sectionHeaderFont,
    // color: style?.sectionHeaderColor || color,
  },

  emojiTabLsitStyle: {
    flexDirection: 'row',
    zIndex: 3,
    flexWrap: 'wrap',
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /**Child props style */
  getListStyle: {
    iconWidth: 24,
    iconHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  listStyle: {
    padding: 3,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    // textFont: font,
    width: '12.5%',
    height: 35,
  },
});
