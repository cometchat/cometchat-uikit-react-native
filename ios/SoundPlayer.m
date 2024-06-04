#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "SoundPlayer.h"
#import "AVFoundation/AVFoundation.h"


@implementation CometChatSoundPlayer {
    AVAudioPlayer *audioPlayer;
    bool hasListeners;
    NSString *currentUrl;
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"soundPlayStatus"];
}

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
    [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
}

RCT_EXPORT_MODULE(SoundPlayer)

RCT_EXPORT_METHOD(play:(NSString *) url
                  callback:(RCTResponseSenderBlock) resolve) {
   NSURL *nsurl = [NSURL URLWithString:url];
   NSData *data = [NSData dataWithContentsOfURL:nsurl];
   if ([audioPlayer isPlaying]) {
       [audioPlayer stop];
       [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
   }
   currentUrl = url;
   audioPlayer = [[AVAudioPlayer alloc] initWithData:data error:nil];
    [audioPlayer setDelegate: self];
   int playSuccess = [audioPlayer play];
   int duration = [audioPlayer duration];
    NSString *response = [NSString stringWithFormat:@"{\"success\":%d, \"duration\":%d}", playSuccess, duration];
    resolve(@[response]);
}

RCT_EXPORT_METHOD(playAt:(NSInteger) atTime resolver:(RCTResponseSenderBlock)resolve) {
    NSTimeInterval interval = (NSTimeInterval)atTime;
    bool res = [audioPlayer playAtTime:interval];
    NSString *response = [NSString stringWithFormat:@"{\"success\":%d}",res];
    resolve(@[response]);
}

RCT_EXPORT_METHOD(resume) {
    [audioPlayer play];
}

RCT_EXPORT_METHOD(getPosition:(RCTResponseSenderBlock) resolve) {
    if ([audioPlayer isPlaying]) {
        NSString *response = [NSString stringWithFormat:@"{time:%f}", [audioPlayer currentTime]];
        resolve(@[response]);
    } else {
        resolve(@[@"Error"]);
    }
}

RCT_EXPORT_METHOD(pause: (RCTResponseSenderBlock) resolve) {
    if ([audioPlayer isPlaying]) {
        [audioPlayer pause];
        resolve(@[@"{\"success\": true}"]);
    } else {
        resolve(@[@"{\"success\": false}"]);
    }
}

RCT_EXPORT_METHOD(getCurrentTime: (RCTResponseSenderBlock)resolve) {
  if ([audioPlayer isPlaying]) {
      NSString *response = [NSString stringWithFormat:@"{time: %f}",[audioPlayer currentTime]];
      resolve(@[response]);
  } else {
    resolve(@[@"Error"]);
  }
}

@end
