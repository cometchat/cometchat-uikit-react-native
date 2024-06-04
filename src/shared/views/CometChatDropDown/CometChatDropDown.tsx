import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { DownArrow } from './resources';
import { CometChatContextType } from '../../base';
import { CometChatContext } from '../../CometChatContext';
import { DropDownStyle, DropDownStyleInterface } from './DropDownStyle';

export interface CometChatButtonInterface {
    options: any[],
    arrowIconURL?: string,
    dropdownStyle?: object,
    onOptionChange?: any,
    selectedOption?: any,
    data: any,
    showError: boolean,
    style?: DropDownStyleInterface
}

const CometChatDropdown = (props: CometChatButtonInterface) => {
    const { options,
        arrowIconURL = DownArrow,
        dropdownStyle = {},
        onOptionChange,
        selectedOption, data, showError, style } = props;
    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const _style = new DropDownStyle({
        activeBackgroundColor: theme.palette.getPrimary(),
        inactiveBackgroundColor: theme.palette.getBackgroundColor(),
        border: { borderWidth: 1, borderColor: theme.palette.getAccent200() },
        titleFont: theme.typography.subtitle1,
        optionColor: theme.palette.getAccent(),
        titleColor: theme.palette.getAccent(),
        ...style,
    });

    const {
        activeBackgroundColor,
        inactiveBackgroundColor,
        optionColor,
        optionFont,
        titleColor,
        titleFont,
        border,
    } = _style;

    const [openDropdown, setOpenDropdown] = useState(false);
    const [currentOption, setCurrentOption] = useState({ label: selectedOption || "Select an option" });

    useEffect(() => {
        if (!selectedOption) return;
        let selectedObj = options.find((option) => option.value === selectedOption);
        selectedObj && setCurrentOption(selectedObj);
    }, [selectedOption])

    const onDropDownToggle = () => {
        setOpenDropdown(!openDropdown);
    };

    const onOptionSelect = option => {
        setCurrentOption(option);
        onOptionChange && onOptionChange(option); // Assuming that onOptionChange function is passed as a prop
        onDropDownToggle();
    };

    return (
        <View style={{ ...styles.defaultDropdownStyle, ...dropdownStyle }}>
            <Text style={[titleFont, { color: titleColor }]}>{data.getLabel()}{!data.getOptional() && "*"}</Text>

            <View style={{ position: "relative" }}>
                <TouchableOpacity onPress={onDropDownToggle} style={[styles.dropdownButton, { borderColor: showError ? theme.palette.getError() : border.borderColor, borderWidth: border.borderWidth }]}>
                    <Text style={[optionFont, { color: optionColor }]}>{currentOption.label}</Text>
                    {/* Display arrow icon */}
                    {arrowIconURL && <Image source={arrowIconURL} style={[styles.dropdownArrow, openDropdown && { transform: [{ rotate: '180deg' }] }]} />}
                </TouchableOpacity>

                {openDropdown && (
                    <ScrollView style={[styles.dropdownOptions, { borderColor: border.borderColor, borderWidth: border.borderWidth, backgroundColor: inactiveBackgroundColor }]}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                activeOpacity={1}
                                style={{
                                    backgroundColor: currentOption.label === option.label ? activeBackgroundColor : inactiveBackgroundColor,
                                    height: 35,
                                    justifyContent: "center", paddingHorizontal: 8
                                }}
                                key={index} onPress={() => onOptionSelect(option)}>
                                <Text style={[optionFont, { color: optionColor }]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    defaultDropdownStyle: {
        // position: "relative",
        zIndex: 1,
        marginVertical: 10,
        // Your default dropdown style here
    },
    dropdownButton: {
        borderWidth: 1, flexDirection: "row",
        justifyContent: "space-between", height: 35,
        alignItems: "center", paddingHorizontal: 8, marginTop: 5,
        // Your dropdown button style here
    },
    dropdownArrow: {
        height: 15, width: 15,
        // Your dropdown arrow style here
    },
    dropdownOptions: {
        maxHeight: 150,
        position: "absolute",
        top: 40, width: "100%",
        borderWidth: 1,
        borderTopWidth: 0,
        // Your dropdown options style here
    },
});

export default CometChatDropdown;