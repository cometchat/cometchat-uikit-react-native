import React, { useContext, useEffect, useRef, useCallback } from "react";
import { View, Text, NativeModules } from "react-native";
import { CometChatContextType } from "../../base/Types";
import { CometChatContext } from "../../CometChatContext";

// Style Components import
import { FormBubbleStyle, FormBubbleStyleInterface } from "./FormBubbleStyle";

import { APIAction, ButtonElement, CheckboxElement, DropdownElement, ElementEntity, FormMessage, LabelElement, OptionElement, RadioButtonElement, SingleSelectElement, TextInputElement, URLNavigationAction } from '../../modals/InteractiveData';
import { ButtonAction, ElementType, HTTPSRequestMethods, goalType } from "../../constants/UIKitConstants";
import CometChatDropdown from "../CometChatDropDown/CometChatDropDown";
import { CometChatNetworkUtils } from "../../utils/NetworkUtils";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import CometChatTextInput from "../CometChatTextInput/CometChatTextInput";
import CometChatCheckBox from "../CometChatCheckBox/CometChatCheckBox";
import CometChatRadioButton from "../CometChatRadioButton/CometChatRadioButton";
import CometChatSingleSelect from "../CometChatSingleSelect/CometChatSingleSelect";
import CometChatQuickView from "../CometChatQuickView/CometChatQuickView";
import { localize } from "../../resources";
import { memo } from "react";
import { ButtonStyle, CometChatButton } from "../CometChatButton";
import CometChatLabel from "../CometChatLabel/CometChatLabel";

const WebView = NativeModules['WebViewManager'];
export interface CometChatFormBubbleInterface {
    message: FormMessage,  // Expect JSON object
    style?: FormBubbleStyleInterface,
    onSubmitClick?: (data: any) => void
}

let allRequiredFields = [];

export const CometChatFormBubble = memo((props: CometChatFormBubbleInterface) => {

    const {
        message,
        onSubmitClick,
        style
    } = props;

    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const [currentRequiredFields, setCurrentRequiredFields] = React.useState<string[]>([]);
    const [bodyData, setBodyData] = React.useState({});
    const [hasInteractionCompleted, setHasInteractionCompleted] = React.useState(false);
    const [interactedElements, setInteractedElements] = React.useState<CometChat.Interaction[]>([]);
    const [interactionGoal, setInteractionGoal] = React.useState<CometChat.InteractionGoal>(undefined);
    const [loaderButton, setLoaderButton] = React.useState<string>("");
    const [loggedInUser, setLoggedInUser] = React.useState<CometChat.User>(null);

    const _style = new FormBubbleStyle({
        wrapperPadding: 3,
        titleFont: theme.typography.heading,
        titleColor: theme.palette.getAccent(),
        goalCompletionTextColor: theme.palette.getAccent600(),
        backgroundColor: theme.palette.getBackgroundColor(),
        wrapperBackground: theme.palette.getSecondary(),
        wrapperBorderRadius: 10,
        buttonStyle: new ButtonStyle({
            backgroundColor: theme.palette.getPrimary(),
            border: { borderWidth: 1, borderColor: theme.palette.getAccent200() },
            textColor: theme.palette.getBackgroundColor(),
            textFont: theme.typography.text1,
            height: 35,
            borderRadius: 5,
        }),
        // Add relevant style properties
        ...style
    });

    const {
        backgroundColor,
        border,
        borderRadius,
        goalCompletionTextColor,
        goalCompletionTextFont,
        titleColor,
        titleFont,
        wrapperBackground,
        wrapperBorderRadius,
        wrapperPadding,
        buttonStyle,
        checkboxStyle,
        dropdownStyle,
        labelStyle,
        quickViewStyle,
        radioButtonStyle,
        singleSelectStyle,
        textInputStyle,
        // Extract style properties
    } = _style;

    useEffect(() => {
        CometChat.getLoggedinUser()
            .then(u => {
                setLoggedInUser(u);
            })
            .catch(e => {
                console.log("Error while getting loggedInUser");
                setLoggedInUser(null);
            });
        setInteractedElements(message.getInteractions() || []);
        setInteractionGoal(message.getInteractionGoal() || undefined);
        let formFields = {};
        message.getFormFields().forEach((field) => {
            formFields[field.getElementId()] = (field?.getDefaultValue && field?.getDefaultValue()) || "";
        });

        setBodyData(formFields);

    }, []);

    useEffect(() => {
        let hasInteractionCompleted: boolean = checkHasInteractionCompleted();
        setHasInteractionCompleted(hasInteractionCompleted);
    }, [interactedElements, interactionGoal])


    const _renderTextInput = (data: TextInputElement) => {
        !data.getOptional() && allRequiredFields.push(data.getElementId());

        function onChange(text: string) {
            setBodyData({ ...bodyData, [data.getElementId()]: text });
            if (text.length > 0) {
                removeFromRequiredList(data.getElementId());
            }
        }

        return (
            <CometChatTextInput
                data={data}
                showError={currentRequiredFields.includes(data.getElementId())}
                onChange={onChange}
                style={textInputStyle}
                defaultValue={bodyData[data.getElementId()]}
            />
        )
    }

    const _renderCheckBox = (data: CheckboxElement) => {
        !data.getOptional() && allRequiredFields.push(data.getElementId());

        function onChange(option: OptionElement) {
            let _cloneBodydata = { ...bodyData };
            _cloneBodydata[data.getElementId()] = _cloneBodydata[data.getElementId()] || [];
            let indexOfOption = _cloneBodydata[data.getElementId()].indexOf(option.getValue());
            if (indexOfOption > -1) {
                _cloneBodydata[data.getElementId()].splice(indexOfOption, 1);
            } else {
                _cloneBodydata[data.getElementId()].push(option.getValue());
            }
            setBodyData({ ..._cloneBodydata });

            if (_cloneBodydata[data.getElementId()].length > 0) {
                removeFromRequiredList(data.getElementId());
            }
        }

        return (
            <CometChatCheckBox
                data={data}
                showError={currentRequiredFields.includes(data.getElementId())}
                onChange={onChange}
                selectedOptions={bodyData[data.getElementId()] || []}
                style={checkboxStyle}
            />
        );
    }

    const _renderRadio = (data: RadioButtonElement) => {
        !data.getOptional() && allRequiredFields.push(data.getElementId());
        function onChange(value: string) {
            setBodyData({ ...bodyData, [data.getElementId()]: value });
            removeFromRequiredList(data.getElementId());
        }
        return (
            <CometChatRadioButton
                data={data}
                onChange={onChange}
                selectedOption={bodyData[data.getElementId()]}
                showError={currentRequiredFields.includes(data.getElementId())}
                style={radioButtonStyle}
            />
        );
    }

    const _renderSingleElement = (data: SingleSelectElement) => {
        !data.getOptional() && allRequiredFields.push(data.getElementId());
        function onChange(value: string) {
            setBodyData({ ...bodyData, [data.getElementId()]: value });
            removeFromRequiredList(data.getElementId());
        }
        return (
            <CometChatSingleSelect
                data={data}
                onChange={onChange}
                selectedOption={bodyData[data.getElementId()]}
                showError={currentRequiredFields.includes(data.getElementId())}
                style={singleSelectStyle}
            />
        );
    }

    const _returnDropDown = (data: DropdownElement) => {
        !data.getOptional() && allRequiredFields.push(data.getElementId());

        function onChange(value: string) {
            setBodyData({ ...bodyData, [data.getElementId()]: value });
            removeFromRequiredList(data.getElementId());
        }

        return <CometChatDropdown
            options={data.getOptions()}
            onOptionChange={onChange}
            data={data}
            showError={currentRequiredFields.includes(data.getElementId())}
            selectedOption={bodyData[data.getElementId()]}
            style={dropdownStyle}
        />
    }

    const _renderButton = (data: ButtonElement, isSubmitElement?: boolean) => {
        function onClick() {
            console.log("ElemId", data.getElementId(), interactedElements)
            _handleButtonClick(data.getAction(), data.getElementId(), isSubmitElement);
        }

        function isDisabled() {
            let isSender = message.getSender()?.getUid() == loggedInUser?.['uid'];
            let allowInteraction = isSender ? message?.["data"]?.["allowSenderInteraction"] : true;

            let disableAfterInteracted: boolean;
            if (data.getDisableAfterInteracted()) {
                disableAfterInteracted = interactedElements?.some(
                    (element) => element.getElementId() === data.getElementId()
                );
            }

            return (disableAfterInteracted || !allowInteraction);
        }

        return (
            <View style={{ opacity: isDisabled() ? .7 : 1, marginVertical: 5 }}>
                <CometChatButton
                    onPress={isDisabled() ? () => { } : onClick}
                    text={data.getButtonText()}
                    style={buttonStyle}
                    isLoading={loaderButton === data.getElementId()}
                />
            </View>
        );
    }


    const _renderLabel = (data: LabelElement) => {
        return (
            <CometChatLabel
                text={data.getText()}
                style={labelStyle}
            />
        );
    }

    const renderField = (field: ElementEntity) => {

        switch (field.getElementType()) {
            case ElementType.label:
                // Render label
                return _renderLabel(field as LabelElement);
            case ElementType.text:
                // Render text input
                return _renderTextInput(field as TextInputElement);
            case ElementType.dropdown:
                // Render dropdown
                return _returnDropDown(field as DropdownElement);
            case ElementType.checkbox:
                // Render checkbox
                return _renderCheckBox(field as CheckboxElement);
            case ElementType.radio:
                // Render radio button
                return _renderRadio(field as RadioButtonElement);
            case ElementType.singleSelect:
                // Render radio button
                return _renderSingleElement(field as SingleSelectElement);
            case ElementType.button:
                // Render button
                return _renderButton(field as ButtonElement);

            // Handle other cases
            default:
                return null;
        }
    }

    const filledRequiredFields = () => {
        let _requiredFields = [];
        for (let key in bodyData) {
            if ((Array.isArray(bodyData[key]) && bodyData[key].length === 0) || !bodyData[key]) {
                if (allRequiredFields.includes(key)) {
                    _requiredFields.push(key);
                }
            }
        }

        if (_requiredFields.length > 0) {
            setCurrentRequiredFields(_requiredFields);
            return false;
        } else {
            return true;
        }
    }

    function _handleButtonClick(action: ButtonElement["action"], elementId: string, isSubmitElement?: boolean) {
        if (isSubmitElement && onSubmitClick) {
            const dataKey = (action as APIAction)?.getDataKey() || "CometChatData"
            let payload: any = (action as APIAction).getPayload() || {}
            if (!(typeof payload === "object")) {
                payload = {}
            }
            payload[dataKey] = { ...bodyData };
            onSubmitClick(payload)
            return;
        }
        switch (action.getActionType()) {
            case ButtonAction.apiAction:
                if (filledRequiredFields()) {
                    const dataKey = (action as APIAction)?.getDataKey() || "CometChatData"
                    let payload: any = (action as APIAction).getPayload() || {}
                    if (!(typeof payload === "object")) {
                        payload = {}
                    }
                    payload[dataKey] = { ...bodyData };
                    setLoaderButton(elementId)
                    CometChatNetworkUtils.fetcher({
                        url: action.getURL(),
                        method: (action as APIAction).getMethod() || HTTPSRequestMethods.POST,
                        body: { ...payload, cometchatSenderUid: loggedInUser?.['uid'] || "" },
                        headers: (action as APIAction).getHeaders(),
                    })
                        .then((response) => {
                            if (response.status === 200) {
                                markAsInteracted(elementId);
                            }
                        })
                        .catch((error) => {
                            setLoaderButton("")
                            console.log("CometChatNetworkUtils.fetcher error", error);
                        });
                }
                break;
            case ButtonAction.urlNavigation:
                const url = (action as URLNavigationAction)?.getURL();
                WebView.openUrl(url);
                markAsInteracted(elementId);
                break;
            case ButtonAction.custom:
                markAsInteracted(elementId);
                break;
            default:
                break;
        }
    }

    const checkHasInteractionCompleted = () => {
        let completed = false;
        let neededInteractionElement = interactionGoal?.getElementIds() || [];
        let neededInteractionElementCondition: string = interactionGoal?.getType() || "";
        let _interactedElements = [...interactedElements] || [];

        switch (neededInteractionElementCondition) {
            case goalType.anyOf:
                completed = _interactedElements.find((element: CometChat.Interaction) =>
                    neededInteractionElement.includes(element.getElementId())
                )
                    ? true
                    : false;
                break;
            case goalType.anyAction:
                completed = _interactedElements.length > 0 ? true : false;
                break;
            case goalType.allOf:
                completed = neededInteractionElement.every((element) =>
                    _interactedElements.find(
                        (interaction: CometChat.Interaction) =>
                            interaction.getElementId() === element
                    )
                )
                    ? true
                    : false;
                break;
            case goalType.none:
                completed = false;
                break;
            default:
                completed = false;
                break;
        }
        return completed;
    };

    function markAsInteracted(elementId: string) {
        CometChat.markAsInteracted(message?.getId(), elementId).then(
            (response) => {
                const interaction = new CometChat.Interaction(
                    elementId,
                    new Date().getTime()
                );
                let clonedInteractedElements = [...interactedElements];
                clonedInteractedElements.push(interaction);
                setInteractedElements(clonedInteractedElements);
                setLoaderButton("")
            }
        )
            .catch((error) => {
                console.log("error while markAsInteracted", error);
            });
    }

    const removeFromRequiredList = (elementId: string) => {
        if (currentRequiredFields.includes(elementId)) {
            setCurrentRequiredFields(currentRequiredFields.filter((field) => field !== elementId));
        }
    }

    return <View
        style={{
            padding: wrapperPadding,
            flex: 1,
            borderRadius: wrapperBorderRadius,
            backgroundColor: wrapperBackground,
        }}
    >
        {hasInteractionCompleted ?
            <View style={{ padding: 5 }}>
                <CometChatQuickView
                    title={message.getSender()?.getName()}
                    subtitle={message.getTitle()}
                    quickViewStyle={quickViewStyle}
                />
                <Text style={[{ marginTop: 10, color: goalCompletionTextColor }, goalCompletionTextFont]}>{message.getGoalCompletionText() || localize("FORM_COMPLETION_MESSAGE")}</Text>
            </View>
            :
            <View style={{
                backgroundColor: backgroundColor,
                padding: 10, borderRadius: borderRadius, ...border
            }}>
                {Boolean(message.getTitle()) && <Text
                    style={[{ marginBottom: 15, marginTop: 10, color: titleColor }, titleFont]}
                >{message.getTitle()}</Text>}

                {
                    message.getFormFields().map((item) => {
                        return renderField(item)
                    })
                }
                {message.getSubmitElement() && _renderButton(message.getSubmitElement() as ButtonElement, true)}
            </View>
        }
    </View>
})

CometChatFormBubble.defaultProps = {
    message: {}
}