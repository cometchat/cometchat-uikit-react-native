// VideoPickerModule.m

#import "VideoPickerModule.h"
#import <React/RCTLog.h>
#import <MobileCoreServices/MobileCoreServices.h>
@interface VideoPickerModule () <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@property (nonatomic, copy) RCTResponseSenderBlock callback;

@end
@implementation VideoPickerModule

RCT_EXPORT_MODULE(VideoPickerModule);

RCT_EXPORT_METHOD(pickVideo:(RCTResponseSenderBlock)callback)
{
    RCTLogInfo(@"Picking video");
  
    dispatch_async(dispatch_get_main_queue(), ^{
        UIImagePickerController *picker = [[UIImagePickerController alloc] init];
        picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
        picker.mediaTypes = @[(NSString*)kUTTypeMovie];
        picker.delegate = self;
      
        // Get the application's root view controller
        UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
        
        // Check if the root view controller is presenting another view controller
        while (rootViewController.presentedViewController) {
            // If so, use it as the rootViewController to present the picker
            rootViewController = rootViewController.presentedViewController;
        }
        
        // Now present the picker
        [rootViewController presentViewController:picker animated:YES completion:nil];
        
        // Store the callback for later use
        self.callback = callback;
    });
}

#pragma mark - UIImagePickerControllerDelegate
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<NSString *,id> *)info {
    NSURL *videoURL = [info objectForKey:UIImagePickerControllerMediaURL];

    // Remove the 'trim.' prefix and any trailing period '.' from the file name
    NSString *fileName = [[videoURL lastPathComponent] stringByDeletingPathExtension];
    if ([fileName hasPrefix:@"trim."]) {
        fileName = [fileName substringFromIndex:5]; // Remove the 'trim.' prefix
    }
    NSString *fileType = [videoURL pathExtension];
    NSString *tempPath = [videoURL path];

    // Copy the file to the application's document directory
    NSString *documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    NSString *destinationFileName = [NSString stringWithFormat:@"%@.%@", fileName, fileType];
    NSString *destinationPath = [documentsDirectory stringByAppendingPathComponent:destinationFileName];
    NSURL *destinationURL = [NSURL fileURLWithPath:destinationPath];

    NSError *error;
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    // Check if file exists at destination, remove it if it does
    if ([fileManager fileExistsAtPath:destinationPath]) {
        [fileManager removeItemAtPath:destinationPath error:&error];
        if (error) {
            RCTLogError(@"Error removing existing file at destination: %@", error.localizedDescription);
            self.callback(@[@"Could not remove existing file at destination", [NSNull null]]);
            [picker dismissViewControllerAnimated:YES completion:nil];
            return;
        }
    }
    
    // Copy file from temporary location to documents directory
    if ([fileManager copyItemAtPath:tempPath toPath:destinationPath error:&error]) {
        // Constructing file URI with "file://" prefix
        NSString *fileURI = destinationURL.absoluteString;

        // Pass the video info to the callback
        self.callback(@[@{@"name": destinationFileName, @"type": fileType, @"uri": fileURI}]);
    } else {
        RCTLogError(@"Error copying temporary file to destination: %@", error.localizedDescription);
        self.callback(@[error.localizedDescription, [NSNull null]]);
    }
    
    [picker dismissViewControllerAnimated:YES completion:nil];
}


- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
    [picker dismissViewControllerAnimated:YES completion:nil];
}

@end
