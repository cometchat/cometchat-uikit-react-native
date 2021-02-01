import React from 'react';
import { Modal, TouchableWithoutFeedback, View } from 'react-native';
import style from './styles';
import Actions from './actions';
import BottomSheet from 'reanimated-bottom-sheet';

export default class MessageActionsView extends React.Component {
  sheetRef = React.createRef(null);

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.sheetRef.current.snapTo(0);
    }
  }

  renderContent = () => <Actions {...this.props} message={this.props.message} />;

  renderHeader = () => <View style={style.header} />;

  render() {
    const { open, close } = this.props;
    return (
      <Modal transparent animated animationType="fade" visible={open}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.sheetRef.current.snapTo(1);
              this.props.close();
            }}>
            <View style={{ flex: 1 }}>
              <BottomSheet
                ref={this.sheetRef}
                snapPoints={[250, 0]}
                borderRadius={30}
                initialSnap={1}
                enabledInnerScrolling={false}
                renderHeader={this.renderHeader}
                enabledContentTapInteraction
                overdragResistanceFactor={10}
                renderContent={this.renderContent}
                onCloseEnd={() => {
                  close();
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  }
}
