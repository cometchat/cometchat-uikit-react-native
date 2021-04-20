import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  messageLinkStyle: {
    textDecorationLine: 'underline',
    color: 'blue',
    fontSize: 15,
  },
  container: { marginBottom: 16, marginLeft: 4 },
  innerContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  senderNameStyle: {
    marginBottom: 2,
    color: theme.color.helpText,
    fontSize: 12,
    paddingLeft: 8,
  },
  autolinkStyle: { color: theme.color.primary, fontSize: 15 },
  messageContainer: { maxWidth: '81%', minWidth: '81%' },
  linkObjectDescription: {
    fontStyle: 'italic',
    fontSize: 13,
  },
  linkObjectTitle: {
    fontWeight: '700',
  },
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    alignSelf: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxWidth: '100%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  messagePreviewContainerStyle: {
    borderRadius: 12,
    flex: 1,
  },
  previewImageStyle: {
    height: 150,
    marginVertical: 12,
  },
  previewImageIconStyle: {
    height: 50,
    marginVertical: 12,
  },
  previewDataStyle: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitleStyle: {
    flexWrap: 'wrap',
    textAlign: 'left',
    marginBottom: 8,
  },
  previewDescStyle: {
    textAlign: 'left',
    paddingVertical: 8,
  },
  previewTextStyle: {
    paddingHorizontal: 5,
    textAlign: 'left',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
    marginRight: 8,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
    alignSelf: 'center',
  },
  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
