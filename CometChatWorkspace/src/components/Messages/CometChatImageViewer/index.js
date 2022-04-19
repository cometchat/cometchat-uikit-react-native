import React from 'react';
import { View, Modal, Image, TouchableOpacity, Dimensions } from 'react-native';
import style from './styles';
import { get as _get } from 'lodash';
import BottomSheet from 'reanimated-bottom-sheet';
const cross = require('./resources/clear.png');

class CometChatImageViewer extends React.Component {
  constructor(props) {
    super(props);
    this.sheetRef = React.createRef(null);
  }

  render() {
    return (
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.props.open}>
        <View style={style.outerContainer}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
            borderRadius={30}
            initialSnap={0}
            enabledInnerScrolling={false}
            enabledContentTapInteraction={false}
            overdragResistanceFactor={10}
            renderContent={() => {
              return (
                <View style={style.bottomSheetContainer}>
                  <TouchableOpacity
                    style={style.crossImgContainer}
                    onPress={this.props.close}>
                    <Image
                      source={cross}
                      style={style.crossImg}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <View style={style.outerImageContainer}>
                    <View style={[style.mainContainer]}>
                      <Image
                        source={{
                          uri: _get(this.props, 'message.data.url', ''),
                        }}
                        resizeMode="contain"
                        style={style.imageStyles}
                      />
                    </View>
                  </View>
                </View>
              );
            }}
            onCloseEnd={() => {
              this.props.close();
            }}
          />
        </View>
      </Modal>
    );
  }
}
export default CometChatImageViewer;
