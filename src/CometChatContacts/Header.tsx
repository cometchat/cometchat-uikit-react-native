//@ts-ignore
import { View, Text, TouchableOpacity, TextInput, Image, NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native';
import React from 'react';
import styles from './styles';
import { ICONS } from '../shared/assets/images';
import { ImageType } from '../shared/helper/types';
import { BorderStyleInterface, FontStyleInterface } from '../shared';

export function Header(props: {
  backButtonIcon?: ImageType,
  showBackButton?: boolean,
  onBack?: () => void,
  title?: string,
  AppBarOptions?: () => JSX.Element,
  shouldSelect?: boolean,
  onSelectionHandler?: () => void,
  hideSearch?: boolean,
  searchBoxIcon?: ImageType,
  searchPlaceholderText?: string,
  searchPlaceholderTextColor?: string,
  searchHandler?: (text: string) => void,
  searchInput?: string,
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void,
  selectionIcon?: ImageType,
  titleFontStyle?: FontStyleInterface,
  titleColor?: string,
  backIconTint?: string,
  searchBorderStyle?: BorderStyleInterface,
  searchBorderRadius?: number,
  searchTextFontStyle?: FontStyleInterface,
  searchTextColor?: string,
  searchIconTint?: string,
  searchBackgroundColor?: string,
  selectionIconTint?: string,
}) {
  const {
    backButtonIcon,
    showBackButton,
    onBack,
    title,
    AppBarOptions,
    shouldSelect,
    onSelectionHandler,
    hideSearch,
    searchBoxIcon,
    searchPlaceholderText,
    searchPlaceholderTextColor,
    searchHandler,
    searchInput,
    onSubmitEditing,
    selectionIcon,
    titleFontStyle,
    titleColor,
    backIconTint,
    searchBorderStyle,
    searchBorderRadius,
    searchTextFontStyle,
    searchTextColor,
    searchIconTint,
    searchBackgroundColor,
    selectionIconTint,
  } = props;
  return (
    <View style={styles.listBaseHeaderStyle}>
      <View style={styles.upperContainer}>
        {(showBackButton || title?.length !== 0) && (
          <View style={styles.headerLeftContainer}>
            {showBackButton ? (
              <TouchableOpacity onPress={onBack}>
                <Image
                  source={
                    typeof backButtonIcon == 'string'
                      ? { uri: backButtonIcon }
                      : typeof backButtonIcon == 'object' ||
                        typeof backButtonIcon == 'number'
                      ? backButtonIcon
                      : ICONS.BACK
                  }
                  style={[
                    styles.backButtonStyle,
                    { tintColor: backIconTint ?? undefined },
                  ]}
                />
              </TouchableOpacity>
            ) : null}
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[
                styles.titleStyle,
                { color: titleColor ?? undefined },
                titleFontStyle ?? {},
              ]}
            >
              {title}
            </Text>
          </View>
        )}
        {AppBarOptions && !shouldSelect && (
          <View>
            <AppBarOptions />
          </View>
        )}
        {shouldSelect && (
          <View>
            <TouchableOpacity onPress={onSelectionHandler}>
              <Image
                source={
                  typeof selectionIcon == 'string'
                    ? { uri: selectionIcon }
                    : typeof selectionIcon == 'object' ||
                      typeof selectionIcon == 'number'
                    ? selectionIcon
                    : ICONS.CHECK_MARK
                }
                style={[
                  styles.backButtonStyle,
                  { tintColor: selectionIconTint ?? undefined },
                ]}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {!hideSearch && (
        <View
          style={[
            styles.searchBox,
            {
              borderRadius: searchBorderRadius ?? 20,
              backgroundColor: searchBackgroundColor ?? undefined,
            },
            searchBorderStyle ?? {},
          ]}
        >
          <Image
            source={
              typeof searchBoxIcon == 'string'
                ? { uri: searchBoxIcon }
                : typeof searchBoxIcon == 'object' ||
                  typeof searchBoxIcon == 'number'
                ? searchBoxIcon
                : ICONS.SEARCH
            }
            style={[
              styles.searchButtonStyle,
              { tintColor: searchIconTint ?? undefined },
            ]}
          />
          <TextInput
            placeholder={searchPlaceholderText || 'Search'}
            placeholderTextColor={searchPlaceholderTextColor}
            onChangeText={searchHandler}
            value={searchInput}
            numberOfLines={1}
            style={[
              styles.searchTextStyle,
              searchTextFontStyle ?? {},
              { color: searchTextColor ?? undefined },
            ]}
            onSubmitEditing={onSubmitEditing}
          />
        </View>
      )}
    </View>
  );
}
