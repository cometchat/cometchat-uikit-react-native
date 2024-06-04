//@ts-ignore
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import React from 'react';
import styles from './styles';
import { ICONS } from './resources';

export default function Header({
  backButtonIcon,
  showBackButton,
  onBack,
  title,
  AppBarOptions,
  shouldSelect,
  hideSubmitIcon,
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
  searchBackground,
  selectionIconTint,
}: any) {
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
                    { tintColor: backIconTint ?? '' },
                  ]}
                />
              </TouchableOpacity>
            ) : null}
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[
                styles.titleStyle,
                { color: titleColor ?? '' },
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
        {shouldSelect && !hideSubmitIcon &&(
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
                  { tintColor: selectionIconTint ?? '' },
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
              backgroundColor: searchBackground ?? '',
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
              { tintColor: searchIconTint ?? '' },
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
              { color: searchTextColor ?? '' },
            ]}
            onSubmitEditing={onSubmitEditing}
          />
        </View>
      )}
    </View>
  );
}
