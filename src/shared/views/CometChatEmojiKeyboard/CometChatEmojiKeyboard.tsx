import React, { useCallback, useImperativeHandle, useRef, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Emojis } from './emojis';
import { Styles } from './style';
import { CometChatTheme } from '../../resources/CometChatTheme';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { EmojiKeyboardConfiguration } from './EmojiKeyboardConfiguration';

const emojiValues = Object.values(Emojis);

const viewConfig = {
  waitForInteraction: true,
  viewAreaCoveragePercentThreshold: 30
}

type CategoryListInterface = {
  theme: CometChatTheme,
  onCategorySelected: (id: string, index: number) => void,
  style?: {
    categoryIconTint?: string
    selectedCategoryIconTint?: string
  }
}

type CategoryListActions = {
  updateCategory: (newCateory: string, index: number) => void
}

const CategoryList = React.forwardRef<
  CategoryListActions,
  CategoryListInterface
>((
  { theme, onCategorySelected, style }, ref) => {
  const [activeCategory, setActiveCategory] = useState('people');

  useImperativeHandle(ref, () => {
    return {
      updateCategory: updateCategory
    }
  });
  const updateCategory = (newCategory, index) => {
    setActiveCategory(newCategory);
  }

  return (
    <>
      {
        Emojis.map((value, index) => {
          let emojiCategory = Object.values(value)[0];
          return (
            <TouchableOpacity
              style={[Styles.getListStyle]}
              key={emojiCategory.id}
              onPress={() => {
                onCategorySelected && onCategorySelected(emojiCategory.id, index);
              }}
            >
              <Image
                style={{
                  tintColor: activeCategory == emojiCategory.id
                    ? (style?.selectedCategoryIconTint || theme?.palette?.getPrimary())
                    : (style?.categoryIconTint || theme?.palette?.getAccent600()),
                }}
                source={emojiCategory.symbol}
              />
            </TouchableOpacity>
          );
        })
      }
    </>
  )
});

/**
 *
 * CometChatEmojiKeyboard is a component that fetch emoji from emjis file and displays emoji
 * in the CometChatListItem component.
 *
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatEmojiKeyboard = (props: EmojiKeyboardConfiguration) => {
  const theme: CometChatTheme = new CometChatTheme(props?.theme ?? {});

  const { onClick, style } = props;

  const {
    categoryBackground,
    categoryIconTint,
    sectionHeaderColor,
    sectionHeaderFont,
    selectedCategoryIconTint,
    backgroundColor,
    height,
    width
  } = style;

  const emojiRef = useRef(null);
  const categoryRef = useRef(null);

  const changeCategory = (id, index) => {
    if (index != undefined && index >= 0)
      emojiRef.current.scrollToIndex({ index, animated: true });
  };

  const handleEvent = (emoji: string) => {
    onClick && onClick(emoji);
  };

  const emojiRender = useCallback(({ item }) => {
    return (
      <TouchableOpacity
        onPress={handleEvent.bind(this, item.char)}
        style={[
          Styles.listStyle,
          {
            backgroundColor:
              backgroundColor ||
              theme?.palette?.getBackgroundColor(),
          },
        ]}
      >
        <Text
          style={[
            theme?.typography?.heading,
            {
              color: theme?.palette?.getPrimary(),
            },
          ]}
        >
          {item.char}
        </Text>
      </TouchableOpacity>
    );
  }, []);

  const emojiListRender = useCallback(({ item }) => {
    let keys = Object.keys(item);
    const { id, name, emojis } = item[keys[0]];
    let emojiList = Object.values(emojis);

    return (
      <View key={id} style={Styles.emojiCategoryWrapper}>
        <Text
          style={[
            Styles.emojiCategoryTitle,
            theme?.typography?.caption1,
            sectionHeaderFont,
            { color: sectionHeaderColor || theme?.palette?.getAccent500() },
          ]}
        >
          {name}
        </Text>

        <FlatList
          numColumns={8}
          initialNumToRender={10}
          data={emojiList}
          renderItem={emojiRender}
        />
      </View>
    );
  }, []);

  const categoryKeyExtractor = useCallback((item) => {
    let id = item[Object.keys(item)[0]].id;
    return id;
  }, []);

  return (
    <View
      style={[
        Styles.emojiContainerStyle,
        {
          width: width,
          height: height,
          backgroundColor:
            backgroundColor ||
            theme?.palette?.getBackgroundColor(),
        },
      ]}
    >
      <FlatList
        ref={emojiRef}
        initialNumToRender={1}
        keyExtractor={categoryKeyExtractor}
        style={[
          Styles.scrollViewStyle,
          {
            marginTop: 10,
          },
        ]}
        data={emojiValues}
        viewabilityConfig={viewConfig}
        onViewableItemsChanged={({ changed, viewableItems }) => {
          let changedItem = changed[0];
          if (changedItem.isViewable) {
            categoryRef.current?.updateCategory(changedItem.key);
          }
        }}
        windowSize={50}
        onScrollToIndexFailed={(error) => { }}
        renderItem={emojiListRender}
      />
      <View
        style={[
          Styles.emojiTabLsitStyle,
          {
            width: width,
            backgroundColor:
              categoryBackground ||
              theme?.palette?.getBackgroundColor(),
          },
        ]}
      >
        <CategoryList
          ref={categoryRef}
          theme={theme}
          onCategorySelected={(id, index) => changeCategory(id, index)}
          style={{
            categoryIconTint: categoryIconTint,
            selectedCategoryIconTint: selectedCategoryIconTint,
          }}
        />
      </View>
    </View>
  );
};

// Specifies the default values for props:
CometChatEmojiKeyboard.defaultProps = {
  // hideSearch: false,
  onClick: () => { },
  style: {
    width: '100%',
    height: 310,
    border: {},
    borderRadius: 8,
  },
};

CometChatEmojiKeyboard.propTypes = {
  // hideSearch: PropTypes.bool,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export { CometChatEmojiKeyboard };
