import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  callContainerStyle: {
    marginTop: 20,
    marginHorizontal: 40 * widthRatio,
    borderRadius: 15,
    padding: 20 * widthRatio,
    backgroundColor: '#444444',
  },
  senderDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callMessageContainerStyle: { marginLeft: 5 },
  callMessageTextStyle: { color: '#8A8A8A' },
  nameStyle: {
    marginBottom: 4 * heightRatio,
    color: 'white',
    fontSize: 15,
    width: 150 * widthRatio,
    fontWeight: '900',
  },
  btnTextStyle: { color: 'white', textAlign: 'center' },
  avatarStyle: {
    flexWrap: 'wrap',
    width: 34,
    height: 34,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
  },
  callTypeStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonStyle: {
    marginTop: 10 * heightRatio,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonStyle: {
    paddingVertical: 6 * heightRatio,
    borderRadius: 5,
    width: '45%',
  },
});
