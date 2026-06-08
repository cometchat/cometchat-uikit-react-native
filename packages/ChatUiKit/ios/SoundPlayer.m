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

RCT_EXPORT_METHOD(prepareMediaPlayer:(NSString *) url
                  callback:(RCTResponseSenderBlock) resolve) {
   NSURL *nsurl;
    if ([url hasPrefix:@"http"] || [url hasPrefix:@"https"]) {
        nsurl = [NSURL URLWithString:url];
    } else {
        nsurl = [NSURL fileURLWithPath:url]; // Use fileURLWithPath for local files
    }
   NSData *data = [NSData dataWithContentsOfURL:nsurl];
   if ([audioPlayer isPlaying]) {
       [audioPlayer stop];
       [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
   }
   currentUrl = url;
   audioPlayer = [[AVAudioPlayer alloc] initWithData:data error:nil];
    [audioPlayer setDelegate: self];
   int duration = [audioPlayer duration];
   NSString *response = [NSString stringWithFormat:@"{\"duration\":%d}", duration];
   resolve(@[response]);
}

RCT_EXPORT_METHOD(play:(NSString *) url
                  callback:(RCTResponseSenderBlock) resolve) {
   // Set audio session to Playback category to ensure audio plays even in silent mode
   // Don't override if recording is active (PlayAndRecord category)
   AVAudioSession *session = [AVAudioSession sharedInstance];
   if (![session.category isEqualToString:AVAudioSessionCategoryPlayAndRecord]) {
       NSError *sessionError = nil;
       if (![session setCategory:AVAudioSessionCategoryPlayback error:&sessionError]) {
           NSString *response = [NSString stringWithFormat:@"{\"success\":0, \"error\":\"%@\"}", [sessionError localizedDescription]];
           resolve(@[response]);
           return;
       }
   }
   [session setActive:YES error:nil];

   NSURL *nsurl;
    if ([url hasPrefix:@"http"] || [url hasPrefix:@"https"]) {
        nsurl = [NSURL URLWithString:url];
    } else {
        nsurl = [NSURL fileURLWithPath:url]; // Use fileURLWithPath for local files
    }
   NSData *data = [NSData dataWithContentsOfURL:nsurl];
   if (!data) {
       resolve(@[@"{\"success\":0, \"error\":\"Failed to load audio data\"}"]);
       return;
   }
   if ([audioPlayer isPlaying]) {
       [audioPlayer stop];
       [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
   }
   currentUrl = url;
   NSError *playerError = nil;
   audioPlayer = [[AVAudioPlayer alloc] initWithData:data error:&playerError];
   if (!audioPlayer) {
       NSString *response = [NSString stringWithFormat:@"{\"success\":0, \"error\":\"%@\"}", [playerError localizedDescription]];
       resolve(@[response]);
       return;
   }
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
        NSString *response = [NSString stringWithFormat:@"{\"position\":%f}", [audioPlayer currentTime]];
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

RCT_EXPORT_METHOD(releaseMediaPlayer) {
    if (audioPlayer) {
        [audioPlayer stop];
        audioPlayer = nil;
    }
    currentUrl = nil;
}

RCT_EXPORT_METHOD(getCurrentTime: (RCTResponseSenderBlock)resolve) {
  if ([audioPlayer isPlaying]) {
      NSString *response = [NSString stringWithFormat:@"{\"time\": %f}",[audioPlayer currentTime]];
      resolve(@[response]);
  } else {
    resolve(@[@"Error"]);
  }
}

@end
