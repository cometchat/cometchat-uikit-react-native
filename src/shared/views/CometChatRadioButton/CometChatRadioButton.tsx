import { View, Text, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import { RadioButtonElement } from '../../modals/InteractiveData'
import { CometChatContextType } from '../../base'
import { CometChatContext } from '../../CometChatContext'
import { RadioButtonStyle, RadioButtonStyleInterface } from './RadioButtonStyle'

export interface CometChatRadioButtonInterface {
    data: RadioButtonElement,
    showError: boolean,
    selectedOption: string,
    onChange: (value: string) => void,
    style?: RadioButtonStyleInterface
}

const CometChatRadioButton = (props: CometChatRadioButtonInterface) => {
    const { data, onChange, selectedOption, showError, style } = props;
    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const _style = new RadioButtonStyle({
        activeBackgroundColor: theme.palette.getPrimary(),
        inactiveBackgroundColor: theme.palette.getBackgroundColor(),
        titleFont: theme.typography.subtitle1,
        border: { borderColor: theme.palette.getAccent200(), borderWidth: 1 },
        titleColor: theme.palette.getAccent(),
        optionColor: theme.palette.getAccent(),
        optionFont: theme.typography.subtitle1,
        ...style,
    });

    const {
        activeBackgroundColor,
        inactiveBackgroundColor,
        titleFont,
        titleColor,
        optionColor,
        optionFont,
        borderColor,
        borderWidth
    } = _style;

    return (
        <View style={{ marginVertical: 10 }}>
            <Text style={[titleFont, { color: titleColor }]}>{data.getLabel()}{!data.getOptional() && "*"}</Text>
            {data.getOptions().map((option, index) => (
                <View key={index} style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                    <TouchableOpacity style={{
                        height: 20, width: 20, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: selectedOption !== option.getValue() ? inactiveBackgroundColor : undefined,
                        borderWidth: selectedOption === option.getValue() ? borderWidth + 1 : borderWidth, borderColor: showError ? theme.palette.getError() : borderColor, marginRight: 5,
                    }}
                        onPress={() => onChange(option.getValue())}
                    >
                        {selectedOption === option.getValue() && <View
                            style={{
                                borderRadius: 20, height: 12, width: 12, 
                                backgroundColor: activeBackgroundColor,
                            }}
                        />}
                    </TouchableOpacity>
                    <Text style={[optionFont, { color: optionColor }]}>{option.getLabel()}</Text>
                </View>
            ))}
        </View>
    )
}

export default CometChatRadioButton