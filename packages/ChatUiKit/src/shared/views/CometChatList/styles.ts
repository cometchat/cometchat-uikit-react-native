import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    alignSelf: "center",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  listBaseHeaderStyle: {
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    borderRadius: 0,
    paddingHorizontal: 16,
    padding: 2,
  },
  upperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  closeButton: {
    marginRight: 10,
  },
  headerRightContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 1,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44, // minHeight for accessibility
    paddingVertical:8,
  },
  selectedCountText: {
    paddingLeft: 10,
  },
  searchBox: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  backButtonStyle: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchTextStyle: {
    flex: 1,
    padding: 5,
    fontSize: 17,
    fontWeight: "400",
    marginLeft: 8,
    alignSelf: "center",
  },
  searchButtonStyle: {
    width: 16,
    height: 16,
    marginLeft: 11,
    marginTop: 10,
    marginBottom: 10,
  },
  msgContainerStyle: {
    flex: 1,
    overflow: "hidden",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  msgTxtStyle: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    textAlign: "center",
    width: "100%",
  },
  headerLetterStyle: {
    minHeight: 24, //  minHeight for accessibility
    fontWeight: "500",
    fontFamily: undefined,
    fontSize: 13,
    marginTop: 8,
    paddingVertical: 4,
  },
  dividerStyle: {
    height: 1,
    width: "100%",
    marginLeft: 16,
    marginRight: 16,
  },
  listContainerStyle: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
  footerContainer: {
    paddingVertical: 20,
    flex:1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
