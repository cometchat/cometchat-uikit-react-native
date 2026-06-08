import {
  PropsWithChildren,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useColorScheme, Platform } from "react-native";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { Brightness, CometChatThemeHelper } from "./CometChatThemeHelper";
import {
  CompThemeContext,
  ThemeContext,
  ThemeProviderValue,
} from "./context";
import { darkThemeMaker, lightThemeMaker } from "./default/default";
import { useThemeInternal } from "./hook";
import { CometChatTheme } from "./type";

export interface CometChatThemeProviderProps {
  theme?: DeepPartial<ThemeProviderValue>;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const CometChatThemeProvider = ({
  children,
  theme = {} as any,
}: PropsWithChildren<CometChatThemeProviderProps>) => {
  const rawScheme = useColorScheme();
  // Always call the hook unconditionally (Rules of Hooks), use result conditionally
  const debouncedScheme = useDebounce(rawScheme, 300);
  const scheme = Platform.OS === "ios" ? debouncedScheme : rawScheme;

  const parentProviderTheme = useThemeInternal();
  const {
    mode = parentProviderTheme.mode,
    dark = parentProviderTheme.dark,
    light = parentProviderTheme.light,
  } = theme;

  const lightTheme = useMemo(() => {
    if (light) {
      const isColorAvailable = light.color !== undefined;
      const updatedColors = light.color
        ? CometChatThemeHelper.updateColors(
            light.color as Partial<CometChatTheme["color"]>,
            Brightness.LIGHT
          )
        : {} as any;
      const updatedSpacing = light.spacing
        ? CometChatThemeHelper.updateSpacing(light.spacing)
        : {} as any;

      // Create a new object cause react native will know the theme has changed
      const updatedLight = {
        ...light,
        color: updatedColors,
        spacing: updatedSpacing
      };
      const mergedTheme = deepMerge(parentProviderTheme.light, updatedLight);
      const defaultLightThemeWithOverridesApplied = isColorAvailable ? lightThemeMaker(
        mergedTheme.spacing as CometChatTheme["spacing"],
        mergedTheme.color as CometChatTheme["color"],
        mergedTheme.typography as CometChatTheme["typography"]
      ) : mergedTheme;
      return deepMerge(defaultLightThemeWithOverridesApplied, updatedLight);
    }
    return parentProviderTheme.light;
  }, [light, parentProviderTheme.light]);

  const darkTheme = useMemo(() => {
    if (dark) {
      const isColorAvailable = dark.color !== undefined;
      const updatedColors = dark.color
        ? CometChatThemeHelper.updateColors(
            dark.color as Partial<CometChatTheme["color"]>,
            Brightness.DARK
          )
        : {} as any;
      const updatedSpacing = dark.spacing
        ? CometChatThemeHelper.updateSpacing(dark.spacing)
        : {} as any;
      // Create a new object cause react native will know the theme has changed
      const updatedDark = {
        ...dark,
        color: updatedColors,
        spacing: updatedSpacing
      };
      const mergedTheme = deepMerge(parentProviderTheme.dark, updatedDark);
      const defaultDarkThemeWithOverridesApplied = isColorAvailable ? darkThemeMaker(
        mergedTheme.spacing as CometChatTheme["spacing"],
        mergedTheme.color as CometChatTheme["color"],
        mergedTheme.typography as CometChatTheme["typography"]
      ) : mergedTheme;
      return deepMerge(defaultDarkThemeWithOverridesApplied, updatedDark);
    }
    return parentProviderTheme.dark;
  }, [dark, parentProviderTheme.dark]);

  const resolvedMode = mode === "auto"
    ? (typeof scheme === "string" ? scheme : "light")
    : mode;

  const themeValue = useMemo(() => ({
    light: lightTheme,
    dark: darkTheme,
    mode: resolvedMode,
  }), [lightTheme, darkTheme, resolvedMode]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export interface CometChatCompThemeProviderProps {
  theme?: DeepPartial<ThemeProviderValue["light"]>;
}

export const CometChatCompThemeProvider = ({
  children,
  theme = {} as any,
}: PropsWithChildren<CometChatCompThemeProviderProps>) => {
  const stableTheme = useMemo(() => theme, [theme]);
  return (
    <CompThemeContext.Provider value={stableTheme}>
      {children}
    </CompThemeContext.Provider>
  );
};
