import { View, Text, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import { SingleSelectElement } from '../../modals/InteractiveData'
import { CometChatContextType } from '../../base'
import { CometChatContext } from '../../CometChatContext'
import { SingleSelectStyle, SingleSelectStyleInterface } from './SingleStyle'

export interface CometChatSingleSelectInterface {
    data: SingleSelectElement,
    showError: boolean,
    selectedOption: string,
    onChange: (value: string) => void,
    style?: SingleSelectStyleInterface,
}

const CometChatSingleSelect = (props: CometChatSingleSelectInterface) => {
    const { data, onChange, selectedOption, showError, style } = props;
    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const _style = new SingleSelectStyle({
        titleFont: theme.typography.subtitle1,
        titleColor: theme.palette.getAccent(),
        border: { borderWidth: 1, borderColor: theme.palette.getAccent200() },
        optionFont: theme.typography.title2,
        optionColorActive: theme.palette.getAccent900(),
        optionColorInactive: theme.palette.getAccent300(),
        ...style,
    })

    const {
        titleFont,
        titleColor,
        border,
        optionFont,
        optionColorActive,
        optionColorInactive
    } = _style;

    return (
        <View style={{ marginVertical: 10 }}>
            <Text style={[titleFont, { color: titleColor }]}>{data.getLabel()}{!data.getOptional() && "*"}</Text>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 3, flexWrap: "wrap" }}>
                {data.getOptions().map((option, index) => (
                    <TouchableOpacity style={{
                        width: data.getOptions().length > 2 ? "100%" : "50%",
                        padding: 8, borderRadius: 5, marginTop: 2,
                        alignItems: "center", justifyContent: "center",
                        borderWidth: border.borderWidth, borderColor: showError ? theme.palette.getError() : border.borderColor,
                    }}
                        key={index}
                        onPress={() => onChange(option.getValue())}
                    >
                        <Text style={[optionFont, {
                            color: selectedOption === option.getValue() ? optionColorActive : optionColorInactive
                        }]}>{option.getLabel()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

export default CometChatSingleSelect