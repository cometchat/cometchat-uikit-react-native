// VideoPickerModule.h

#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface VideoPickerModule : NSObject <RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>
@end