#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <QuickLook/QuickLook.h>

@interface CometChatFileManager : RCTEventEmitter <RCTBridgeModule, QLPreviewControllerDataSource, QLPreviewControllerDelegate>

@end
