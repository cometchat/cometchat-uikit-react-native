#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CometChatClipboardModule, NSObject)

RCT_EXTERN_METHOD(setRichText:(nonnull NSString *)plain
                  wire:(nonnull NSString *)wire
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hasImageInClipboard:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getClipboardImage:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
