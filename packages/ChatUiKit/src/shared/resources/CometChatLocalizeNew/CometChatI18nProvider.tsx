import React, { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { resolveDeviceLanguage, resolveLanguage, translate } from "./CometChatLocalizationHelper";
import { CometChatLocalizeContext } from "./CometChatLocalizeContext";
import { setGlobalLanguage } from './LocalizationManager';
import * as RNLocalize from 'react-native-localize';
import { Language } from "./type";

interface CometChatI18nProviderProps {
    children: ReactNode;
    selectedLanguage?: Language;
    autoDetectLanguage?: boolean;
    fallbackLanguage?: Language;
    translations?: {
        [languageCode: string]: {
            [key: string]: string;
        };
    };
}

const getDeviceLanguage = (customLanguages: string[] = []): Language => {
    try {
        const locales = RNLocalize.getLocales();
        if (Array.isArray(locales) && locales.length > 0) {
            return resolveDeviceLanguage(locales[0], customLanguages);
        }
    } catch (error) {
        console.warn('Error getting device language:', error);
    }
    return 'en';
};


export const CometChatI18nProvider = ({
    children,
    selectedLanguage,
    autoDetectLanguage = true,
    fallbackLanguage = 'en',
    translations
}: CometChatI18nProviderProps) => {
    const [language, setLanguage] = useState<Language>(() => {
        const customLanguages = translations ? Object.keys(translations) : [];
        if (selectedLanguage) {
            const resolved = resolveLanguage([selectedLanguage], customLanguages);
            if (resolved) {
                return resolved;
            }
            console.warn(`Language '${selectedLanguage}' not found. Using fallback: ${fallbackLanguage}`);
            return fallbackLanguage;
        } else if (autoDetectLanguage) {
            return getDeviceLanguage(customLanguages);
        }
        return fallbackLanguage;
    });

    useEffect(() => {
        const customLanguages = translations ? Object.keys(translations) : [];
        if (selectedLanguage) {
            const resolved = resolveLanguage([selectedLanguage], customLanguages);
            if (resolved) {
                setLanguage(resolved);
            } else {
                console.warn(`Language '${selectedLanguage}' not found (set via prop). Using fallback: ${fallbackLanguage}`);
                setLanguage(fallbackLanguage);
            }
        } else if (autoDetectLanguage) {
            setLanguage(getDeviceLanguage(customLanguages));
        }
    }, [selectedLanguage, autoDetectLanguage, fallbackLanguage, translations]);


    useEffect(() => {
        setGlobalLanguage(language, translations, fallbackLanguage);
    }, [language, translations, fallbackLanguage]);


    const t = useCallback((key: string): string => {
        return translate(language, key, translations, fallbackLanguage);
    }, [language, translations, fallbackLanguage]);


    const contextValue = useMemo(() => ({
        language,
        t,
    }), [language, t]);

    return (
        <CometChatLocalizeContext.Provider value={contextValue}>
            {children}
        </CometChatLocalizeContext.Provider>
    );
};