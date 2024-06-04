import { View, Text, TextInput } from 'react-native'
import React, { useContext, useEffect, useState, useRef } from 'react'
import { TextInputElement } from '../../modals/InteractiveData';
import { CometChatContextType } from '../../base';
import { CometChatContext } from '../../CometChatContext';
import { TextInputStyle, TextInputStyleInterface } from './TextInputStyle';

export interface CometChatTextInputInterface {
    onChange?: (text: string) => void,
    data: TextInputElement,
    showError: boolean,
    style?: TextInputStyleInterface
    defaultValue?: string
}

const CometChatTextInput = (props: CometChatTextInputInterface) => {
    const { onChange, data, showError, style, defaultValue } = props;
    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const [value, setValue] = useState(defaultValue);

    const _style = new TextInputStyle({
        border: { borderWidth: 1, borderColor: theme.palette.getAccent200() },
        titleFont: theme.typography.subtitle1,
        titleColor: theme.palette.getAccent(),
        placeholderColor: theme.palette.getAccent600(),
        ...style,
    });

    const {
        titleFont,
        titleColor,
        placeholderColor,
        borderColor,
        borderWidth,
    } = _style;

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const _onChange = (text: string) => {
        setValue(text);
        if (onChange) {
            onChange(text);
        }
    }

    return (
        <View style={{ marginBottom: 10 }}>
            <Text style={[titleFont, { color: titleColor }]}>{data.getLabel()}{!data.getOptional() && "*"}</Text>
            <TextInput
                // autoFocus={true}
                value={value}
                autoCorrect={false}
                onChangeText={_onChange}
                style={{
                    borderColor: showError ? theme.palette.getError() : borderColor, paddingHorizontal: 5, paddingVertical: 8,
                    borderWidth: borderWidth, borderRadius: 5, marginTop: 5,
                }}
                placeholder={data.getPlaceholder()}
                placeholderTextColor={placeholderColor}
            />
        </View>
    )
}

export default CometChatTextInput