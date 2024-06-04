import React, { useContext } from 'react'
import { ScrollView } from 'react-native'
import { CardView } from './CardView'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
import { AppStyle } from '../../AppStyle';

const ModuleFeatures = ({ navigation, features }) => {
    
    const {theme}  = useContext(CometChatContext);

    return (
        <ScrollView style={[AppStyle.container, {backgroundColor : theme.palette.getAccent200()}]}>
            {
                features.map(module => {
                    return <CardView
                        name={module.name}
                        info={module.info}
                        image={module.image}
                        onPress={() => navigation.navigate(module.id)}
                    />
                })
            }
        </ScrollView>
    )
}

export default ModuleFeatures