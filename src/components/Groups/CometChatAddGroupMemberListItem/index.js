import React, { useState } from 'react';
import theme from '../../../resources/theme';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import style from './styles';
import checkboxActive from './resources/checkbox-blue-active.png';
import checkboxInctive from './resources/checkbox-inactive.png';

export default (props) => {
  const ViewTheme = { ...theme, ...props.theme };

  const [checked, setChecked] = useState(() => {
    const found = props.members.find((member) => member.uid === props.user.uid);
    const value = !!found;

    return value;
  });

  const handleCheck = () => {
    const value = checked !== true;
    setChecked(value);
    props.changed(props.user, value);
  };

  return (
    <View style={[style.rowStyle, { borderColor: ViewTheme.borderColor.primary }]}>
      <View style={[style.nameStyle]}>
        <View style={style.avatarStyle}>
          <CometChatAvatar
            image={{ uri: props.user.avatar }}
            cornerRadius={22}
            borderColor={ViewTheme.color.secondary}
            borderWidth={0}
            name={props.user.name}
          />
          <CometChatUserPresence
            widgetsettings={props.widgetsettings}
            status={props.user.status}
            cornerRadius={18}
            borderColor={ViewTheme.color.darkSecondary}
            borderWidth={1}
          />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 14 }}>
          {props.user.name}
        </Text>
      </View>
      <TouchableOpacity onPress={handleCheck}>
        <Image
          source={checked ? checkboxActive : checkboxInctive}
          alt="checkBox"
          style={style.imageStyle}
        />
      </TouchableOpacity>
    </View>
  );
};
