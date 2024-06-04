
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "VideoManager.h"
#import <QuickLook/QuickLook.h>
#import <React/RCTUtils.h>

@implementation CometChatVideoManager {
    NSString *_videoUrl;
}

RCT_EXPORT_MODULE(VideoManager);

-(void) openMedia:(NSString *) path {
            dispatch_async(dispatch_get_main_queue(), ^{
                QLPreviewController* previewCtrl = [[QLPreviewController alloc] init];
                [previewCtrl setDataSource: self];
                [[previewCtrl navigationController] setTitle:@""];
                [previewCtrl setModalPresentationStyle:UIModalPresentationPopover];
                UIViewController *presentedViewController = RCTPresentedViewController();
                [presentedViewController presentViewController:previewCtrl animated:YES completion:nil];
            });
}

RCT_EXPORT_METHOD(play:(NSString *) urlToDownload name:(NSString *) name callback:(RCTResponseSenderBlock) callback) {
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
                        [[NSFileManager defaultManager] moveItemAtURL:location toURL:destinationFileURL error:nil];
                        self->_videoUrl = filePath;
                        callback(@[filePath]);
                        return;
                    }
                    callback(@[@""]);
                }] resume];
            }
        });
}

@end
