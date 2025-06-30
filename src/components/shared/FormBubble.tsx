import { View, ScrollView } from 'react-native'
import React from 'react'
import { CometChatFormBubble, FormMessage } from '@cometchat/chat-uikit-react-native'
import { NavigationProp } from '@react-navigation/native';

interface FormBubbleProps {
    navigation: NavigationProp<any>;
}

const FormBubble = (props: FormBubbleProps) => {

    function getFormMessage() {
        const json = {
            id: "2862",
            muid: "1698667506320",
            conversationId: "group_group_1696408979857",
            sender: "nakul",
            receiverType: "group",
            receiver: "group_1696408979857",
            category: "interactive",
            type: "form",
            data: {
                entities: {
                    sender: {
                        entity: {
                            uid: "nakul",
                            name: "Nakul",
                            role: "default",
                            status: "available",
                            lastActiveAt: 1698830332,
                        },
                        entityType: "user",
                    },
                    receiver: {
                        entity: {
                            guid: "group_1696408979857",
                            name: "Test Group",
                            type: "public",
                            owner: "vivek",
                            createdAt: 1696408980,
                            updatedAt: 1698667314,
                            membersCount: 7,
                            conversationId: "group_group_1696408979857",
                            onlineMembersCount: 14,
                        },
                        entityType: "group",
                    },
                },
                metadata: {
                    data: {
                        text: "Thanks For filling the Form!",
                    },
                    type: "text",
                    category: "message",
                    receiver: "{$s}",
                    receiverType: "{$t}",
                },
                resource:
                    "WEB-4_0_1-a9b124b3-e092-43a7-9f78-cf507c93d153-1698830285347",
                interactions: [
                    {
                        elementId: "element8",
                        interactedAt: 1699874632,
                    },
                ],
                interactionGoal: {
                    type: "none",
                    elementIds: [],
                },
                interactiveData: {
                    title: "Society Survey",
                    formFields: [
                        {
                            label: "Name",
                            maxLines: 1,
                            optional: false,
                            elementId: "element1",
                            elementType: "textInput",
                            defaultValue: "vivek",
                        },
                        {
                            label: "Last Name",
                            maxLines: 1,
                            optional: false,
                            elementId: "element2",
                            elementType: "textInput",
                        },
                        {
                            label: "Address",
                            maxLines: 5,
                            optional: false,
                            elementId: "element3",
                            elementType: "textInput",
                        },
                        {
                          to: "2024-02-09T23:59",
                          from: "2024-02-08T12:00",
                          mode: "dateTime",
                          label: "Select Date & Time",
                          optional: false,
                          elementId: "67",
                          elementType: "dateTime",
                          defaultValue: "2024-01-01T12:00",
                          timezoneCode: "Asia/Kolkata",
                          dateTimeFormat: "yyyy-MM-dd HH:mm",
                        },
                        {
                          to: "2024-02-09",
                          from: "2024-01-09",
                          mode: "date",
                          label: "Select Date",
                          optional: false,
                          elementId: "68",
                          elementType: "dateTime",
                          defaultValue: "2024-01-11",
                          timezoneCode: "Asia/Kolkata",
                          dateTimeFormat: "yyyy-MM-dd",
                        },
                        {
                          to: "15:30",
                          from: "14:30",
                          mode: "time",
                          label: "Select Time",
                          optional: false,
                          elementId: "69",
                          elementType: "dateTime",
                          defaultValue: "14:55",
                          timezoneCode: "Asia/Kolkata",
                          dateTimeFormat: "HH:mm",
                        },
                        {
                            label: "Country",
                            options: [
                                {
                                    label: "INDIA",
                                    value: "option1",
                                },
                                {
                                    label: "AUSTRALIA",
                                    value: "option2",
                                },
                            ],
                            optional: false,
                            elementId: "element4",
                            elementType: "dropdown",
                            defaultValue: "option1",
                        },
                        {
                            label: "Services",
                            options: [
                                {
                                    label: "Garbage",
                                    value: "option1",
                                },
                                {
                                    label: "Electricity Bill",
                                    value: "option2",
                                },
                                {
                                    label: "Lift",
                                    value: "option3",
                                },
                            ],
                            optional: false,
                            elementId: "element5",
                            elementType: "checkbox",
                            defaultValue: ["option1", "option2"],
                        },
                        {
                            label: "Wing",
                            options: [
                                {
                                    label: "A",
                                    value: "option1",
                                },
                                {
                                    label: "B",
                                    value: "option2",
                                },
                            ],
                            optional: false,
                            elementId: "element6",
                            elementType: "singleSelect",
                            defaultValue: "option1",
                        },
                        {
                            action: {
                                url: "https://www.cometchat.com/",
                                actionType: "urlNavigation",
                            },
                            elementId: "element9",
                            buttonText: "About us",
                            elementType: "button",
                            disableAfterInteracted: true,
                        },
                    ],
                    submitElement: {
                        action: {
                            url: "",
                            actionType: "urlNavigation",
                        },
                        elementId: "element8",
                        buttonText: "Submit",
                        elementType: "button",
                        disableAfterInteracted: true,
                    },
                },
                allowSenderInteraction: true,
            },
            sentAt: 1698830332,
            updatedAt: 1698830332,
        };
        const formMessage = FormMessage.fromJSON(json);
        return formMessage;
    }

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={{ width: "85%", marginVertical: 30, alignSelf: "flex-end", marginRight: 10 }}>
                <CometChatFormBubble
                    message={getFormMessage()}
                    onSubmitClick={props.navigation.goBack}
                />
            </View>
        </ScrollView>
    )
}

export default FormBubble