import { View, ScrollView } from 'react-native'
import React from 'react'
import { CometChatCardBubble, CardMessage } from '@cometchat/chat-uikit-react-native'
import { NavigationProp } from '@react-navigation/native';

interface CardBubbleProps {
    navigation: NavigationProp<any>;
}

const CardBubble = (props: CardBubbleProps) => {

    function getCardMessage() {
        const json = {
            id: "1978",
            muid: "1697641596",
            conversationId: "nakul_user_rohit",
            sender: "nakul",
            receiverType: "user",
            receiver: "rohit",
            category: "interactive",
            type: "card",
            data: {
                entities: {
                    sender: {
                        entity: {
                            uid: "nakul",
                            name: "Nakul",
                            role: "default",
                            status: "available",
                            lastActiveAt: 1697636600,
                        },
                        entityType: "user",
                    },
                    receiver: {
                        entity: {
                            uid: "rohit",
                            name: "Rohit",
                            role: "default",
                            status: "available",
                            lastActiveAt: 1696508846,
                            conversationId: "nakul_user_rohit",
                        },
                        entityType: "user",
                    },
                },
                resource:
                    "REACT_NATIVE-4_0_0-2d83fe8e-a47e-444c-bbbf-c5d68afc030a-1697640527366",
                interactionGoal: {
                    type: "none",
                    elementIds: [],
                },
                interactiveData: {
                    text: "Introducing our latest product, the Super Widget 5000! With its advanced features and sleek design, this widget is sure to revolutionize the industry. Don't miss out on the opportunity to experience the future of widgets. Order yours today!",
                    imageUrl:
                        "https://upload.wikimedia.org/wikipedia/en/e/e1/Thomas_D._Baird_%28low-resolution%29.jpg",
                    cardActions: [
                        {
                            action: {
                                url: "https://www.cometchat.com/",
                                actionType: "urlNavigation",
                            },
                            elementId: "submitButton1",
                            buttonText: "Order Now",
                            elementType: "button",
                            disableAfterInteracted: true,
                        },
                        {
                            action: {
                                url: "https://www.cometchat.com/",
                                actionType: "urlNavigation",
                            },
                            elementId: "submitButton2",
                            buttonText: "Register Now",
                            elementType: "button",
                            disableAfterInteracted: true,
                        },
                        {
                            action: {
                                url: "https://www.cometchat.com/",
                                actionType: "urlNavigation",
                            },
                            elementId: "submitButton3",
                            buttonText: "Login Now",
                            elementType: "button",
                            disableAfterInteracted: true,
                        },
                    ],
                    interactableElementIds: [
                        "submitButton1",
                        "submitButton2",
                        "submitButton3",
                    ],
                },
                allowSenderInteraction: true,
            },
            sentAt: 1697641596,
            deliveredAt: 1697641596,
            readAt: 1697708285,
            updatedAt: 1697708285,
        };
        const cardMessage = CardMessage.fromJSON(json);
        return cardMessage;
    }

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={{ width: "85%", marginVertical: 30, alignSelf: "flex-start", marginLeft: 10 }}>
                <CometChatCardBubble
                    message={getCardMessage()}
                    onSubmitClick={props.navigation.goBack}
                />
            </View>
        </ScrollView>
    )
}

export default CardBubble