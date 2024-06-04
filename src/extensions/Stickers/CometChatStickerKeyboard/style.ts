import { StyleSheet } from "react-native";
// import { localize } from "../../shared";

export const Styles = StyleSheet.create({
  stickerWrapperStyle: {
      padding: 0,
      borderTopRightRadius: 12,
      borderTopLeftRadius: 12,
  },
  stickerSectionListStyle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 2,
  },
  sectionListItemStyle: {
      flexShrink: 0,
      padding: 8,
  },
  stickerListStyle: {
      flexWrap: "wrap",
      width: "100%",
      padding: 0,
      margin: 0,
      justifyContent: "flex-start",
      alignItems: "center",
      flexDirection: "row",
  },
  stickerItemStyle: {
      width: "20%",
      height: 60,
      margin: 8,
      padding: 0,
  },
  stickerMsgStyle: {
      overflow: "hidden",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      top: "45%",
  },
  stickerMsgTxtStyle: {
      margin: 0,
      height: 30,
  },
  stickerImageStyle: {
      width: "100%",
      height: "100%",
  },
  stickerCategoryImageStyle: {
      width: 24,
      height: 24,
  }
})