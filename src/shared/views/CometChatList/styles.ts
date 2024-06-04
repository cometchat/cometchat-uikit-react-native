//@ts-ignore
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingStart: 16,
    paddingEnd: 16,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  listBaseHeaderStyle: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
  },
  upperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
  },
  searchBox: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginHorizontal: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
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
    fontWeight: '400',
    marginLeft: 8,
    alignSelf:"center"
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
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgTxtStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    textAlign: 'center',
    width: '100%',
  },
  headerLetterStyle: {
    height: 24,
    fontWeight: '500',
    fontFamily: undefined,
    fontSize: 13,
    marginTop: 8,
  },
  dividerStyle: {
    height: 1,
    width: '100%',
    marginLeft: 16,
    marginRight: 16,
  },
  listContainerStyle: {
    width: '100%',
    height: '100%',
  },
});

export default styles;
