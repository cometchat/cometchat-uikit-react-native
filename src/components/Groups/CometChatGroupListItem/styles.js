import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxHeight: 62,
    paddingHorizontal: 20,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 44,
    height: 44,
    marginRight: 15 * widthRatio,
    justifyContent: 'center',
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
  groupDetailsContainer: {
    borderBottomWidth: 0.5,
    flex: 1,
    paddingBottom: 10,
    paddingTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberCountStyle: { fontSize: 14, fontWeight: '200', maxWidth: '80%' },
  groupNameStyle: { fontSize: 18, fontWeight: '600', maxWidth: '80%' },
});
