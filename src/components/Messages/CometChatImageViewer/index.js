import React from 'react';
import { View, Modal, Image, TouchableOpacity, Dimensions } from 'react-native';
import style from './styles';
import { get as _get } from 'lodash';
import BottomSheet from 'reanimated-bottom-sheet';

import { heightRatio, widthRatio } from '../../../utils/consts';

const cross = require('./resources/clear.png');

class imageView extends React.Component {
  constructor(props) {
    super(props);
    this.sheetRef = React.createRef(null);
  }

  render() { 
    // let thumbnailGenerationObject = null;
    // if (Object.prototype.hasOwnProperty.call(this.props, 'message')) {
    //   const { message } = this.props;
    //   if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
    //     const { metadata } = message;
    //     const injectedObject = metadata['@injected'];
    //     if (injectedObject && Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')) {
    //       const extensionsObject = injectedObject.extensions;
    //       if (
    //         extensionsObject &&
    //         Object.prototype.hasOwnProperty.call(extensionsObject, 'thumbnail-generation')
    //       ) {
    //         thumbnailGenerationObject = extensionsObject['thumbnail-generation'];
    //       }
    //     }
    //   }
    // }
    return (
      <Modal transparent animated animationType="fade" visible={this.props.open}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
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
                <View
                  style={{
                    backgroundColor: 'white',
                    height: Dimensions.get('window').height + 200 * heightRatio,
                    paddingBottom: 40 * heightRatio,
                  }}>
                  <TouchableOpacity
                    style={{
                      alignSelf: 'flex-end',
                      marginRight: 20,
                      marginTop: 20,
                    }}
                    onPress={this.props.close}>
                    <Image
                      source={cross}
                      style={{
                        height: 30 * heightRatio,
                        width: 30 * widthRatio,
                      }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <View
                    style={{
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 450 * heightRatio,
                    }}>
                    <View
                      style={[
                        style.mainContainer,
                        {
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%',
                          height: '100%',
                        },
                      ]}>
                      <Image
                        source={{
                          uri: _get(this.props, 'message.data.url', ''),
                        }}
                        resizeMode="contain"
                        style={{
                          height: '100%',
                          width: Dimensions.get('window').width,
                          maxHeight: Dimensions.get('window').height * 0.4,
                        }}
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
export default imageView;
