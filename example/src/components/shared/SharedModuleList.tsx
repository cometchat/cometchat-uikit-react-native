import React, { useContext } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { AppTopBar } from '../common/AppTopBar'
import { AppStyle } from '../../AppStyle'
import { CardView } from '../common/CardView'
import { AudioBubble, AvatarIc, BadgeCount, FileBubble, ImageBubble, List, Message, MessageReceipt, RightArrow, SoundManger, StatusIndicator, Theme, Translate, VideoBubble } from '../../resources'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

const SharedModuleFeaturesList = {
    "Resources": [
        {
            id: "SoundManager",
            image: SoundManger,
            name: "Sound Manager",
            info: "CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in UI Kit. for example, events like incoming and outgoing messages"
        },
        {
            id: "Theme",
            image: Theme,
            name: "Theme",
            info: "CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the language accordingly"
        },
        {
            id: "Localize",
            image: Translate,
            name: "Localize",
            info: "CometChatTheme is a style applied to every component and every view in the activity or component in the UI Kit"
        },
    ],
    "Views": [
        {
            id: "Avatar",
            image: AvatarIc,
            name: "Avatar",
            info: "CometChatAvatar component displays an image or user/group avatar with fallback to the first two letters of the user name/group name."
        },
        {
            id: "BadgeCount",
            image: BadgeCount,
            name: "Badge Count",
            info: "CometChatBadge is a custom component which is used to display the unread message count. It can be used in places like ConversationListItem, etc."
        },
        {
            id: "MessageReceipt",
            image: MessageReceipt,
            name: "Message Receipt",
            info: "CometChatReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message."
        },
        {
            id: "StatusIndicator",
            image: StatusIndicator,
            name: "Status Indicator",
            info: "StatusIndicator component indicates whether a user is online or offline."
        },
        {
            id: "TextBubble",
            name: "Text Bubble",
            info: "CometChatTextBubble displays text message. To learn more about this component tap here.",
            image: Message
        },
        {
            id: "ImageBubble",
            name: "Image Bubble",
            info: "CometChatImageBubble displays a media message containing a image. To learn more about this component tap here.",
            image: ImageBubble
        },
        {
            id: "VideoBubble",
            name: "Video Bubble",
            info: "CometChatVideoBubble displays a media message containing a video. To learn more about this component tap here.",
            image: VideoBubble
        },
        {
            id: "AudioBubble",
            name: "Audio Bubble",
            info: "CometChatAudioBubble displays a media messge containing a audio. To learn more about this component tap here.",
            image: AudioBubble
        },
        {
            id: "FileBubble",
            name: "File Bubble",
            info: "CometChatFileBubble displays a media message containing a file. To learn more about this component tap here.",
            image: FileBubble
        },
        {
            id: "ListItem",
            name: "List Item",
            info: "CometChatListItem displays data on a tile and that tile may contain leading, trailing, title and subtitile. To learn more about this component tap here.",
            image: List
        }
    ],
}

export const SharedModuleList = (props) => {

    const {theme} = useContext(CometChatContext);
    
    return (
        <View style={[AppStyle.container, { marginBottom: 16, backgroundColor: theme.palette.getBackgroundColor() }]}>
            <AppTopBar title={"Shared"} navigation={props.navigation} />
            <ScrollView style={{backgroundColor: theme.palette.getAccent200()}}>
                {
                    Object.keys(SharedModuleFeaturesList).map(feature => {
                        return <View key={feature}>
                            <Text style={{ marginStart: 16, fontSize: 18, color: theme.palette.getAccent800() }}>{feature}</Text>
                            <CardView style={{backgroundColor: theme.palette.getBackgroundColor()}}>
                                {
                                    SharedModuleFeaturesList[feature].map(item => {
                                        const { image, id, name, info } = item;
                                        return <TouchableOpacity key={id} onPress={() => props.navigation.navigate(id)}>
                                            <View style={AppStyle.row}>
                                                {
                                                    image &&
                                                    <Image source={image} style={{ height: 32, width: 32, margin: 8, tintColor: theme.palette.getAccent800()}} resizeMode="contain" />
                                                }
                                                <View style={AppStyle.container}>
                                                    <Text style={[AppStyle.heading, { color: theme.palette.getAccent() }]} >{name}</Text>
                                                    <Text style={Style.info}>{info}</Text>
                                                    <View style={[AppStyle.devider, {backgroundColor: theme.palette.getAccent()}]} />
                                                </View>
                                                <Image source={RightArrow} style={Style.image} />
                                            </View>
                                        </TouchableOpacity>
                                    })
                                }
                            </CardView>
                        </View>
                    })
                }
            </ScrollView>
        </View>
    )
}

const Style = StyleSheet.create({
    image: {
        height: 24,
        width: 24,
        tintColor: "black",
        alignSelf: "center"
    },
    info: {
        fontSize: 16,
        color: "grey"
    }
})