import React from 'react';
import {
  Text,
  View,
  Modal,
  Dimensions,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';

import style from './styles';
import { checkMessageForExtensionsData } from '../../../../utils/common';
import { map, toArray } from 'lodash';
import FastImage from 'react-native-fast-image';
import { Emoji } from 'emoji-mart-native';
import _ from 'lodash';
export default class ReactionDetails extends React.Component {
  sheetRef = React.createRef(null);

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.sheetRef.current.snapTo(0);
    }
  }

  renderSectionItem = ({ item }) => (
    <View style={style.sectionItemContainer}>
      <FastImage
        source={{ uri: item.avatar }}
        style={style.sectionItemAvatar}
      />
      <View style={style.sectionItemName}>
        <Text style={style.sectionItemNameText}>{item.name}</Text>
      </View>
    </View>
  );

  renderSectionHeader = ({ section: { title } }) => {
    const reactionName = _.trim(title, ':');

    return (
      <View style={style.sectionHeaderContainer}>
        <Emoji emoji={{ id: reactionName }} size={20} native />
      </View>
    );
  };

  renderContent = () => {
    let reactionData = checkMessageForExtensionsData(
      this.props.message,
      'reactions',
    );
    reactionData = map(reactionData, (key, value) => {
      return { title: value, data: toArray(key) };
    });
    return (
      <View style={style.reactionDetailsContainer}>
        <View style={style.reactionDetailsHeaderContainer}>
          <Text style={style.reactionDetailsHeaderText}>Reactions</Text>
          <TouchableOpacity
            onPress={() => {
              this.sheetRef.current.snapTo(1);
              this.props.close();
            }}>
            <Text style={style.reactionDetailsHeaderCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        <SectionList
          sections={reactionData}
          stickySectionHeadersEnabled={false}
          keyExtractor={(item, index) => item + index}
          renderItem={this.renderSectionItem}
          renderSectionHeader={this.renderSectionHeader}
        />
      </View>
    );
  };

  render() {
    const { visible, close } = this.props;

    return (
      <Modal transparent animated animationType="fade" visible={visible}>
        <View style={style.reactionDetailBottomSheet}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
            borderRadius={30}
            initialSnap={1}
            enabledInnerScrolling={false}
            enabledContentTapInteraction
            overdragResistanceFactor={10}
            renderContent={this.renderContent}
            onCloseEnd={() => {
              close();
            }}
          />
        </View>
      </Modal>
    );
  }
}
