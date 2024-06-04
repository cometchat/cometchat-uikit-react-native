import React from "react";
import { TouchableOpacity } from "react-native";

export const RoudedButton = ({style, onPress, children}) => {
    return (
        <TouchableOpacity style={{
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...style
        }}
            onPress={onPress}
        >
            {children}
        </TouchableOpacity>
    )
}
