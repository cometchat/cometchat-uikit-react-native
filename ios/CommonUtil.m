#import "CommonUtil.h"

@implementation CometChatCommonUtil

RCT_EXPORT_MODULE(CommonUtil);

RCT_EXPORT_METHOD(getSafeAreaInsets:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 11.0, *)) {
      UIWindow *window = [[UIApplication sharedApplication] keyWindow];
      UIEdgeInsets safeInsets = window.safeAreaInsets;
      resolve(@{
        @"top" : @(safeInsets.top),
        @"bottom" : @(safeInsets.bottom),
      });
    } else {
      resolve(@{
        @"top" : @0,
        @"bottom" : @0,
      });
    }
  });
}

@end
