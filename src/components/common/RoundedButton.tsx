import React, { ReactNode } from "react";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";

interface RoundedButtonProps {
    style?: StyleProp<ViewStyle>;
    onPress: () => void;
    children: ReactNode;
}

const base: ViewStyle = {
  borderRadius: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
};


export const RoundedButton = ({ style, onPress, children }: RoundedButtonProps) => {
    return (
        <TouchableOpacity style={[base, style]} onPress={onPress}>
            {children}
        </TouchableOpacity>
    );
}
