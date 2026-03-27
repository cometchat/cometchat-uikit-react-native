#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "FileManager.h"
#import <QuickLook/QuickLook.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <AVFoundation/AVFoundation.h>

static NSString *const E_DOCUMENT_PICKER_CANCELED = @"DOCUMENT_PICKER_CANCELED";
static NSString *const E_INVALID_DATA_RETURNED = @"INVALID_DATA_RETURNED";

static NSString *const OPTION_TYPE = @"type";
static NSString *const OPTION_MULTIPLE = @"allowMultiSelection";

static NSString *const FIELD_URI = @"uri";
static NSString *const FIELD_FILE_COPY_URI = @"fileCopyUri";
static NSString *const FIELD_COPY_ERR = @"copyError";
static NSString *const FIELD_NAME = @"name";
static NSString *const FIELD_TYPE = @"type";
static NSString *const FIELD_SIZE = @"size";


@interface CometChatFileManager () <UIDocumentPickerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate, AVAudioRecorderDelegate, AVAudioPlayerDelegate, UIDocumentInteractionControllerDelegate>

@property (nonatomic, strong) AVAudioSession *recordingSession;
@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, strong) NSURL *audioFilename;
@property (nonatomic, assign) CMTime lastPlaybackTime;
@property (nonatomic, strong) NSDateFormatter *dateFormatter;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, strong) AVAudioPlayer *player;
@property (nonatomic, strong) UIDocumentInteractionController *documentController;

// Segment-based recording properties
@property (nonatomic, strong) NSMutableArray<NSURL *> *segmentPaths;
@property (nonatomic, assign) NSInteger currentSegmentIndex;
@property (nonatomic, strong) AVQueuePlayer *queuePlayer;
@property (nonatomic, strong) id playbackObserver;

@end

@implementation CometChatFileManager {
    NSString *_url;
    RCTResponseSenderBlock callback;
    bool hasListeners;
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"opening", @"downloading", @"status", @"downloadComplete", @"audioAmplitude"];
}

RCT_EXPORT_MODULE(FileManager)

RCT_EXPORT_METHOD(checkAndDownload:(NSString *) urlToDownload name:(NSString *) name callback:(RCTResponseSenderBlock) callback) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSURL  *url = [NSURL URLWithString:urlToDownload];
        NSData *urlData = [NSData dataWithContentsOfURL:url];
        if (urlData)
        {
            NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
            NSString *documentsDirectory = [paths objectAtIndex:0];
            
            NSString *filePath = [NSString stringWithFormat:@"file://%@/%@", documentsDirectory,name];
            NSURL *destinationFileURL = [NSURL URLWithString:filePath];
            
            NSURL *url = [NSURL URLWithString:urlToDownload];
            [[[NSURLSession sharedSession] downloadTaskWithURL:url completionHandler:^(NSURL * _Nullable location, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                if (error == nil) {
                    NSLog(@"down moving %@ to %@", location, destinationFileURL);
                    [[NSFileManager defaultManager] moveItemAtURL:location toURL:destinationFileURL error:nil];
                    NSLog(@"downloaded to %@", filePath);
                    self->_url = filePath;
                    NSString *response = [NSString stringWithFormat:@"{\"success\": true, \"filePath\":%d}", filePath];
                    callback(@[response]);
                    return;
                }
                callback(@[@""]);
            }] resume];
        }
    });
}

- (void) openMedia:(NSString *) path {
    dispatch_async(dispatch_get_main_queue(), ^{
        QLPreviewController* previewCtrl = [[QLPreviewController alloc] init];
        [previewCtrl setDataSource: self];
        [[previewCtrl navigationController] setTitle:@""];
        [previewCtrl setModalPresentationStyle:UIModalPresentationPopover];
        UIViewController *presentedViewController = RCTPresentedViewController();
        [presentedViewController presentViewController:previewCtrl animated:YES completion:nil];
    });
}

RCT_EXPORT_METHOD(doesFileExist:(NSString *)fileName callback:(RCTResponseSenderBlock)callback) {
    // Get the document directory path
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    NSString *filePath = [documentsDirectory stringByAppendingPathComponent:fileName];
    
    // Check if the file exists
    BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:filePath];
    
    // Call the callback with the result
    if (exists) {
        callback(@[@"{\"exists\": true}"]);
    } else {
        callback(@[@"{\"exists\": false}"]);
    }
}


RCT_EXPORT_METHOD(openFile:(NSString *) url name:(NSString *) fileName myCallback:(RCTResponseSenderBlock)callback) {
    //new way
    @try {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths objectAtIndex:0];
        NSString *filepath = [NSString stringWithFormat:@"%@/%@", documentsDirectory, fileName];
        if ([[NSFileManager defaultManager] fileExistsAtPath: filepath isDirectory:false]) {
            self->_url = [NSString stringWithFormat:@"file://%@",filepath];
            if (hasListeners)
                [self sendEventWithName:@"status" body:@{@"url": url, @"state": @"opening"}];
            [self openMedia:self->_url];
            callback(@[@"{\"success\": true}"]);
        } else {
            if (hasListeners)
                [self sendEventWithName:@"status" body:@{@"url": url, @"state": @"downloading"}];
            [self checkAndDownload:url name:fileName callback:^(NSArray *response) {
                self->_url = [NSString stringWithFormat:@"%@",response[0]];
                [self openMedia:self->_url];
                if (self->hasListeners)
                    [self sendEventWithName:@"status" body:@{@"url": url, @"state": @"opening"}];
                callback(@[@"{\"success\": true}"]);
            }];
        }
    } @catch (NSException *exception) {
        NSLog(@"down got exception %@", [exception description]);
        callback(@[@"{\"error\": true}"]);
    }
}

RCT_EXPORT_METHOD(openFileWithOption:(NSString *)fileName callback:(RCTResponseSenderBlock)callback) {
    @try {
        // Get the Downloads directory path
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths objectAtIndex:0];
        NSString *filePath = [documentsDirectory stringByAppendingPathComponent:fileName];

        // Check if the file exists
        if (![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
            callback(@[@"{\"success\": false, \"error\": \"File not found\"}"]);
            return;
        }

        // Get the file URL
        NSURL *fileURL = [NSURL fileURLWithPath:filePath];
        
        // Get the MIME type
        NSString *mimeType = [self getMimeTypeFromPath:filePath];
        RCTLogInfo(@"openFileWithOption: MIMETYPE %@ %@", mimeType, fileName);

        dispatch_async(dispatch_get_main_queue(), ^{
            // Initialize and present UIDocumentInteractionController
            self.documentController = [UIDocumentInteractionController interactionControllerWithURL:fileURL];
            self.documentController.delegate = self;
            self.documentController.UTI = mimeType;
            
            UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
            
            BOOL presented = [self.documentController presentOptionsMenuFromRect:CGRectZero inView:rootViewController.view animated:YES];

            if (presented) {
                callback(@[@"{\"success\": true}"]);
            } else {
                callback(@[@"{\"success\": false, \"error\": \"No app available\"}"]);
            }
        });

    } @catch (NSException *exception) {
        callback(@[[NSString stringWithFormat:@"{\"success\": false, \"error\": \"%@\"}", exception.reason]]);
    }
}

// Function to get MIME type
- (NSString *)getMimeTypeFromPath:(NSString *)filePath {
    NSString *fileExtension = [filePath pathExtension];
    CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)fileExtension, NULL);
    CFStringRef mimeType = UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
    CFRelease(UTI);
    
    if (!mimeType) {
        return @"public.data"; // Default type if unknown
    }
    
    return (__bridge_transfer NSString *)mimeType;
}

- (NSInteger)numberOfPreviewItemsInPreviewController:(QLPreviewController *)controller {
    return 1;
}

- (id <QLPreviewItem>)previewController:(QLPreviewController *)controller previewItemAtIndex:(NSInteger)index {
    return [NSURL URLWithString:_url];
}

- (BOOL)previewController:(QLPreviewController *)controller shouldOpenURL:(NSURL *)url forPreviewItem:(id <QLPreviewItem>)item {
    return YES;
}

RCT_EXPORT_METHOD(requestResourcesPermission:(NSArray *)resourceTypes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    __block NSUInteger permissionsToCheckCount = resourceTypes.count;
    NSMutableDictionary *permDict = [NSMutableDictionary new];
    for (NSString *resourceType in resourceTypes) {
        NSString *mediaType;
        if ([resourceType isEqualToString:@"camera"]) {
            mediaType = AVMediaTypeVideo;
        } else if ([resourceType isEqualToString:@"mic"]) {
            mediaType = AVMediaTypeAudio;
        } else {
            reject(@"INVALID_RESOURCE_TYPE", @"Invalid resource type requested", nil);
            return;
        }
        [AVCaptureDevice requestAccessForMediaType:mediaType completionHandler:^(BOOL granted) {
            NSNumber *authStatusObj = granted ? @(AVAuthorizationStatusAuthorized) : @(AVAuthorizationStatusDenied);
            permDict[resourceType] = authStatusObj;
            
            permissionsToCheckCount--;
            if (permissionsToCheckCount == 0) {
                resolve(permDict);
            }
        }];
    }
}

RCT_EXPORT_METHOD(checkResourcesPermission:(NSArray *)resourceTypes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    NSMutableDictionary *permDict = [NSMutableDictionary new];
    
    for (NSString *resourceType in resourceTypes) {
        NSString *mediaType = AVMediaTypeVideo;
        if ([resourceType isEqualToString:@"camera"]) {
            mediaType = AVMediaTypeVideo;
        } else if ([resourceType isEqualToString:@"mic"]) {
            mediaType = AVMediaTypeAudio;
        } else {
            reject(@"INVALID_RESOURCE_TYPE", @"Invalid resource type requested", nil);
            return;
        }
        
        AVAuthorizationStatus authStatusCamera = [AVCaptureDevice authorizationStatusForMediaType:mediaType];

        NSNumber *authStatusCameraObj = @(authStatusCamera);
        
        permDict[resourceType] = authStatusCameraObj;
    }
    
    resolve(permDict);
}

RCT_EXPORT_METHOD(openCamera: (NSString *) type callback:(RCTResponseSenderBlock) call) {
    callback = call;
    UIViewController *presentedViewController = RCTPresentedViewController();
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([UIImagePickerController isSourceTypeAvailable: UIImagePickerControllerSourceTypeCamera]) {
            UIImagePickerController *imageController = [[UIImagePickerController alloc] init];
            imageController.delegate = self;
            imageController.title = @"Select an image";
            imageController.sourceType = UIImagePickerControllerSourceTypeCamera;
            [presentedViewController presentViewController:imageController animated:YES completion:nil];
        } else {
            NSMutableString *myMutableString = [NSMutableString stringWithString:@"Camera not available"];
            if (TARGET_IPHONE_SIMULATOR) {
                [myMutableString setString:@"Camera not available in simulator"];
            }
            UIAlertController* alertController = [UIAlertController alertControllerWithTitle:@"Error"
                                            message:myMutableString
                                            preferredStyle:UIAlertControllerStyleAlert];

            UIAlertAction* okAction = [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault
            handler:^(UIAlertAction * action) {
                // Action when OK button is pressed
            }];

            [alertController addAction:okAction];

            [presentedViewController presentViewController:alertController animated:YES completion:nil];
        }
    });
}

RCT_EXPORT_METHOD(openFileChooser:(NSString *)type callback:(RCTResponseSenderBlock)call) {
    callback = call;
    UIViewController *presentedViewController = RCTPresentedViewController();

    dispatch_async(dispatch_get_main_queue(), ^{
        if ([@"image" isEqualToString:type]) {
            UIImagePickerController *imageController = [[UIImagePickerController alloc] init];
            imageController.delegate = self;
            imageController.title = @"Select an image";
            imageController.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
            [presentedViewController presentViewController:imageController animated:YES completion:nil];
        } else {
            NSArray *documentTypes;

            if ([@"audio" isEqualToString:type]) {
                documentTypes = @[@"public.audio"];
            } else if ([@"video" isEqualToString:type]) {
                documentTypes = @[@"public.movie", @"public.video"];
            } else if ([@"text" isEqualToString:type]) {
                documentTypes = @[@"public.text"];
            } else if ([@"zip" isEqualToString:type]) {
                documentTypes = @[@"com.pkware.zip-archive"];
            } else {
                // Fallback to general types (if needed)
                documentTypes = @[@"public.data"];
            }

            UIDocumentPickerViewController *documentController =
                [[UIDocumentPickerViewController alloc] initWithDocumentTypes:documentTypes
                                                                       inMode:UIDocumentPickerModeImport];
            documentController.delegate = self;
            documentController.title = @"Select a file";
            [presentedViewController presentViewController:documentController animated:YES completion:nil];
        }
    });
}


RCT_EXPORT_METHOD(shareMessage: (NSDictionary *) shareObj myCallback:(RCTResponseSenderBlock)callback) {
    NSString *message = shareObj[@"message"];
    NSString *type = shareObj[@"type"];
    NSString *mediaName = shareObj[@"mediaName"];
    NSString *fileUrl = shareObj[@"fileUrl"];
    NSString *mimeType = shareObj[@"mimeType"];
    
    if ([type isEqualToString:@"text"]) {
        [self shareMedia:message];
        callback(@[@"{\"success\": true}"]);
    } else {
        if (fileUrl) {
            NSURL *url = [NSURL URLWithString:fileUrl];
            if (url) {
                [self downloadMediaMessage:url completion:^(NSURL *fileLocation) {
                    if (fileLocation) {
                        [self shareMedia:fileLocation];
                        callback(@[@"{\"success\": true}"]);
                    }
                }];
            } else {
                NSLog(@"Url is empty");
                callback(@[@"{\"success\": false}"]);
            }
        }
    }
}

- (void)downloadMediaMessage:(NSURL *)url completion:(void (^)(NSURL *fileLocation))completion {
    NSURL *documentsDirectoryURL = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
    NSURL *destinationUrl = [documentsDirectoryURL URLByAppendingPathComponent:[url lastPathComponent]];
    
    if ([[NSFileManager defaultManager] fileExistsAtPath:[destinationUrl path]]) {
        completion(destinationUrl);
    } else {
        NSURLSessionDownloadTask *downloadTask = [[NSURLSession sharedSession] downloadTaskWithURL:url completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
            if (location && !error) {
                NSError *moveError = nil;
                [[NSFileManager defaultManager] moveItemAtURL:location toURL:destinationUrl error:&moveError];
                if (!moveError) {
                    completion(destinationUrl);
                } else {
                    completion(nil);
                }
            } else {
                completion(nil);
            }
        }];
        [downloadTask resume];
    }
}

- (void)shareMedia:(id)item {
    UIViewController *controller = RCTPresentedViewController();
    if (controller) {
        UIActivityViewController *activityViewController = [[UIActivityViewController alloc] initWithActivityItems:@[item] applicationActivities:nil];
        activityViewController.popoverPresentationController.sourceView = controller.view;
        activityViewController.excludedActivityTypes = @[UIActivityTypeAirDrop];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            [controller presentViewController:activityViewController animated:YES completion:nil];
        });
    }
}


RCT_EXPORT_METHOD(startRecording:(RCTResponseSenderBlock)callback) {
    self.recordingSession = [AVAudioSession sharedInstance];
    NSError *error = nil;
    if ([self.recordingSession setCategory:AVAudioSessionCategoryPlayAndRecord
                               withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                                     error:&error] &&
        [self.recordingSession setActive:YES error:&error]) {
        [self.recordingSession requestRecordPermission:^(BOOL granted) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (granted) {
                    //                    [self setupRecorderWithResult]; //setupRecorderWithResult
                    [self setupRecorderWithResult:callback];
                    //                    callback(@[@"{\"success\": true}"]);
                } else {
                    callback(@[@"{\"granted\": false}"]);
                    // Failed to record
                }
            });
        }];
    } else {
        // Failed to record
    }
}

RCT_EXPORT_METHOD(pauseRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.audioRecorder.isRecording) {
        [self.audioRecorder pause];
        [self stopAmplitudeTimer];
        resolve(@"success");
    } else {
        resolve(@"error");
    }
}

RCT_EXPORT_METHOD(resumeRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (![self.audioRecorder isRecording]) {
        [self.audioRecorder record];
        [self startAmplitudeTimer];
        resolve(@"success");
    } else {
        resolve(@"error");
    }
}

- (void)setupRecorderWithResult:(RCTResponseSenderBlock)callback {
    self.audioFilename = [self getFileURL];
    NSDictionary *settings = @{
        AVFormatIDKey : [NSNumber numberWithInt:kAudioFormatMPEG4AAC],
        AVSampleRateKey : [NSNumber numberWithFloat:12000.0],
        AVNumberOfChannelsKey : [NSNumber numberWithInt:1],
        AVEncoderAudioQualityKey : [NSNumber numberWithInt:AVAudioQualityHigh]
    };
    NSError *error = nil;
    self.audioRecorder = [[AVAudioRecorder alloc] initWithURL:self.audioFilename settings:settings error:&error];
    if (error) {
        [self stopRecordingWithSuccess:NO];
    } else {
        self.audioRecorder.delegate = self;
        self.audioRecorder.meteringEnabled = YES;
        [self.audioRecorder record];
        
        // Start amplitude timer for real-time waveform
        [self startAmplitudeTimer];
        
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
    }
}

- (void)startAmplitudeTimer {
    [self stopAmplitudeTimer];
    self.timer = [NSTimer scheduledTimerWithTimeInterval:0.1 repeats:YES block:^(NSTimer * _Nonnull timer) {
        if (self.audioRecorder && self.audioRecorder.isRecording && self->hasListeners) {
            [self.audioRecorder updateMeters];
            float decibels = [self.audioRecorder averagePowerForChannel:0];
            // Convert decibels to linear scale (0.0 to 1.0)
            // Decibels range from -160 (silence) to 0 (max)
            // We normalize to 0-1 range
            float linear = pow(10, decibels / 20.0);
            linear = MIN(1.0, MAX(0.0, linear));
            [self sendEventWithName:@"audioAmplitude" body:@{@"amplitude": @(linear)}];
        }
    }];
}

- (void)stopAmplitudeTimer {
    if (self.timer) {
        [self.timer invalidate];
        self.timer = nil;
    }
}

RCT_EXPORT_METHOD(stopRecordingAudio:(RCTResponseSenderBlock)callback) {
    if (self.audioRecorder != nil) {
        NSString *path = [self stopRecordingWithSuccess:YES];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", path];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
//        result(path);
    }
}

- (NSString *)stopRecordingWithSuccess:(BOOL)success {
    [self stopAmplitudeTimer];
    if (success) {
        [self.audioRecorder stop];
        self.audioRecorder = nil;
        NSError *error = nil;
        [self.recordingSession setActive:NO error:&error];
        if (error) {
            NSLog(@"Error stopping recording: %@", [error localizedDescription]);
        }
        return [self.audioFilename path];
    } else {
        return nil;
    }
}

- (NSURL *)getDocumentsDirectory {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    return [NSURL fileURLWithPath:paths[0]];
}

- (NSURL *)getFileURL {
    self.dateFormatter = [[NSDateFormatter alloc] init];
    self.dateFormatter.dateFormat = @"yyyyMMddHHmmss";
    NSURL *path = [[self getDocumentsDirectory] URLByAppendingPathComponent:[NSString stringWithFormat:@"audio-recording-%@.m4a", [self.dateFormatter stringFromDate:[NSDate date]]]];
    return path;
}

- (void)preparePlayer {
    NSError *error = nil;
    self.player = [[AVAudioPlayer alloc] initWithContentsOfURL:self.audioFilename error:&error];
    if (error) {
        self.player = nil;
        NSLog(@"AVAudioPlayer error: %@", [error localizedDescription]);
    } else {
        self.player.delegate = self;
        [self.player prepareToPlay];
        self.player.volume = 10.0;
    }
}

RCT_EXPORT_METHOD(playAudio:(RCTResponseSenderBlock)callback) {
    [self preparePlayer];
    [self.player play];
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
    NSLog(@"FILENAME: %@", jsonString);
    callback(@[jsonString]);
}

RCT_EXPORT_METHOD(pausePlaying:(RCTResponseSenderBlock)callback) {
    [self.player pause];
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
    NSLog(@"FILENAME: %@", jsonString);
    callback(@[jsonString]);
}

RCT_EXPORT_METHOD(resumePlaying:(RCTResponseSenderBlock)callback) {
    [self.player play];
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
    NSLog(@"FILENAME: %@", jsonString);
    callback(@[jsonString]);
}

/**
 * Get current playback position in milliseconds.
 * Used for accurate waveform sync during playback.
 */
RCT_EXPORT_METHOD(getPlaybackPosition:(RCTResponseSenderBlock)callback) {
    if (self.player != nil) {
        NSTimeInterval currentTime = self.player.currentTime;
        NSTimeInterval duration = self.player.duration;
        int positionMs = (int)(currentTime * 1000);
        int durationMs = (int)(duration * 1000);
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"position\": %d, \"duration\": %d}", positionMs, durationMs];
        callback(@[jsonString]);
    } else if (self.queuePlayer != nil) {
        // For queue player (segment playback)
        CMTime currentTime = self.queuePlayer.currentTime;
        int positionMs = (int)(CMTimeGetSeconds(currentTime) * 1000);
        
        // Get total duration from all items in queue
        int totalDurationMs = 0;
        for (AVPlayerItem *item in self.queuePlayer.items) {
            CMTime itemDuration = item.asset.duration;
            if (CMTIME_IS_VALID(itemDuration) && !CMTIME_IS_INDEFINITE(itemDuration)) {
                totalDurationMs += (int)(CMTimeGetSeconds(itemDuration) * 1000);
            }
        }
        
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"position\": %d, \"duration\": %d}", positionMs, totalDurationMs];
        callback(@[jsonString]);
    } else {
        callback(@[@"{\"success\": false, \"error\": \"No audio player active\"}"]);
    }
}

/**
 * Seek to a specific position in the audio playback.
 * @param positionMs Position in milliseconds
 */
RCT_EXPORT_METHOD(seekTo:(int)positionMs callback:(RCTResponseSenderBlock)callback) {
    if (self.player != nil) {
        NSTimeInterval positionSeconds = positionMs / 1000.0;
        self.player.currentTime = positionSeconds;
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"position\": %d}", positionMs];
        callback(@[jsonString]);
    } else {
        callback(@[@"{\"success\": false, \"error\": \"No audio player active\"}"]);
    }
}

/**
 * Start playback from a specific position.
 * @param positionMs Position in milliseconds to start from
 */
RCT_EXPORT_METHOD(playFromPosition:(int)positionMs callback:(RCTResponseSenderBlock)callback) {
    if (self.audioFilename == nil) {
        callback(@[@"{\"success\": false, \"error\": \"No audio file to play\"}"]);
        return;
    }
    
    [self preparePlayer];
    
    if (self.player != nil) {
        NSTimeInterval positionSeconds = positionMs / 1000.0;
        self.player.currentTime = positionSeconds;
        [self.player play];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"position\": %d}", positionMs];
        callback(@[jsonString]);
    } else {
        callback(@[@"{\"success\": false, \"error\": \"Failed to create audio player\"}"]);
    }
}

- (void)stopPlaying {
    [self.player stop];
    self.player = nil;
}

RCT_EXPORT_METHOD(releaseMediaResources:(RCTResponseSenderBlock)callback) {
    if (self.audioRecorder != nil) {
        NSTimeInterval duration = self.audioRecorder.currentTime;
        [self stopRecordingWithSuccess:YES];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\", \"duration\": %f}", [self.audioFilename path], duration];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
        return;
    }

    if (self.player != nil) {
        [self stopPlaying];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
        return;
    }
    
    callback(@[@"{\"success\": true}"]);
}

RCT_EXPORT_METHOD(deleteFile:(RCTResponseSenderBlock)callback) {
    NSString *filePath = [self.audioFilename path];
    
    if (filePath == nil) {
        callback(@[@"{\"success\": false}"]);
    } else {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSError *error;
        if ([fileManager removeItemAtPath:filePath error:&error]) {
            callback(@[@"{\"success\": true}"]);
        } else {
            NSLog(@"Error deleting file: %@", error);
            callback(@[@"{\"success\": false}"]);
        }
    }
}

#pragma mark - Segment-Based Recording Methods

/**
 * Finalize the current recording segment without stopping the recorder.
 * This allows the user to preview the recorded audio while paused.
 * @validates Requirements 11.1
 */
RCT_EXPORT_METHOD(finalizeSegment:(RCTResponseSenderBlock)callback) {
    if (self.audioRecorder == nil || !self.audioRecorder.isRecording) {
        // If not recording, check if we have a paused recording
        if (self.audioRecorder != nil) {
            NSTimeInterval duration = self.audioRecorder.currentTime;
            [self.audioRecorder stop];
            
            // Initialize segments array if needed
            if (self.segmentPaths == nil) {
                self.segmentPaths = [NSMutableArray array];
            }
            
            // Add current file to segments
            if (self.audioFilename != nil) {
                [self.segmentPaths addObject:self.audioFilename];
            }
            
            NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"segmentPath\": \"%@\", \"duration\": %f, \"segmentIndex\": %lu}", 
                [self.audioFilename path], 
                duration,
                (unsigned long)(self.segmentPaths.count - 1)];
            callback(@[jsonString]);
            return;
        }
        callback(@[@"{\"success\": false, \"error\": \"No active recording\"}"]);
        return;
    }
    
    [self stopAmplitudeTimer];
    NSTimeInterval duration = self.audioRecorder.currentTime;
    [self.audioRecorder stop];
    
    // Initialize segments array if needed
    if (self.segmentPaths == nil) {
        self.segmentPaths = [NSMutableArray array];
    }
    
    // Add current file to segments
    [self.segmentPaths addObject:self.audioFilename];
    
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"segmentPath\": \"%@\", \"duration\": %f, \"segmentIndex\": %lu}", 
        [self.audioFilename path], 
        duration,
        (unsigned long)(self.segmentPaths.count - 1)];
    callback(@[jsonString]);
}

/**
 * Start recording a new segment after pausing.
 * This creates a new audio file for the next segment.
 * @validates Requirements 11.2
 */
RCT_EXPORT_METHOD(startNewSegment:(RCTResponseSenderBlock)callback) {
    self.recordingSession = [AVAudioSession sharedInstance];
    NSError *error = nil;
    if ([self.recordingSession setCategory:AVAudioSessionCategoryPlayAndRecord
                               withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                                     error:&error] &&
        [self.recordingSession setActive:YES error:&error]) {
        
        // Create a new file for this segment
        self.audioFilename = [self getFileURL];
        
        NSDictionary *settings = @{
            AVFormatIDKey : [NSNumber numberWithInt:kAudioFormatMPEG4AAC],
            AVSampleRateKey : [NSNumber numberWithFloat:12000.0],
            AVNumberOfChannelsKey : [NSNumber numberWithInt:1],
            AVEncoderAudioQualityKey : [NSNumber numberWithInt:AVAudioQualityHigh]
        };
        
        NSError *recorderError = nil;
        self.audioRecorder = [[AVAudioRecorder alloc] initWithURL:self.audioFilename settings:settings error:&recorderError];
        
        if (recorderError) {
            callback(@[@"{\"success\": false, \"error\": \"Failed to create recorder\"}"]);
            return;
        }
        
        self.audioRecorder.delegate = self;
        self.audioRecorder.meteringEnabled = YES;
        [self.audioRecorder record];
        
        // Start amplitude timer for real-time waveform
        [self startAmplitudeTimer];
        
        // Initialize segments array if needed
        if (self.segmentPaths == nil) {
            self.segmentPaths = [NSMutableArray array];
        }
        
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\", \"segmentIndex\": %lu}", 
            [self.audioFilename path],
            (unsigned long)self.segmentPaths.count];
        callback(@[jsonString]);
    } else {
        callback(@[@"{\"success\": false, \"error\": \"Failed to setup audio session\"}"]);
    }
}

/**
 * Merge all recorded segments into a single audio file.
 * Uses AVMutableComposition for seamless audio concatenation.
 * @validates Requirements 11.4
 */
RCT_EXPORT_METHOD(mergeSegments:(NSArray<NSString *> *)segmentPaths callback:(RCTResponseSenderBlock)callback) {
    if (segmentPaths == nil || segmentPaths.count == 0) {
        callback(@[@"{\"success\": false, \"error\": \"No segments to merge\"}"]);
        return;
    }
    
    // If only one segment, just return it
    if (segmentPaths.count == 1) {
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"mergedPath\": \"%@\", \"totalDuration\": 0}", segmentPaths[0]];
        callback(@[jsonString]);
        return;
    }
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        AVMutableComposition *composition = [AVMutableComposition composition];
        AVMutableCompositionTrack *audioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
        
        CMTime currentTime = kCMTimeZero;
        Float64 totalDuration = 0;
        
        for (NSString *segmentPath in segmentPaths) {
            NSURL *segmentURL = [NSURL fileURLWithPath:segmentPath];
            AVURLAsset *asset = [AVURLAsset assetWithURL:segmentURL];
            
            NSArray *tracks = [asset tracksWithMediaType:AVMediaTypeAudio];
            if (tracks.count == 0) {
                NSLog(@"No audio track found in segment: %@", segmentPath);
                continue;
            }
            
            AVAssetTrack *assetTrack = tracks[0];
            CMTimeRange timeRange = CMTimeRangeMake(kCMTimeZero, asset.duration);
            
            NSError *error = nil;
            [audioTrack insertTimeRange:timeRange ofTrack:assetTrack atTime:currentTime error:&error];
            
            if (error) {
                NSLog(@"Error inserting track: %@", error);
                continue;
            }
            
            currentTime = CMTimeAdd(currentTime, asset.duration);
            totalDuration += CMTimeGetSeconds(asset.duration);
        }
        
        // Create output file
        NSURL *outputURL = [self getMergedFileURL];
        
        AVAssetExportSession *exportSession = [[AVAssetExportSession alloc] initWithAsset:composition presetName:AVAssetExportPresetAppleM4A];
        exportSession.outputURL = outputURL;
        exportSession.outputFileType = AVFileTypeAppleM4A;
        
        [exportSession exportAsynchronouslyWithCompletionHandler:^{
            dispatch_async(dispatch_get_main_queue(), ^{
                if (exportSession.status == AVAssetExportSessionStatusCompleted) {
                    // Update audioFilename to point to merged file
                    self.audioFilename = outputURL;
                    
                    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"mergedPath\": \"%@\", \"totalDuration\": %f}", 
                        [outputURL path], 
                        totalDuration];
                    callback(@[jsonString]);
                } else {
                    NSString *errorMsg = exportSession.error ? [exportSession.error localizedDescription] : @"Unknown error";
                    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": false, \"error\": \"%@\"}", errorMsg];
                    callback(@[jsonString]);
                }
            });
        }];
    });
}

/**
 * Play multiple segments sequentially.
 * Uses AVQueuePlayer for seamless playback.
 * @validates Requirements 11.4
 */
RCT_EXPORT_METHOD(playSegments:(NSArray<NSString *> *)segmentPaths callback:(RCTResponseSenderBlock)callback) {
    if (segmentPaths == nil || segmentPaths.count == 0) {
        callback(@[@"{\"success\": false, \"error\": \"No segments to play\"}"]);
        return;
    }
    
    // Stop any existing playback
    if (self.queuePlayer) {
        [self.queuePlayer pause];
        if (self.playbackObserver) {
            [self.queuePlayer removeTimeObserver:self.playbackObserver];
            self.playbackObserver = nil;
        }
        self.queuePlayer = nil;
    }
    
    // Create player items for each segment
    NSMutableArray<AVPlayerItem *> *playerItems = [NSMutableArray array];
    for (NSString *segmentPath in segmentPaths) {
        NSURL *segmentURL = [NSURL fileURLWithPath:segmentPath];
        AVPlayerItem *item = [AVPlayerItem playerItemWithURL:segmentURL];
        [playerItems addObject:item];
    }
    
    // Create queue player
    self.queuePlayer = [AVQueuePlayer queuePlayerWithItems:playerItems];
    self.currentSegmentIndex = 0;
    
    // Add observer for playback completion
    __weak typeof(self) weakSelf = self;
    [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification 
                                                      object:nil 
                                                       queue:[NSOperationQueue mainQueue] 
                                                  usingBlock:^(NSNotification *note) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        if (strongSelf.queuePlayer.currentItem == note.object) {
            strongSelf.currentSegmentIndex++;
            if (strongSelf.currentSegmentIndex >= segmentPaths.count) {
                // All segments played
                if (strongSelf->hasListeners) {
                    [strongSelf sendEventWithName:@"status" body:@{@"state": @"playbackComplete"}];
                }
            }
        }
    }];
    
    [self.queuePlayer play];
    
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"segmentCount\": %lu}", (unsigned long)segmentPaths.count];
    callback(@[jsonString]);
}

/**
 * Delete all segment files.
 * @validates Requirements 11.5
 */
RCT_EXPORT_METHOD(deleteSegments:(NSArray<NSString *> *)segmentPaths callback:(RCTResponseSenderBlock)callback) {
    if (segmentPaths == nil || segmentPaths.count == 0) {
        callback(@[@"{\"success\": true, \"deletedCount\": 0}"]);
        return;
    }
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSInteger deletedCount = 0;
    
    for (NSString *segmentPath in segmentPaths) {
        NSError *error = nil;
        if ([fileManager removeItemAtPath:segmentPath error:&error]) {
            deletedCount++;
        } else {
            NSLog(@"Error deleting segment: %@, error: %@", segmentPath, error);
        }
    }
    
    // Clear internal segments array
    [self.segmentPaths removeAllObjects];
    
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"deletedCount\": %ld}", (long)deletedCount];
    callback(@[jsonString]);
}

/**
 * Get all current segment paths.
 */
RCT_EXPORT_METHOD(getSegmentPaths:(RCTResponseSenderBlock)callback) {
    if (self.segmentPaths == nil || self.segmentPaths.count == 0) {
        callback(@[@"{\"success\": true, \"segments\": []}"]);
        return;
    }
    
    NSMutableArray<NSString *> *paths = [NSMutableArray array];
    for (NSURL *url in self.segmentPaths) {
        [paths addObject:[url path]];
    }
    
    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:paths options:0 error:&error];
    NSString *pathsJson = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    
    NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"segments\": %@}", pathsJson];
    callback(@[jsonString]);
}

/**
 * Clear all segments and reset state.
 */
RCT_EXPORT_METHOD(clearSegments:(RCTResponseSenderBlock)callback) {
    [self.segmentPaths removeAllObjects];
    self.currentSegmentIndex = 0;
    
    if (self.queuePlayer) {
        [self.queuePlayer pause];
        if (self.playbackObserver) {
            [self.queuePlayer removeTimeObserver:self.playbackObserver];
            self.playbackObserver = nil;
        }
        self.queuePlayer = nil;
    }
    
    callback(@[@"{\"success\": true}"]);
}

- (NSURL *)getMergedFileURL {
    self.dateFormatter = [[NSDateFormatter alloc] init];
    self.dateFormatter.dateFormat = @"yyyyMMddHHmmss";
    NSURL *path = [[self getDocumentsDirectory] URLByAppendingPathComponent:[NSString stringWithFormat:@"audio-merged-%@.m4a", [self.dateFormatter stringFromDate:[NSDate date]]]];
    return path;
}

- (NSURL *) saveImage:(NSString *) imageName image:(UIImage *) image {
    NSFileManager *defaultManager = [NSFileManager defaultManager];
    NSURL *documentUrl = [defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    if (!documentUrl) {
        return [NSURL alloc];
    }
    NSURL *fileURL = [documentUrl URLByAppendingPathComponent:imageName];

    if ([defaultManager fileExistsAtPath:fileURL.path]) {
        [defaultManager removeItemAtPath:fileURL.path error:nil];
    }
    [UIImageJPEGRepresentation(image, 1.0) writeToURL:fileURL atomically:TRUE];
    return fileURL;
}

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey, id> *)info {
    switch (picker.sourceType) {
        case UIImagePickerControllerSourceTypeCamera: {
            UIImage *image = [info valueForKey:UIImagePickerControllerOriginalImage];
            if (image) {
                NSTimeInterval interval = [[NSDate date] timeIntervalSince1970];
                NSString *subPart = [NSString stringWithFormat:@"%f", interval];
                NSString *filename = [NSString stringWithFormat:@"Image_%@.png", [subPart stringByReplacingOccurrencesOfString:@"." withString:@""]];
                NSURL *new_image_url = [self saveImage: filename image:image];
                NSString *type = [self getMimeType:new_image_url];
                NSString *name = [new_image_url lastPathComponent];
                NSString *uri = [NSString stringWithFormat:@"%@", new_image_url];
                callback(@[@{@"name": name, @"type": type, @"uri": uri}]);
            } else {
                NSLog(@"failed to get image");
                callback(@[@{@"error": @"unable to get image"}]);
            }
            break;
        }
        case UIImagePickerControllerSourceTypePhotoLibrary: {
            NSLog(@"image from photo library");
            NSURL *url = (NSURL *) [info valueForKey:UIImagePickerControllerImageURL];
            if (url) {
                NSLog(@"image path in url format : %@", url);
                NSString *name = [url lastPathComponent];
                NSString *extention = [url pathExtension];
                NSString *imageUrl = [[NSString alloc] initWithFormat:@"%@", url];
                NSString *videoUrl = [[NSString alloc] initWithFormat:@"%@", [info valueForKey:UIImagePickerControllerMediaURL]];
                NSString *fileurl;
                if (imageUrl)
                    fileurl = imageUrl;
                if (videoUrl)
                    fileurl = videoUrl;
//                NSString *type = [[NSString alloc] initWithFormat:@"%@", [info valueForKey:UIImagePickerControllerMediaType]];
                NSString *type = [self getMimeType:url];
                callback(@[@{@"name": name, @"uri": fileurl, @"type": type}]);
            } else {
                callback(@[@{@"error": @"invalid"}]);
            }
            break;
        }
        case UIImagePickerControllerSourceTypeSavedPhotosAlbum: {
            NSLog(@"image from saved photo library");
            NSString *imageUrl = [[NSString alloc] initWithFormat:@"%@", [info valueForKey:UIImagePickerControllerImageURL]];
            NSString *videoUrl = [[NSString alloc] initWithFormat:@"%@", [info valueForKey:UIImagePickerControllerMediaURL]];
            NSString *type = [[NSString alloc] initWithFormat:@"%@", [info valueForKey:UIImagePickerControllerMediaType]];
            NSURL *imgUrl = [[NSURL alloc] initWithString:imageUrl];
            NSString *name = [imgUrl lastPathComponent];
            callback(@[@{@"name": name, @"uri": imageUrl, @"type":type}]);
            break;
        }
    }
    [picker dismissViewControllerAnimated:TRUE completion:nil];
}

- (NSString *) getMimeType:(NSURL *) url {
    CFStringRef extension = (__bridge CFStringRef) url.pathExtension;
    CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(UTTagClassFilenameExtension, extension, NULL);
    CFStringRef mimeType = UTTypeCopyPreferredTagWithClass(uti, UTTagClassMIMEType);
    if (uti) {
        CFRelease(uti);
    }
    NSString *mimeTypeString = (__bridge_transfer NSString *)mimeType;
    return mimeTypeString;
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker {
    NSLog(@"image selection cancelled");
    [picker dismissViewControllerAnimated:TRUE completion:nil];
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
    NSLog(@"document selected %@", urls[0]);
    NSString *uri = [NSString stringWithFormat:@"%@", urls[0]];
    NSString *type = [self getMimeType:urls[0]];
    NSString *name = [urls[0] lastPathComponent];
    if (!name) name = @"Unknown";
    if (!type) type = @"Unknown";
    callback(@[@{@"name": name, @"type": type, @"uri": uri}]);
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    NSLog(@"document pick cancelled");
    [controller dismissViewControllerAnimated:TRUE completion:nil];
}

@end
