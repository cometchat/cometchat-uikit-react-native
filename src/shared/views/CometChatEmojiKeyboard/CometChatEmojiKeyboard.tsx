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
  ViewProps,
  TextStyle,
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
  const updateCategory = (newCategory: any, index: any) => {
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

  const emojiRef = useRef<any>(null);
  const categoryRef = useRef<any>(null);

  const changeCategory = (id: string, index: number | undefined) => {
    if (index != undefined && index >= 0)
      emojiRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleEvent = (emoji: string) => {
    onClick && onClick(emoji);
  };

  const emojiRender = useCallback(({ item }: any) => {
    return (
      <TouchableOpacity
        onPress={handleEvent.bind(this, item.char)}
        style={[
          Styles.listStyle,
          {
            backgroundColor:
              style?.backgroundColor ||
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
          ] as TextStyle}
        >
          {item.char}
        </Text>
      </TouchableOpacity>
    );
  }, []);

  const emojiListRender = useCallback(({ item }: any) => {
    let keys = Object.keys(item);
    const { id, name, emojis } = item[keys[0]];
    let emojiList = Object.values(emojis);

    return (
      <View key={id} style={Styles.emojiCategoryWrapper}>
        <Text
          style={[
            Styles.emojiCategoryTitle,
            theme?.typography?.caption1,
            style?.sectionHeaderFont,
            { color: style?.sectionHeaderColor || theme?.palette?.getAccent500() },
          ] as TextStyle}
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

  const categoryKeyExtractor = useCallback((item: any) => {
    let id = item[Object.keys(item)[0]].id;
    return id;
  }, []);

  return (
    <View
      style={[
        Styles.emojiContainerStyle,
        {
          width: style?.width,
          height: style?.height,
          backgroundColor:
            style?.backgroundColor ||
            theme?.palette?.getBackgroundColor(),
        } as ViewProps,
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
            width: style?.width,
            backgroundColor:
              style?.categoryBackground ||
              theme?.palette?.getBackgroundColor(),
          } as ViewProps,
        ]}
      >
        <CategoryList
          ref={categoryRef}
          theme={theme}
          onCategorySelected={(id, index) => changeCategory(id, index)}
          style={{
            categoryIconTint: style?.categoryIconTint,
            selectedCategoryIconTint: style?.selectedCategoryIconTint,
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
