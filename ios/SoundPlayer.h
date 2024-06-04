#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>

@interface CometChatSoundPlayer : RCTEventEmitter <AVAudioPlayerDelegate, RCTBridgeModule>

@end
