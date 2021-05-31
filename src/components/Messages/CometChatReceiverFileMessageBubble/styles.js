import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    alignSelf: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    paddingRight: 30,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messagePreviewContainerStyle: {
    borderRadius: 12,
  },
  previewImageStyle: {
    height: 150,
    marginVertical: 12,
  },
  previewDataStyle: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 12,
  },
  previewTitleStyle: {
    flexWrap: 'wrap',
    textAlign: 'left',
    marginBottom: 8,
  },
  previewDescStyle: {
    flexWrap: 'wrap',
    textAlign: 'left',
    paddingVertical: 8,
  },
  previewTextStyle: {
    flexWrap: 'wrap',
    textAlign: 'left',
    paddingVertical: 8,
  },
  previewLinkStyle: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
    marginTop: 30,
  },
  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContainerStyle: { marginBottom: 16, marginLeft: 4 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  messageContainerStyle: { minWidth: '65%' },
  attachmentNameStyle: { flex: 1, marginRight: 4, color: theme.color.primary },
  senderNameContainer: { marginBottom: 5 },
});
