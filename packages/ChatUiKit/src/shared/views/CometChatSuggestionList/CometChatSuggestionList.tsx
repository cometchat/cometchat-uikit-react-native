import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, View, Text } from "react-native";
import { CometChatListItem } from "../CometChatListItem";
import { SuggestionItem } from "./SuggestionItem";
import { SuggestionListStyle } from "../../../theme/type";
import { Skeleton } from "./Skeleton";
import { useTheme } from "../../../theme";
import { useCometChatTranslation } from "../..";

/**
 * Props for the CometChatSuggestionList component.
 */
export interface CometChatSuggestionListInterface {
  /**
   * Color for the separator between suggestion items.
   */
  separatorColor?: string;
  /**
   * Array of suggestion items to be displayed.
   */
  data: Array<SuggestionItem>;
  /**
   * Custom styles for the suggestion list.
   */
  listStyle: SuggestionListStyle;
  /**
   * Callback function invoked when a suggestion item is pressed.
   *
   * @param item - The suggestion item that was pressed.
   */
  onPress: (item: SuggestionItem) => void;
  /**
   * Optional callback function invoked when the end of the list is reached.
   */
  onEndReached?: () => void;
  /**
   * Indicates whether the suggestion list is currently loading.
   */
  loading?: boolean;
}

export const CometChatSuggestionList = (props: CometChatSuggestionListInterface) => {
  const { data, listStyle, onPress, onEndReached, loading } = props;
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setInitialLoad(false);
    }, 800);
  }, []);

  const _render = useCallback(({ item, index }: ListRenderItemInfo<SuggestionItem>) => {
    let shouldLoadAvatarName = item.hideLeadingIcon ? {} : { avatarName: item.name };
    const isAllAlias = item.underlyingText?.startsWith?.('<@all:');
    const TitleView = isAllAlias ? (
      <Text
        numberOfLines={1}
        ellipsizeMode='tail'
        style={[listStyle?.listItemStyle.titleStyle, { flexShrink: 1 }]}
      >
        <Text style={[listStyle?.listItemStyle.titleStyle, { fontWeight: '700' }]}>@{item.name} </Text>
        <Text style={[theme.typography.caption1.regular, { opacity: 0.7 }]}>{t('MESSAGE_COMPOSER_MENTION_NOTIFY_EVERYONE_LABEL')}</Text>
      </Text>
    ) : undefined;
    return (
      <CometChatListItem
        key={index}
        // Derived from the suggestion's own id so a test can pick ONE row out of a list that
        // is virtualized and reorders as you type. A plain shared id would force atIndex(),
        // which picks an unpredictable row.
        testID={`SuggestionList.item-${item.id}`}
        id={item.id}
        title={isAllAlias ? undefined : item.name}
        TitleView={TitleView}
        avatarURL={item.leadingIconUrl ? { uri: item.leadingIconUrl } : undefined}
        containerStyle={listStyle?.listItemStyle.containerStyle}
        titleStyle={listStyle?.listItemStyle.titleStyle}
        avatarStyle={listStyle?.listItemStyle.avatarStyle}
        titleSubtitleContainerStyle={{
          alignSelf: "center",
        }}
        onPress={() => onPress(item)}
        {...shouldLoadAvatarName}
      />
    );
  }, [listStyle, theme, t, onPress]);

  return (
    <View>
      {initialLoad ? (
        <View>
          <Skeleton />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={_render}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          onMomentumScrollEnd={(event) => {
            const contentOffsetY = event.nativeEvent.contentOffset.y; // The current scroll position
            const contentHeight = event.nativeEvent.contentSize.height; // Total height of the content
            const layoutHeight = event.nativeEvent.layoutMeasurement.height; // Height of the visible area

            if (contentOffsetY + layoutHeight >= contentHeight - 10) {
              onEndReached && onEndReached();
            }
          }}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps={"always"}
        />
      )}
      {!initialLoad && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
          }}
        >
          {loading && <ActivityIndicator animating={loading} />}
        </View>
      )}
    </View>
  );
};
