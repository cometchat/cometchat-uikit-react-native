#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "SoundPlayer.h"
#import "AVFoundation/AVFoundation.h"
#import <WebKit/WebKit.h>
#import <React/RCTUtils.h>

// AVAudioPlayer can't decode WebM/Opus — which is what browser MediaRecorder produces (the web UI Kit
// sends voice notes as WebM, sometimes under a .wav name). WebKit can, so those clips fall back to a
// hidden WKWebView <audio>. Everything AVAudioPlayer can open keeps the native path.
@interface CCWebAudioHandler : NSObject <WKScriptMessageHandler>
@property (nonatomic, copy) void (^onMessage)(NSDictionary *msg);
@end
@implementation CCWebAudioHandler
- (void)userContentController:(WKUserContentController *)ucc didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.body isKindOfClass:[NSDictionary class]] && self.onMessage) self.onMessage(message.body);
}
@end

// Duration: a MediaRecorder WebM has no duration header (audio.duration === Infinity) until you seek
// past the end, so dur() forces that seek once, then rewinds.
static NSString *const kWebAudioJS =
@"var a=new Audio();function post(m){window.webkit.messageHandlers.cc.postMessage(m)}"
"a.onended=function(){post({t:'end'})};"
"a.ontimeupdate=function(){if(!a._p)post({t:'pos',v:a.currentTime})};"
"a.onerror=function(){post({t:'err'})};"
"function dur(cb){if(isFinite(a.duration)&&a.duration>0)return cb(a.duration);a._p=true;"
"a.addEventListener('timeupdate',function h(){if(isFinite(a.duration)){a.removeEventListener('timeupdate',h);a._p=false;a.currentTime=0;cb(a.duration)}});a.currentTime=1e7}"
"function start(u,play){a.onloadedmetadata=function(){dur(function(d){post({t:'dur',v:d});"
"if(play)a.play().then(function(){post({t:'played'})}).catch(function(){post({t:'err'})})})};a.src=u;a.load()}";


@implementation CometChatSoundPlayer {
    AVAudioPlayer *audioPlayer;
    bool hasListeners;
    NSString *currentUrl;
    // WebM fallback player (see CCWebAudioHandler). Created and torn down with dispatch_sync on the
    // main queue, so the method queue never sees a half-started player (a pause right after play
    // used to find webPlayer == nil and fall through to audioPlayer).
    WKWebView *webPlayer;
    BOOL webPlaying;
    double webPosition;
    NSMutableSet<WKWebView *> *probes;
}

// Hidden web view that loads `url` and reports {t:dur|played|pos|end|err} to `onMessage`.
- (WKWebView *)webAudioFor:(NSString *)url play:(BOOL)play onMessage:(void (^)(NSDictionary *))onMessage {
    CCWebAudioHandler *handler = [CCWebAudioHandler new];
    handler.onMessage = onMessage;
    WKWebViewConfiguration *config = [WKWebViewConfiguration new];
    config.allowsInlineMediaPlayback = YES;
    config.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
    [config.userContentController addScriptMessageHandler:handler name:@"cc"];
    NSData *json = [NSJSONSerialization dataWithJSONObject:@[url] options:0 error:nil];
    NSString *arg = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding]; // ["<escaped url>"]
    NSString *js = [NSString stringWithFormat:@"%@;start(%@[0],%@);", kWebAudioJS, arg, play ? @"true" : @"false"];
    [config.userContentController addUserScript:[[WKUserScript alloc] initWithSource:js injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES]];
    WKWebView *web = [[WKWebView alloc] initWithFrame:CGRectMake(0, 0, 1, 1) configuration:config];
    web.alpha = 0.01; // in a window so WebKit doesn't throttle it, but invisible
    [RCTKeyWindow() addSubview:web];
    [web loadHTMLString:@"<html><body></body></html>" baseURL:[NSURL URLWithString:@"https://localhost/"]];
    return web;
}

- (void)stopWebPlayer {
    RCTUnsafeExecuteOnMainQueueSync(^{
        [self->webPlayer evaluateJavaScript:@"a.pause()" completionHandler:nil];
        [self->webPlayer.configuration.userContentController removeScriptMessageHandlerForName:@"cc"];
        [self->webPlayer removeFromSuperview];
        self->webPlayer = nil;
        self->webPlaying = NO;
    });
}

// One-shot duration probe for a clip AVAudioPlayer couldn't open.
- (void)probeWebDuration:(NSString *)url resolve:(RCTResponseSenderBlock)resolve {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self->probes) self->probes = [NSMutableSet new];
        __block WKWebView *probe = nil;
        __block BOOL done = NO;
        void (^finish)(int) = ^(int duration) { // main queue only; resolves once, tears the probe down
            if (done) return;
            done = YES;
            resolve(@[[NSString stringWithFormat:@"{\"duration\":%d}", duration]]);
            [probe.configuration.userContentController removeScriptMessageHandlerForName:@"cc"];
            [probe removeFromSuperview];
            [self->probes removeObject:probe];
        };
        probe = [self webAudioFor:url play:NO onMessage:^(NSDictionary *msg) {
            if ([msg[@"t"] isEqual:@"dur"]) finish([msg[@"v"] intValue]);
            else if ([msg[@"t"] isEqual:@"err"]) finish(0);
        }];
        [self->probes addObject:probe];
        // A stalled load sends neither dur nor err: give up after 10 s instead of leaking the web view.
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{ finish(0); });
    });
}

- (void)playWeb:(NSString *)url resolve:(RCTResponseSenderBlock)resolve {
    RCTUnsafeExecuteOnMainQueueSync(^{
        __block BOOL resolved = NO;
        __block int duration = 0;
        self->webPosition = 0;
        self->webPlayer = [self webAudioFor:url play:YES onMessage:^(NSDictionary *msg) {
            NSString *t = msg[@"t"];
            if ([t isEqual:@"dur"]) {
                duration = [msg[@"v"] intValue];
            } else if ([t isEqual:@"played"]) {
                self->webPlaying = YES;
                if (!resolved) { resolved = YES; resolve(@[[NSString stringWithFormat:@"{\"success\":1, \"duration\":%d}", duration]]); }
            } else if ([t isEqual:@"pos"]) {
                self->webPosition = [msg[@"v"] doubleValue];
            } else if ([t isEqual:@"end"]) {
                self->webPlaying = NO;
                if (self->hasListeners) [self sendEventWithName:@"soundPlayStatus" body:@{@"url": url}];
            } else if ([t isEqual:@"err"]) {
                if (!resolved) {
                    resolved = YES;
                    resolve(@[@"{\"success\":0, \"error\":\"Unsupported audio format\"}"]);
                } else {
                    // Failed mid-clip (e.g. network drop): end it like a finished clip so the bubble resets.
                    self->webPlaying = NO;
                    if (self->hasListeners) [self sendEventWithName:@"soundPlayStatus" body:@{@"url": url}];
                }
            }
        }];
    });
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
    if ([url hasPrefix:@"http"] || [url hasPrefix:@"file:"]) {
        // http/https AND local file:// URLs must go through URLWithString. fileURLWithPath:
        // expects a PLAIN path and mangles a file:// URL (nil data → nil AVAudioPlayer →
        // duration 0), which is why staged audio showed 00:00 on iOS. Plain paths use the else.
        nsurl = [NSURL URLWithString:url];
    } else {
        nsurl = [NSURL fileURLWithPath:url]; // plain filesystem path (no scheme)
    }
   NSData *data = [NSData dataWithContentsOfURL:nsurl];
   if ([audioPlayer isPlaying]) {
       [audioPlayer stop];
       [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
   }
   currentUrl = url;
   audioPlayer = [[AVAudioPlayer alloc] initWithData:data error:nil];
   if (!audioPlayer && data) {
       [self probeWebDuration:url resolve:resolve];
       return;
   }
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
    if ([url hasPrefix:@"http"] || [url hasPrefix:@"file:"]) {
        // http/https AND local file:// URLs must go through URLWithString. fileURLWithPath:
        // expects a PLAIN path and mangles a file:// URL (nil data → nil AVAudioPlayer →
        // duration 0), which is why staged audio showed 00:00 on iOS. Plain paths use the else.
        nsurl = [NSURL URLWithString:url];
    } else {
        nsurl = [NSURL fileURLWithPath:url]; // plain filesystem path (no scheme)
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
   if (webPlayer) {
       if (webPlaying && currentUrl) [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
       [self stopWebPlayer];
   }
   currentUrl = url;
   NSError *playerError = nil;
   audioPlayer = [[AVAudioPlayer alloc] initWithData:data error:&playerError];
   if (!audioPlayer) {
       [self playWeb:url resolve:resolve];
       return;
   }
    [audioPlayer setDelegate: self];

   int playSuccess = [audioPlayer play];
   int duration = [audioPlayer duration];
   NSString *response = [NSString stringWithFormat:@"{\"success\":%d, \"duration\":%d}", playSuccess, duration];
   resolve(@[response]);
}

// Seek to `atTime` seconds. Setting `currentTime` seeks within the clip and preserves the
// current play/pause state — unlike `playAtTime:`, which schedules future playback and does
// NOT seek. Matches Android's playAt(seconds) → seekTo().
RCT_EXPORT_METHOD(playAt:(NSInteger) atTime resolver:(RCTResponseSenderBlock)resolve) {
    bool res = NO;
    if (webPlayer) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self->webPlayer evaluateJavaScript:[NSString stringWithFormat:@"a.currentTime=%ld", (long)atTime] completionHandler:nil];
        });
        res = YES;
    } else if (audioPlayer != nil) {
        audioPlayer.currentTime = (NSTimeInterval)atTime;
        res = YES;
    }
    NSString *response = [NSString stringWithFormat:@"{\"success\":%d}",res];
    resolve(@[response]);
}

RCT_EXPORT_METHOD(resume) {
    if (webPlayer) {
        webPlaying = YES;
        dispatch_async(dispatch_get_main_queue(), ^{ [self->webPlayer evaluateJavaScript:@"a.play()" completionHandler:nil]; });
        return;
    }
    [audioPlayer play];
}

RCT_EXPORT_METHOD(getPosition:(RCTResponseSenderBlock) resolve) {
    if (webPlayer && webPlaying) {
        resolve(@[[NSString stringWithFormat:@"{\"position\":%f}", webPosition]]);
    } else if ([audioPlayer isPlaying]) {
        NSString *response = [NSString stringWithFormat:@"{\"position\":%f}", [audioPlayer currentTime]];
        resolve(@[response]);
    } else {
        resolve(@[@"Error"]);
    }
}

RCT_EXPORT_METHOD(pause: (RCTResponseSenderBlock) resolve) {
    if (webPlayer && webPlaying) {
        webPlaying = NO;
        dispatch_async(dispatch_get_main_queue(), ^{ [self->webPlayer evaluateJavaScript:@"a.pause()" completionHandler:nil]; });
        resolve(@[@"{\"success\": true}"]);
    } else if ([audioPlayer isPlaying]) {
        [audioPlayer pause];
        resolve(@[@"{\"success\": true}"]);
    } else {
        resolve(@[@"{\"success\": false}"]);
    }
}

RCT_EXPORT_METHOD(releaseMediaPlayer) {
    // Stopping a clip that is playing must say so, or its bubble stays on "playing".
    BOOL wasPlaying = (webPlayer && webPlaying) || [audioPlayer isPlaying];
    if (wasPlaying && currentUrl && hasListeners) [self sendEventWithName:@"soundPlayStatus" body:@{@"url": currentUrl}];
    if (webPlayer) [self stopWebPlayer];
    if (audioPlayer) {
        [audioPlayer stop];
        audioPlayer = nil;
    }
    currentUrl = nil;
}

RCT_EXPORT_METHOD(getCurrentTime: (RCTResponseSenderBlock)resolve) {
  if (webPlayer && webPlaying) {
      resolve(@[[NSString stringWithFormat:@"{\"time\": %f}", webPosition]]);
  } else if ([audioPlayer isPlaying]) {
      NSString *response = [NSString stringWithFormat:@"{\"time\": %f}",[audioPlayer currentTime]];
      resolve(@[response]);
  } else {
    resolve(@[@"Error"]);
  }
}

@end
