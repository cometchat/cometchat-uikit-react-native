import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useContext } from 'react'
import { CheckboxElement, OptionElement } from '../../modals/InteractiveData'
import { ICONS } from '../../assets/images';
import { CometChatContextType } from '../../base';
import { CometChatContext } from '../../CometChatContext';
import { CheckBoxStyle, CheckBoxStyleInterface } from './CheckBoxStyle';

export interface CometChatCheckBoxInterface {
    onChange?: (option: OptionElement) => void,
    data: CheckboxElement,
    showError: boolean,
    selectedOptions: string[],
    style?: CheckBoxStyleInterface,
}

const CometChatCheckBox = (props: CometChatCheckBoxInterface) => {
    const { onChange, data, showError, selectedOptions, style } = props;

    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const _style = new CheckBoxStyle({
        activeBackgroundColor: theme.palette.getPrimary(),
        inactiveBackgroundColor: theme.palette.getBackgroundColor(),
        titleFont: theme.typography.subtitle1,
        border: { borderWidth: 1, borderColor: theme.palette.getAccent200() },
        checkboxTintColor: theme.palette.getBackgroundColor(),
        titleColor: theme.palette.getAccent(),
        optionColor: theme.palette.getAccent(),
        optionFont: theme.typography.subtitle1,
        ...style,
    });

    const {
        activeBackgroundColor,
        checkboxTintColor,
        inactiveBackgroundColor,
        optionColor,
        optionFont,
        titleColor,
        titleFont,
        border,
    } = _style;

    function _checkSelectedOption(option: OptionElement) {
        return selectedOptions.find((selectedOption) => selectedOption === option.getValue()) ? true : false;
    }
    return (
        <View style={{ marginVertical: 10 }}>

            <Text style={[titleFont, { color: titleColor }]}>{data.getLabel()}{!data.getOptional() && "*"}</Text>

            {data.getOptions().map((option, index) => (
                <View key={index} style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                    <TouchableOpacity style={{
                        height: 20, width: 20, backgroundColor: _checkSelectedOption(option) ? activeBackgroundColor : inactiveBackgroundColor,
                        borderRadius: 5, marginRight: 5, alignItems: "center", justifyContent: "center",
                        borderColor: showError ? theme.palette.getError() : border.borderColor,
                        borderWidth: border.borderWidth,
                    }}
                        onPress={() => onChange(option)}
                    >
                        {_checkSelectedOption(option) && <Image
                            style={{
                                height: 15,
                                width: 15,
                                tintColor: checkboxTintColor,
                            }}
                            source={ICONS.CHECK_MARK}
                        />}
                    </TouchableOpacity>
                    <Text style={[optionFont, { color: optionColor }]}>{option.getLabel()}</Text>
                </View>
            ))}

        </View>
    )
}

export default CometChatCheckBox