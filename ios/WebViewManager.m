#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import <React/RCTViewManager.h>
#import "WebViewManager.h"
#import <UIKit/UIKit.h>

@implementation WebViewManager

RCT_EXPORT_MODULE(WebViewManager);

RCT_EXPORT_METHOD(openUrl: (NSString *) url) {
    dispatch_async(dispatch_get_main_queue(), ^{
        
        // Create a web view controller
        UIViewController *webViewController = [[UIViewController alloc] init];
        
        // Create a web view
        WKWebView *webView = [[WKWebView alloc] initWithFrame:webViewController.view.bounds];
        [webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:url]]];
        
        // Add the web view to the view controller's view
        [webViewController.view addSubview:webView];
        
        // Present the web view controller
        UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
        [rootViewController presentViewController:webViewController animated:YES completion:^{
            // code on completion
        }];
    });
}


@end
