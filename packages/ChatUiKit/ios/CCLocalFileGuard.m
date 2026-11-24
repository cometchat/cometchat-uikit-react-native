#import "CCLocalFileGuard.h"
#include <limits.h>
#include <stdlib.h>

BOOL CCUIKitIsFileURL(NSURL *url) {
    return url != nil && url.scheme != nil && [url.scheme caseInsensitiveCompare:@"file"] == NSOrderedSame;
}

NSArray<NSString *> *CCUIKitOfflineMediaRoots(void) {
    NSString *documents = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
    return documents.length > 0 ? @[[documents stringByAppendingPathComponent:@"cometchat/media"]] : @[];
}

// realpath(3): `..` and every symlink resolved, or nil when the path does not exist.
static NSString *CCUIKitResolvedPath(NSString *path) {
    if (path.length == 0) return nil;
    char resolved[PATH_MAX];
    if (realpath(path.fileSystemRepresentation, resolved) == NULL) return nil;
    return [[NSFileManager defaultManager] stringWithFileSystemRepresentation:resolved length:strlen(resolved)];
}

NSString *CCUIKitConfinedLocalFilePath(NSURL *url, NSArray<NSString *> *roots) {
    if (!CCUIKitIsFileURL(url)) return nil;
    NSString *source = CCUIKitResolvedPath(url.path);
    if (source == nil) return nil;
    BOOL isDir = YES;
    if (![[NSFileManager defaultManager] fileExistsAtPath:source isDirectory:&isDir] || isDir) return nil;
    for (NSString *root in roots) {
        NSString *base = CCUIKitResolvedPath(root);
        if (base.length <= 1) continue; // a missing root, or "/", allows nothing
        if ([source hasPrefix:[base stringByAppendingString:@"/"]]) return source;
    }
    return nil;
}
