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


@interface CometChatFileManager () <UIDocumentPickerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate, AVAudioRecorderDelegate, AVAudioPlayerDelegate>

@property (nonatomic, strong) AVAudioSession *recordingSession;
@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, strong) NSURL *audioFilename;
@property (nonatomic, assign) CMTime lastPlaybackTime;
@property (nonatomic, strong) NSDateFormatter *dateFormatter;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, strong) AVAudioPlayer *player;

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
    return @[@"opening", @"downloading", @"status"];
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
                    callback(@[filePath]);
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

RCT_EXPORT_METHOD(openFile:(NSString *) url name:(NSString *) fileName myCallback:(RCTResponseSenderBlock)callback) {
    //new way
    @try {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDownloadsDirectory, NSUserDomainMask, YES);
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

- (NSInteger)numberOfPreviewItemsInPreviewController:(QLPreviewController *)controller {
    return 1;
}

- (id <QLPreviewItem>)previewController:(QLPreviewController *)controller previewItemAtIndex:(NSInteger)index {
    return [NSURL URLWithString:_url];
}

- (BOOL)previewController:(QLPreviewController *)controller shouldOpenURL:(NSURL *)url forPreviewItem:(id <QLPreviewItem>)item {
    return YES;
}

RCT_EXPORT_METHOD(openCamera: (NSString *) type callback:(RCTResponseSenderBlock) call) {
    callback = call;
    UIViewController *presentedViewController = RCTPresentedViewController();
    dispatch_async(dispatch_get_main_queue(), ^{
        UIImagePickerController *imageController = [[UIImagePickerController alloc] init];
        imageController.delegate = self;
        imageController.title = @"Select an image";
        imageController.sourceType = UIImagePickerControllerSourceTypeCamera;
        [presentedViewController presentViewController:imageController animated:YES completion:nil];
    });
}

RCT_EXPORT_METHOD(openFileChooser:(NSString *) type callback:(RCTResponseSenderBlock) call) {
    callback = call;
    UIViewController *presentedViewController = RCTPresentedViewController();
    if ([@"image" isEqualToString:type]) {
        dispatch_async(dispatch_get_main_queue(), ^{
            UIImagePickerController *imageController = [[UIImagePickerController alloc] init];
            imageController.delegate = self;
            imageController.title = @"Select an image";
            imageController.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
            [presentedViewController presentViewController:imageController animated:YES completion:nil];
        });
    } else {
        dispatch_async(dispatch_get_main_queue(), ^{
            UIDocumentPickerViewController *documentController = [[UIDocumentPickerViewController alloc] initWithDocumentTypes: @[@"public.data",@"public.content",@"public.audiovisual-content",@"public.movie",@"public.audiovisual-content",@"public.video",@"public.audio",@"public.data",@"public.zip-archive",@"com.pkware.zip-archive",@"public.composite-content",@"public.text"] inMode: UIDocumentPickerModeImport];
            documentController.delegate = self;
            documentController.title = @"Select a file";
            [presentedViewController presentViewController:documentController animated:YES completion:nil];
        });
    }
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
                    // Failed to record
                }
            });
        }];
    } else {
        // Failed to record
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
        
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
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

- (void)stopPlaying {
    [self.player stop];
    self.player = nil;
}

RCT_EXPORT_METHOD(releaseMediaResources:(RCTResponseSenderBlock)callback) {
    if (self.audioRecorder != nil || self.audioRecorder.isRecording) {
        [self stopRecordingWithSuccess:YES];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
    }

    if (self.player != nil || self.player.isPlaying) {
        [self stopPlaying];
        NSString *jsonString = [NSString stringWithFormat:@"{\"success\": true, \"file\": \"%@\"}", [self.audioFilename path]];
        NSLog(@"FILENAME: %@", jsonString);
        callback(@[jsonString]);
    }
    
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
    callback(@[@{@"name": name, @"type": type, @"uri": uri}]);
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    NSLog(@"document pick cancelled");
    [controller dismissViewControllerAnimated:TRUE completion:nil];
}

@end
