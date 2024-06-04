#import "TimeZoneCodeManager.h"
#import <React/RCTUtils.h>

@implementation TimeZoneCodeManager {
    
}

// This macro makes the module available to JavaScript
RCT_EXPORT_MODULE(TimeZoneCodeManager);

// Export your method to JavaScript using RCT_EXPORT_METHOD
RCT_EXPORT_METHOD(getCurrentTimeZone:(RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // Get the time zone string
        NSString *timeZone = [[NSTimeZone localTimeZone] name];

        // Call the callback block with the time zone string
        callback(@[timeZone]);
    });
}

@end
