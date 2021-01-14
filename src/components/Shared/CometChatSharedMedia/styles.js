import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default StyleSheet.create({
  sectionStyle: {
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeaderStyle: {
    margin: 0,
    width: '100%',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  sectionContentStyle: {
    width: '100%',
    marginVertical: 6,
    flexDirection: 'column',
  },
  mediaBtnStyle: {
    borderRadius: 8,
    backgroundColor: 'rgba(20, 20, 20, 0.08)',
    width: '100%',
    padding: 2,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextStyle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  activeButtonStyle: {
    width: '33.33%',
    alignSelf: 'flex-start',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 7,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    // elevation: 5,
  },
  buttonStyle: {
    width: '33.33%',
    alignSelf: 'flex-start',
    padding: 5,
    textAlign: 'center',
  },
  mediaItemStyle: {
    justifyContent: 'center',
    // minHeight: screenHeight / 3,
  },
  mediaItemColumnStyle: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemStyle: {
    // margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
  },
  imageStyle: {
    width: (screenWidth - 40) / 2,
    height: 128,
  },
  videoStyle: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    // width: 400,
    // height: 400,
    width: (screenWidth - 40) / 2,
    height: 128,
  },
  fileItemStyle: {
    width: (screenWidth - 80) / 2,
    height: 100,
    borderRadius: 18,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileStyle: {
    maxWidth: '100%',
    maxHeight: '100%',
    marginTop: 15,
    fontSize: 13,
    textAlign: 'left',
  },
  seperator: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  emptyComponentContainerStyle: { alignSelf: 'center' },
  emptyComponentStyle: {
    fontSize: 28,
    color: 'rgba(0,0,0,0.4)',
    fontWeight: '700',
  },
});
