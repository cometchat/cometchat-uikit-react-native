import React from 'react'
import { ScrollView } from 'react-native'
import { CardView } from './CardView'
import { NavigationProp } from '@react-navigation/native'

interface Feature {
    id: any
    name: string
    info: string
    image: any
}

interface ModuleFeaturesProps {
    navigation: NavigationProp<any>;
    features: Feature[]
}

const ModuleFeatures = ({ navigation, features }: ModuleFeaturesProps) => {
    return (
        <ScrollView>
            {features.map((module) => (
                <CardView
                    key={module.id}
                    name={module.name}
                    info={module.info}
                    image={module.image}
                    onPress={() => navigation.navigate(module.id)}
                />
            ))}
        </ScrollView>
    )
}

export default ModuleFeatures