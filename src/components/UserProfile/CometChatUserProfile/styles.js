import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio } from '../../../utils/consts';

export default StyleSheet.create({
  userInfoScreenStyle: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    color: '#151515', // #349afe blue #cccccc lightgray
  },
  headingContainer: {
    height: 62 * heightRatio,
    borderBottomColor: '#eaeaea',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleStyle: {
    marginLeft: 16 * widthRatio,
    fontWeight: '700',
    fontSize: 22 * heightRatio,
  },
  userContainer: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    height: 64 * heightRatio,
  },
  avatarContainer: {
    alignSelf: 'center',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16 * widthRatio,
  },
  userDetailsContainer: {
    marginLeft: 16 * widthRatio,
  },
  userName: {
    fontSize: 16 * heightRatio,
    fontWeight: '700',
  },
  status: {
    fontWeight: '500',
    fontSize: 14 * heightRatio,
    color: '#349afe',
  },
  avatarStyle: {
    width: 36 * widthRatio,
    height: 36 * heightRatio,
    borderColor: 'green',
    marginTop: 10,
  },
  infoItemsWrapper: {
    borderColor: 'green',
    width: '100%',
  },
  infoItemHeadingContainer: {
    marginLeft: 16 * widthRatio,

    marginTop: 8 * heightRatio,
  },
  infoItemHeadingText: {
    color: '#cccccc',
    fontWeight: '500',
    fontSize: 16 * heightRatio,
  },
  infoItemsContainer: {
    borderColor: 'orange',
    marginLeft: 32 * widthRatio,
    marginTop: 16 * heightRatio,
  },
  infoItem: {
    height: 40 * heightRatio,

    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemText: {
    fontSize: 14 * heightRatio,
    fontWeight: '700',

    marginLeft: 8,
  },
});
