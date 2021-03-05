import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  messageContainerStyle: { marginBottom: 16 },
  messageSenderNameContainerStyle: { marginBottom: 5 },
  messageContainerForReceiver: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  messageWrapperStyleReceiver: {
    backgroundColor: '#f2f3f4', // #f2f3f4
    marginBottom: 8,
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 5,
    maxWidth: '100%',
    borderRadius: 12,
  },
  messageWrapperStyleSender: {
    alignSelf: 'flex-end',
    backgroundColor: '#f2f3f4',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 5,
    maxWidth: '85%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  containerStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageTxtStyle: {
    fontSize: 14,
    margin: 0,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  messageTxtWrapperStyle: {
    borderRadius: 12,
  },
});
