//
//  RCTVideoPlayerViewController.h
//  RCTVideo
//
//  Created by Stanisław Chmiela on 31.03.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <AVKit/AVKit.h>
#import "CCRCTVideo.h"
#import "CCRCTVideoPlayerViewControllerDelegate.h"

@interface CCRCTVideoPlayerViewController : AVPlayerViewController
@property (nonatomic, weak) id<CCRCTVideoPlayerViewControllerDelegate> rctDelegate;

// Optional paramters
@property (nonatomic, weak) NSString* preferredOrientation;
@property (nonatomic) BOOL autorotate;

@end
