import {CometChat} from '@cometchat/chat-sdk-react-native';
import {useTheme, CometChatListItem} from '@cometchat/chat-uikit-react-native';
import React, {useRef, useEffect, useMemo, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import {PlayArrow} from './icons';
import {Icon} from '@cometchat/chat-uikit-react-native';
import {CallDetailHelper} from './CallDetailHelper';

const {FileManager} = NativeModules;
const eventEmitter = new NativeEventEmitter(FileManager);

export const CallRecordings = (props: {call: any}) => {
  const {call} = props;
  const [data, setData] = useState(call.getRecordings());

  const theme = useTheme();

  const loggedInUser = useRef(null);
  const downloadIdRef = useRef(0);
  const [processing, setProcessing] = React.useState(false);
  const [fileExists, setFileExists] = React.useState(false); // State to track if the file exists
  let listener: any = useRef(undefined);
  const [fileUrl, setFileUrl] = useState();
  const [reOpenCount, setReopenCount] = useState(0);

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((u: any) => {
        loggedInUser.current = u;
      })
      .catch((e: any) => {
        // onError && onError(e);
      });
  }, []);

  useEffect(() => {
    if (Platform.OS == 'android') {
      listener.current = eventEmitter.addListener(
        'downloadComplete',
        event => {
          const data = event as {downloadId: number};
          if (
            data.downloadId &&
            downloadIdRef.current &&
            data.downloadId == downloadIdRef.current
          ) {
            setProcessing(false);
            setFileExists(true);
            openFile(fileUrl);
          }
        },
      );
    }
    return () => {
      if (Platform.OS == 'android') {
        listener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!fileUrl) return;

    const fileName = getFileName(fileUrl);
    setProcessing(true);
    FileManager.doesFileExist(fileName, (result: string) => {
      setProcessing(false);
      if (JSON.parse(result).exists) {
        setFileExists(true);
        openFile(fileUrl);
      } else {
        downloadFile(fileUrl);
      }
    });
  }, [fileUrl, reOpenCount]);

  const downloadFile = (fileUrl: any) => {
    if (processing || fileExists) return; // Do not process if file already exists

    if (!fileUrl) return;

    setProcessing(true);
    FileManager.checkAndDownload(
      fileUrl,
      getFileName(fileUrl),
      (result: string) => {
        if (Platform.OS == 'ios') {
          let parsedResult = JSON.parse(result);
          if (parsedResult.success == true) {
            setProcessing(false);
            setFileExists(true);
          }
          openFile(fileUrl);
        } else if (Platform.OS == 'android') {
          downloadIdRef.current = JSON.parse(result).downloadId;
        }
      },
    );
  };

  const openFile = (fileUrl: any) => {
    if (processing) return;

    if (!fileUrl) return;

    setProcessing(true);
    FileManager.openFileWithOption(getFileName(fileUrl), (isOpened: string) => {
      setProcessing(false);
    });
  };

  const getFileName = (fileUrl: any) => {
    return fileUrl.substring(fileUrl.lastIndexOf('/') + 1).replace(' ', '_');
  };

  const _style = useMemo(() => {
    return {
      headerContainerStyle: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        borderRadius: 0,
        paddingHorizontal: 0,
      },
      titleSeparatorStyle: {
        borderBottomWidth: 1,
        borderBottomColor: theme.color.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      containerStyle: {
        backgroundColor: theme.color.background1,
        flex: 1,
      },
      itemStyle: {
        containerStyle: {
          flexDirection: 'row' as const,
          paddingHorizontal: theme.spacing.padding.p4,
          paddingVertical: theme.spacing.padding.p2,
          gap: theme.spacing.spacing.s3,
          minHeight: 72,
        },
        titleStyle: {
          color: theme.color.textPrimary,
          flex: 1,
          ...theme.typography.heading4.medium,
        },
        subtitleStyle: {
          color: theme.color.textSecondary,
          ...theme.typography.body.regular,
        },
        tailViewTextStyle: {
          color: theme.color.textPrimary,
          ...theme.typography.caption1.medium,
        },
        avatarStyle: {
          containerStyle: {},
          textStyle: {},
          imageStyle: {
            height: 48,
            width: 48,
          },
        },
      },
    };
  }, [theme]);

  const formattedInitiatedAt = useMemo(() => {
    return CallDetailHelper.getFormattedInitiatedAt(call);
  }, [call]);

  const _render = ({item, index}: any) => {
    const title = item['rid'];

    return (
      <React.Fragment key={index}>
        <CometChatListItem
          id={item.sessionId}
          title={title}
          SubtitleView={
            <Text
              style={{
                ...theme.typography.body.regular,
                color: theme.color.textSecondary,
              }}>
              {formattedInitiatedAt}
            </Text>
          }
          titleStyle={_style.itemStyle.titleStyle}
          containerStyle={_style.itemStyle.containerStyle}
          trailingViewContainerStyle={{
            alignSelf: 'center',
          }}
          TrailingView={
            <Pressable
              onPress={() => {
                setFileUrl(item.getRecordingURL());
                setReopenCount(reOpenCount + 1);
              }}>
              <Icon
                icon={
                  <PlayArrow
                    height={24}
                    width={24}
                    color={theme.color.iconHighlight}></PlayArrow>
                }
                containerStyle={{marginLeft: theme.spacing.margin.m4}}></Icon>
            </Pressable>
          }
        />
      </React.Fragment>
    );
  };

  return (
    <View style={{backgroundColor: theme.color.background1}}>
      {data.length && (
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.sessionId + '_' + index}
          renderItem={_render}
        />
      )}
    </View>
  );
};
