import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  container: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 20 * widthRatio,
    justifyContent: 'space-between',
  },
  header: {
    padding: 20 * heightRatio,
  },
  headerLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  thumbnailWrapper: {
    width: 200,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 15 * widthRatio,
  },
  thumbnail: {
    width: 200,
    flexWrap: 'wrap',
    flexDirection: 'row',
    // width: 44,
    height: 200,
    borderRadius: 200,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 15 * widthRatio,
    overflow: 'hidden',
  },
  iconWrapper: {
    padding: 40 * widthRatio,
  },
  cancelBtn: {
    width: 64,
    height: 64,
    margin: 12,
    padding: 16,
    borderRadius: 32,
    backgroundColor: '#FF3C2F',
  },
});
