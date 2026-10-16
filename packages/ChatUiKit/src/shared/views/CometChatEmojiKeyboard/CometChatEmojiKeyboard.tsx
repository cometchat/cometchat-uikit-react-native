import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { Icon } from "../../icons/Icon";
import { Emojis } from "./emojis";
import Styles from "./style";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Type definitions for the emoji items and categories.
 */
type EmojiItem = {
  char: string;
  keywords: string[];
};

type Section = {
  id: string;
  title: string;
  data: EmojiItem[];
};

type IconName =
  | "smiley-emoji"
  | "activity-emoji"
  | "animals-nature-emoji"
  | "flags-emoji"
  | "food-drink-emoji"
  | "objects-emoji"
  | "symbols-emoji"
  | "travel-emoji";

/**
 * Mapping from category names to icon names.
 * Adjust these icons as per the assets available in your project.
 */
const categoryIconMapping: Record<string, IconName> = {
  Smileys: "smiley-emoji",
  Activity: "activity-emoji",
  Animals: "animals-nature-emoji",
  Flags: "flags-emoji",
  Food: "food-drink-emoji",
  Objects: "objects-emoji",
  Symbols: "symbols-emoji",
  Travel: "travel-emoji",
} as const;

/**
 * The number of columns in the emoji grid.
 * Adjust this value based on available space and desired layout.
 */
const NUM_COLUMNS = 8;

/**
 * Props for the category list component.
 */
interface CategoryListProps {
  onCategorySelected: (id: string) => void;
  activeCategory: string;
  categoryIconTint?: string;
  selectedCategoryIconTint?: string;
}

/**
 * A memoized component displaying the category tabs (icons) at the bottom.
 */
const CategoryList: React.FC<CategoryListProps> = React.memo(
  ({ onCategorySelected, activeCategory, categoryIconTint, selectedCategoryIconTint }) => {
    const theme = useTheme();
    const styles = useMemo(() => Styles(theme), [theme]);

    return (
      <View style={styles.categoryListContainer}>
        {Emojis.map((category: any) => {
          // Each category object is expected to have a key and associated info.
          const key: string = Object.keys(category)[0];
          const emojiCategory = category[key];

          // Determine the appropriate icon for the category.
          const iconName = categoryIconMapping[emojiCategory.symbol] || "smiley-emoji";
          const isActive = activeCategory === emojiCategory.id;

          return (
            <TouchableOpacity
              key={emojiCategory.id}
              onPress={() => onCategorySelected(emojiCategory.id)}
              accessibilityLabel={`Category ${emojiCategory.name}`}
              accessibilityRole='button'
            >
              <View style={[styles.iconContainer, isActive && styles.activeIcon]}>
                <Icon
                  name={iconName}
                  size={24}
                  color={
                    isActive
                      ? selectedCategoryIconTint || theme.color.iconHighlight
                      : categoryIconTint || theme.color.iconSecondary
                  }
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }
);

/**
 * Props for the main CometChatEmojiKeyboard component.
 */
interface CometChatEmojiKeyboardProps {
  /** Callback when an emoji is clicked. */
  onClick?: (emoji: string) => void;
  /** Style overrides for customizing the appearance of the emoji keyboard. */
  style?: {
    borderRadius?: number;
    categoryBackground?: string;
    categoryIconTint?: string;
    selectedCategoryIconTint?: string;
    sectionHeaderColor?: string;
    sectionHeaderFont?: StyleProp<TextStyle>;
    backgroundColor?: string;
  };
}

/**
 * The main emoji keyboard component. It displays a header, a grid of emojis for the active category,
 * and category tabs at the bottom for switching between categories.
 */
const CometChatEmojiKeyboard: React.FC<CometChatEmojiKeyboardProps> = ({
  onClick,
  style: {
    borderRadius,
    categoryBackground,
    categoryIconTint,
    selectedCategoryIconTint,
    sectionHeaderColor,
    sectionHeaderFont,
    backgroundColor,
  } = {},
}) => {
  const theme = useTheme();
  const styles = Styles(theme);
  const insets = useSafeAreaInsets();

  /**
   * ITEM_HEIGHT is assumed to be the height of one row or the uniform height per row.
   * If this assumption changes, `getItemLayout` might need to be removed or adjusted.
   */
  const ITEM_HEIGHT = 40;

  /**
   * getItemLayout helps to optimize the FlatList performance by skipping layout calculations
   * for off-screen items. This works best when item sizes are fixed and known in advance.
   * Note: With multiple columns, ensure that ITEM_HEIGHT matches the row height.
   */
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [ITEM_HEIGHT]
  );

  // State for the currently active category and header title.
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState("Emojis");

  // A ref to the FlatList for programmatic scrolling.
  const flatListRef = useRef<FlatList<EmojiItem>>(null);

  /**
   * Handle emoji press events by calling the provided `onClick` callback.
   */
  const handleEmojiPress = useCallback(
    (emoji: string) => {
      if (onClick) {
        onClick(emoji);
      }
    },
    [onClick]
  );

  /**
   * Prepare sections of emojis. Each category is transformed into a Section object
   * containing the category id, title, and array of emojis.
   *
   * Memoized to prevent re-computation on every render unless `Emojis` changes.
   */
  const sections: Section[] = useMemo(() => {
    return Emojis.map((category: any) => {
      const key: string = Object.keys(category)[0];
      const { id, name, emojis } = category[key];
      const emojiArray: EmojiItem[] = Object.values(emojis);

      return {
        id,
        title: name,
        data: emojiArray,
      };
    });
  }, []);

  /**
   * Set the initial active category and header title once sections are computed.
   */
  useEffect(() => {
    if (sections.length > 0) {
      setActiveCategory(sections[0].id);
      setHeaderTitle(sections[0].title);
    }
  }, [sections]);

  /**
   * Handle category selection from the bottom tabs.
   * Updates the active category and resets the FlatList scroll to the top.
   */
  const handleCategorySelect = useCallback(
    (id: string) => {
      if (id !== activeCategory) {
        const category = sections.find((section) => section.id === id);
        if (category) {
          setActiveCategory(id);
          setHeaderTitle(category.title);
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: false });
          }
        }
      }
    },
    [sections, activeCategory]
  );

  /**
   * Render a single emoji item in the FlatList.
   * The callback is memoized to prevent unnecessary re-renders.
   */
  const renderEmojiItem = useCallback(
    ({ item }: { item: EmojiItem }) => (
      <TouchableOpacity
        onPress={() => handleEmojiPress(item.char)}
        style={styles.emojiItem}
        accessibilityLabel={`Emoji ${item.char}`}
        accessibilityRole='button'
      >
        <Text style={[styles.emojiText, { color: theme.color.primary }]}>{item.char}</Text>
      </TouchableOpacity>
    ),
    [handleEmojiPress, styles.emojiItem, styles.emojiText, theme.color.primary]
  );

  /**
   * Render the FlatList of emojis for the currently active category.
   * If no category is active, return null.
   */
  const renderActiveCategory = () => {
    const category = sections.find((section) => section.id === activeCategory);
    if (!category) return null;

    return (
      <FlatList<EmojiItem>
        ref={flatListRef}
        data={category.data}
        getItemLayout={getItemLayout}
        keyExtractor={(item) => item.char}
        renderItem={renderEmojiItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
        initialNumToRender={80}
        removeClippedSubviews={Platform.OS !== 'android'} // ENG-40210: clipping crashes Fabric on Android
      />
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.emojiKeyboardContainer,
        {
          borderRadius: borderRadius || 0,
          backgroundColor: backgroundColor || theme.color.background1,
          flexDirection: "column",
        },
      ]}
    >
      {/* Fixed Header displaying the active category title */}
      <View style={styles.fixedHeader}>
        <Text
          style={[
            theme.typography.heading4.regular,
            sectionHeaderFont,
            { color: sectionHeaderColor || theme.color.textTertiary },
          ]}
        >
          {headerTitle}
        </Text>
      </View>

      {/* Emoji Grid for the active category */}
      <View style={styles.emojiGridContainer}>{renderActiveCategory()}</View>

      {/* Bottom Category Tabs */}
      <View
        style={[
          styles.categoryContainer,
          {
            backgroundColor: categoryBackground || theme.color.background1,
            paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
          },
        ]}
      >
        <CategoryList
          onCategorySelected={handleCategorySelect}
          activeCategory={activeCategory || ""}
          categoryIconTint={categoryIconTint}
          selectedCategoryIconTint={selectedCategoryIconTint}
        />
      </View>
    </SafeAreaView>
  );
};

export { CometChatEmojiKeyboard };
