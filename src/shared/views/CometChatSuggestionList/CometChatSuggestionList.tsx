import { View, Text, FlatList, ListRenderItemInfo, ActivityIndicator } from 'react-native'
import React from 'react'
import { SuggestionItem } from './SuggestionItem';
import { CometChatListItem, ListItemStyle } from '../CometChatListItem';
import { AvatarStyleInterface } from '../CometChatAvatar';

export interface CometChatSuggestionListInterface {
    separatorColor?: string
    /**
     * Array of selection items
     */
    data: Array<SuggestionItem>;
    listItemStyle?: ListItemStyle;
    avatarStyle?: AvatarStyleInterface;
    onPress: (item: SuggestionItem) => void;
    onEndReached?: () => void;
    loading?: boolean;
}

export const CometChatSuggestionList = (props: CometChatSuggestionListInterface) => {
    const { data, avatarStyle, listItemStyle, separatorColor, onPress, onEndReached, loading } = props;

    const _render = ({ item, index }: ListRenderItemInfo<SuggestionItem>) => {
        let shouldLoadAvatarName = item.hideLeadingIcon ? {} : { avatarName: item.name }
        return (
            <CometChatListItem
                key={index}
                id={item.id}
                title={item.name}
                avatarStyle={{ ...avatarStyle }}
                avatarURL={item.leadingIconUrl ? { uri: item.leadingIconUrl } : undefined}
                listItemStyle={{ ...listItemStyle }}
                onPress={() => onPress(item)}
                {...shouldLoadAvatarName}
            />
        );
    }

    return (
        <View>
            <FlatList
                data={data}
                renderItem={_render}
                onEndReached={({ distanceFromEnd }) => {
                    if (distanceFromEnd < 0) return;
                    onEndReached();
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, marginLeft: 5, backgroundColor: separatorColor }}></View>}
                onEndReachedThreshold={0.3}
                keyboardShouldPersistTaps={"always"}
                style={{
                    paddingLeft: 5
                }}
            />
            <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
            }}>
                {loading && <ActivityIndicator animating={loading} />}
            </View>
        </View>
    )
}