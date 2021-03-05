import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  ModalBodyItemContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    height: 50 * heightRatio,
    borderColor: 'pink',
  },
  ModalBodyItem: {
    alignSelf: 'center',
    width: '30%',
    alignItems: 'center',
  },
  SpecificItemText: {
    fontWeight: '500',
    fontSize: 16,
  },
  WrapperForInputAndDelete: {
    height: 36 * heightRatio,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%',
    alignSelf: 'center',
  },
  Inputbox: {
    width: '85%',
    borderColor: 'green',
    fontSize: 16,
    alignSelf: 'center',
  },
  ContainerForDelete: {
    width: '15%',
    borderRadius: 16,
    marginRight: 15 * widthRatio,
    alignItems: 'center',
  },
  RemoveImage: {
    height: 28,
    width: 28,
  },
});
