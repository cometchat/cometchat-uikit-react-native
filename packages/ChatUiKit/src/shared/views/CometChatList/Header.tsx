import React, { JSX, useRef } from "react";
import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { Icon } from "../../icons/Icon";
import styles from "./styles";

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /**
   * Style for the separator view between the back button and title.
   */
  titleSeparatorStyle?: ViewStyle;
  /**
   * Count of selected items (used in selection mode).
   */
  selectedCount?: number;
  /**
   * If true, hides the back button.
   */
  hideBackButton?: boolean;
  /**
   * Callback function invoked when the back button is pressed.
   */
  onBack?: () => void;
  /**
   * Custom component for additional AppBar options.
   */
  AppBarOptions?: React.FC;
  /**
   * If true, indicates that the list is in selection mode.
   */
  shouldSelect?: boolean;
  /**
   * If true, hides the submit (confirm) button in selection mode.
   */
  hideSubmitButton?: boolean;
  /**
   * Callback function invoked when the cancel button is pressed in selection mode.
   */
  onCancel?: () => void;
  /**
   * Callback function invoked when the confirm button is pressed in selection mode.
   */
  onConfirm?: () => void;
  /**
   * If true, hides the search box.
   */
  hideSearch?: boolean;
  /**
   * Callback function to handle changes in the search input.
   */
  searchHandler?: (text: string) => void;
  /**
   * Current search input value.
   */
  searchInput?: string;
  /**
   * Callback function invoked when submitting the search (e.g., via keyboard's search button).
   */
  onSubmitEditing?: () => void;
  /**
   * Back button icon, can be an image source or a JSX element.
   */
  backButtonIcon?: ImageSourcePropType | JSX.Element;
  /**
   * Custom style for the back button icon.
   */
  backButtonIconStyle?: ImageStyle;
  /**
   * Title text to display in the header.
   */
  title?: string;
  /**
   * Custom style for the title text.
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the container wrapping the title.
   */
  titleViewStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the header container.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Placeholder text for the search input.
   */
  searchPlaceholderText?: string;
  confirmSelectionStyle?: {
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ImageStyle;
  };
  selectionCancelStyle?: {
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ImageStyle;
  };
  /**
   * Custom style for the search component.
   */
  searchStyle?: Partial<{
    textStyle: TextStyle;
    placehodlerTextStyle?: TextStyle;
    containerStyle: ViewStyle;
    icon: ImageSourcePropType | JSX.Element;
    iconStyle: ImageStyle;
  }>;
  /**
   * Custom style for the container of the back button icon.
   */
  backButtonIconContainerStyle?: ViewStyle;
  /**
   * If true, hides the entire header.
   */
  hideHeader?: boolean;
  /**
   * Custom search view component to display instead of the default search input.
   */
  SearchView?: () => JSX.Element;
  /**
   * Callback triggered when the search bar is clicked or focused.
   */
  onSearchBarClicked?: () => void;
}

/**
 * Header component renders the top portion of the list with a title, back button, selection actions,
 * AppBar options, and a search box.
 *
 *   Props to customize the header.
 *   The rendered header component.
 */
export default function Header({
  selectedCount = 0,
  hideBackButton = true,
  onBack = () => {},
  AppBarOptions,
  shouldSelect = false,
  hideSubmitButton = false,
  onCancel = () => {},
  onConfirm = () => {},
  hideSearch = false,
  searchHandler = () => {},
  searchInput = "",
  onSubmitEditing = () => {},
  backButtonIcon,
  backButtonIconStyle = {},
  title = "",
  titleStyle = {},
  titleViewStyle,
  containerStyle,
  searchPlaceholderText = "Search",
  confirmSelectionStyle,
  selectionCancelStyle,
  titleSeparatorStyle = {},
  searchStyle,
  hideHeader = false,
  backButtonIconContainerStyle = { marginLeft: 10 },
  SearchView,
  onSearchBarClicked,
}: HeaderProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={[styles.listBaseHeaderStyle, { width: '100%' }]}>
      {/* Header section with border */}
      {!hideHeader && (
        <View style={[styles.upperContainer, containerStyle]}>
          <View style={{ flexDirection: "row", ...titleSeparatorStyle }}>
            {/* Render back button and title if not in selection mode */}
            {!shouldSelect && (!hideBackButton || title.length !== 0) && (
              <View style={styles.headerLeftContainer}>
                {!hideBackButton && (
                  <TouchableOpacity onPress={onBack}>
                    <Icon
                      containerStyle={backButtonIconContainerStyle}
                      name='arrow-back-fill'
                      size={backButtonIconStyle.width}
                      height={backButtonIconStyle.height}
                      width={backButtonIconStyle.width}
                      color={backButtonIconStyle.tintColor}
                      icon={backButtonIcon}
                      imageStyle={backButtonIconStyle}
                    />
                  </TouchableOpacity>
                )}
                {title.length !== 0 && (
                  <View style={titleViewStyle}>
                    <Text
                      ellipsizeMode='tail'
                      numberOfLines={1}
                      allowFontScaling={true}                
                      style={[{ color: theme.color.textPrimary }, titleStyle]}
                    >
                      {title}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Render selection mode actions: cancel button and selected count */}
            {shouldSelect && (
              <View
                style={[
                  { paddingHorizontal: theme.spacing.spacing.s4 },
                  styles.headerLeftContainer,
                ]}
              >
                <TouchableOpacity onPress={onCancel}>
                  <Icon
                    name='close'
                    size={selectionCancelStyle?.iconStyle?.width || 24}
                    height={selectionCancelStyle?.iconStyle?.height || 24}
                    width={selectionCancelStyle?.iconStyle?.width || 24}
                    color={selectionCancelStyle?.iconStyle?.tintColor || theme.color.iconPrimary}
                    icon={selectionCancelStyle?.icon}
                    imageStyle={selectionCancelStyle?.iconStyle}
                    containerStyle={selectionCancelStyle?.iconContainerStyle}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.selectedCountText, titleStyle, theme.typography.heading2.medium]}
                >
                  {selectedCount}
                </Text>
              </View>
            )}

            {/* Render AppBar options or the selection confirm (tick) icon */}
            <View style={styles.headerRightContainer}>
              {!shouldSelect && AppBarOptions && <AppBarOptions />}
              {selectedCount > 0 && shouldSelect && !hideSubmitButton && (
                <TouchableOpacity onPress={onConfirm} style={{ paddingHorizontal: 20 }}>
                  <Icon
                    name='list-item-check'
                    size={confirmSelectionStyle?.iconStyle?.width || 24}
                    height={confirmSelectionStyle?.iconStyle?.height || 24}
                    width={confirmSelectionStyle?.iconStyle?.width || 24}
                    color={confirmSelectionStyle?.iconStyle?.tintColor || theme.color.iconPrimary}
                    icon={confirmSelectionStyle?.icon}
                    imageStyle={confirmSelectionStyle?.iconStyle}
                    containerStyle={confirmSelectionStyle?.iconContainerStyle}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Render search box without border */}
      {!hideSearch && (
        <View style={{
          alignSelf: 'stretch',
          width: '100%',
          paddingVertical: theme.spacing.spacing.s3
        }}>
          {SearchView ? (
            <View >
              <SearchView />
            </View>
          ) : (
            <View
              style={[
                {
                  backgroundColor: theme.color.background3,
                  borderRadius: theme.spacing.radius.max,
                  paddingHorizontal: theme.spacing.spacing.s3,
                  paddingVertical: theme.spacing.spacing.s3,
                  marginTop: theme.spacing.spacing.s2,
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  gap: theme.spacing.spacing.s2,
                  height: 48,
                  alignSelf: 'stretch',
                },
                searchStyle?.containerStyle,
              ]}
            >
              <Icon
                name='search-fill'
                size={searchStyle?.iconStyle?.width || 24}
                height={searchStyle?.iconStyle?.height || 24}
                width={searchStyle?.iconStyle?.width || 24}
                color={searchStyle?.iconStyle?.tintColor || theme.color.iconSecondary}
                icon={searchStyle?.icon}
                imageStyle={searchStyle?.iconStyle}
              />
              <TextInput
                ref={inputRef}
                placeholder={searchPlaceholderText}
                placeholderTextColor={
                  searchStyle?.placehodlerTextStyle?.color || theme.color.textTertiary
                }
                onChangeText={searchHandler}
                onFocus={onSearchBarClicked}
                returnKeyType='search'
                value={searchInput}
                onSubmitEditing={() => {
                  onSubmitEditing?.();
                  inputRef.current?.focus();
                }}
                submitBehavior='submit'
                numberOfLines={1}
                style={[
                  {
                    flex: 1,
                    color: theme.color.textPrimary,
                    fontSize: 16,
                    paddingVertical: 4, 
                    ...theme.typography.heading4.regular,
                  },
                  searchStyle?.textStyle,
                ]}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
