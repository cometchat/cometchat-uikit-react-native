#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// True when `url` has the `file` scheme, in any letter case.
FOUNDATION_EXPORT BOOL CCUIKitIsFileURL(NSURL *_Nullable url);

/// Where the offline Chat SDK keeps media: `<Documents>/cometchat/media` (its MediaFileStore root,
/// under react-native-fs's DocumentDirectoryPath).
FOUNDATION_EXPORT NSArray<NSString *> *CCUIKitOfflineMediaRoots(void);

/// The resolved path of the file behind a `file://` `url` when it may be copied out of the app: after
/// `..` and every symlink are resolved, it is a regular file strictly inside one of `roots` (the offline
/// media cache). Anything else is nil, so a message cannot name a private file of the app (its database,
/// its storage, any other file) and have it saved or shared. The caller copies the returned path, i.e.
/// exactly what was checked.
FOUNDATION_EXPORT NSString *_Nullable CCUIKitConfinedLocalFilePath(NSURL *_Nullable url, NSArray<NSString *> *roots);

NS_ASSUME_NONNULL_END
