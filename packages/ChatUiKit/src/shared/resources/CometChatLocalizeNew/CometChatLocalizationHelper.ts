import de from './resources/de/translation.json';
import en from './resources/en/translation.json';
import es from './resources/es/translation.json';
import fr from './resources/fr/translation.json';
import hi from './resources/hi/translation.json';
import hu from './resources/hu/translation.json';
import lt from './resources/lt/translation.json';
import ms from './resources/ms/translation.json';
import pt from './resources/pt/translation.json';
import ru from './resources/ru/translation.json';
import sv from './resources/sv/translation.json';
import zh from './resources/zh/translation.json';
import zhTw from './resources/zh-tw/translation.json'; 
import ja from './resources/ja/translation.json';
import ko from './resources/ko/translation.json';
import tr from './resources/tr/translation.json';
import nl from './resources/nl/translation.json';
import it from './resources/it/translation.json';   
import { Language } from './type';


export type TranslationKey = keyof typeof en;


const defaultTranslations = {
    de,
    en,
    es,
    fr,
    hi,
    hu,
    lt,
    ms,
    pt,
    ru,
    sv,
    zh,
    ja,
    ko,
    tr,
    nl,
    it,
    "zh-tw":zhTw,
    "en-IN" : en,
    "en-GB" : en,
    "en-US" : en,
} as const;


export type SupportedLanguage = keyof typeof defaultTranslations;

export interface CustomTranslations {
    [languageCode: string]: {
        [key: string]: string;
    };
}


/**
 * Look a language up in a bundle map, ignoring case.
 *
 * The shipped keys are not consistently cased — `en-US`/`en-GB`/`en-IN` use an
 * uppercase region while `zh-tw` is lowercase — and callers legitimately pass
 * the BCP-47 spelling (`zh-TW`). Matching case-insensitively means both work.
 */
const bundleFor = (
    map: { [languageCode: string]: { [key: string]: string } } | undefined,
    language: Language
): { [key: string]: string } | undefined => {
    if (!map || !language) {
        return undefined;
    }
    if (map[language]) {
        return map[language];
    }
    const match = Object.keys(map).find(
        k => k.toLowerCase() === language.toLowerCase()
    );
    return match ? map[match] : undefined;
};


/**
 * Resolve a language to the key it should be served from.
 *
 * Candidates are tried in order and matched case-insensitively against the
 * shipped languages plus any custom ones the host supplied. Returns the key as
 * it is actually stored, so downstream lookups are exact.
 */
export const resolveLanguage = (
    candidates: (string | undefined)[],
    customLanguages: string[] = []
): Language | undefined => {
    const keys = [...getAvailableLanguages() as string[], ...customLanguages];
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        const match = keys.find(k => k.toLowerCase() === candidate.toLowerCase());
        if (match) {
            return match;
        }
    }
    return undefined;
};


/**
 * The languages to try for a lookup, most specific first: the language itself,
 * then its base ("en-US" -> "en"). Region keys alias to their base bundle, so
 * without the base step a host overriding `en` would stop being honoured the
 * moment a device resolved to `en-US`.
 */
const languageChain = (language?: Language): Language[] => {
    const chain: Language[] = [];
    const add = (value?: string) => {
        if (value && !chain.some(c => c.toLowerCase() === value.toLowerCase())) {
            chain.push(value);
        }
    };
    add(language);
    add(language?.split('-')[0]);
    return chain;
};


/**
 * The shape of a `react-native-localize` locale, narrowed to what matters here.
 */
export interface DeviceLocale {
    languageCode?: string;
    countryCode?: string;
    languageTag?: string;
}


/**
 * Pick the bundle to serve for a device locale.
 *
 * Tried most specific first. `languageTag` can carry a script subtag -- iOS
 * reports Taiwan as `zh-Hant-TW` -- which no shipped key has, so language+region
 * is tried before the bare language. Without that step `zh-Hant-TW` collapses to
 * `zh` and a Traditional Chinese device is served Simplified.
 */
export const resolveDeviceLanguage = (
    locale?: DeviceLocale,
    customLanguages: string[] = []
): Language => {
    if (!locale) {
        return 'en';
    }
    const { languageCode, countryCode, languageTag } = locale;
    return resolveLanguage(
        [
            languageTag,
            languageCode && countryCode ? `${languageCode}-${countryCode}` : undefined,
            languageCode,
        ],
        customLanguages
    ) ?? 'en';
};


export const translate = (
    language: Language,
    key: string,
    customTranslations?: CustomTranslations,
    fallbackLanguage: Language = 'en'
): string => {

    const requested = languageChain(language);
    const fallback = languageChain(fallbackLanguage).filter(
        f => !requested.some(r => r.toLowerCase() === f.toLowerCase())
    );

    const fromCustom = (languages: Language[]) => {
        for (const lang of languages) {
            const bundle = bundleFor(customTranslations, lang);
            if (bundle?.[key]) {
                return bundle[key];
            }
        }
        return undefined;
    };

    const fromDefault = (languages: Language[]) => {
        for (const lang of languages) {
            const bundle = bundleFor(defaultTranslations as any, lang);
            if (bundle && key in bundle) {
                return bundle[key];
            }
        }
        return undefined;
    };

    // A host override for the requested language always wins over the built-in
    // bundle, but never over a built-in bundle for a *different* language --
    // so an `en` override does not leak into a Chinese UI.
    const resolved =
        fromCustom(requested) ??
        fromDefault(requested) ??
        fromCustom(fallback) ??
        fromDefault(fallback);

    if (resolved !== undefined) {
        return resolved;
    }

    console.warn(`Missing translation for key: ${key} in language: ${language} and fallback: ${fallbackLanguage}`);
    return key;
};


export const getAvailableLanguages = (): SupportedLanguage[] => {
    return Object.keys(defaultTranslations) as SupportedLanguage[];
};

export default defaultTranslations;