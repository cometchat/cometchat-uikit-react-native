import React, { JSX, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ImageSourcePropType,
  ImageStyle,
  Pressable,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { ActionSheetStyle } from "../../../theme/type";
import { Icon } from "../../icons/Icon";
import { ActionItemInterface } from "./ActionItem";
import { Hooks } from "./hooks";
import { deepMerge } from "../../helper/helperFunctions";
import { DeepPartial } from "../../helper/types";

const OptionListView = ({
  id,
  title,
  icon,
  onPress,
  style,
}: {
  id: string;
  title: string;
  icon: JSX.Element | ImageSourcePropType;
  onPress: () => void;
  style: Partial<{
    containerStyle: ViewStyle;
    iconStyle: ImageStyle;
    iconContainerStyle: ViewStyle;
    titleStyle: TextStyle;
  }>;
}) => {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const renderIcon = useCallback(() => {
    return (
      <Icon icon={icon} imageStyle={style?.iconStyle} containerStyle={style?.iconContainerStyle} />
    );
  }, [icon]);

  return (
    <Pressable
      key={id}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        style?.containerStyle,
        isPressed && { backgroundColor: theme.color.background4 },
      ]}
    >
      {renderIcon()}
      <Text style={style?.titleStyle}>{title}</Text>
    </Pressable>
  );
};

export interface CometChatActionSheetInterface {
  actions: ActionItemInterface[];
  style?: DeepPartial<ActionSheetStyle>;
}
export const CometChatActionSheet = (props: CometChatActionSheetInterface) => {
  const [actionList, setActionList] = React.useState<ActionItemInterface[]>(props.actions);
  const theme = useTheme();

  const actionSheetStyles = useMemo(() => {
    return deepMerge(theme.actionSheetStyle, props.style ?? {});
  }, [theme.actionSheetStyle, props.style]);

  Hooks(props, setActionList);

  const _render = ({ item }: { item: any }) => {
    return (
      <OptionListView
        id={item.id}
        {...item}
        icon={item.icon}
        style={deepMerge(actionSheetStyles.optionsItemStyle, item?.style ?? {})}
      />
    );
  };

  const getList = () => {
    return (
      <FlatList
        key={"list"}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        data={actionList}
        numColumns={1}
        renderItem={_render}
      />
    );
  };

  return getList();
};
