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
        webViewController.view.backgroundColor = [UIColor whiteColor];
        
        // Create a web view with CGRectZero — Auto Layout will size it
        WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectZero];
        webView.translatesAutoresizingMaskIntoConstraints = NO;
        [webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:url]]];
        
        // Add the web view to the view controller's view
        [webViewController.view addSubview:webView];
        
        // Constrain to safe area layout guide so content respects notch and home indicator
        UILayoutGuide *safeArea = webViewController.view.safeAreaLayoutGuide;
        [NSLayoutConstraint activateConstraints:@[
            [webView.topAnchor constraintEqualToAnchor:safeArea.topAnchor],
            [webView.bottomAnchor constraintEqualToAnchor:safeArea.bottomAnchor],
            [webView.leadingAnchor constraintEqualToAnchor:safeArea.leadingAnchor],
            [webView.trailingAnchor constraintEqualToAnchor:safeArea.trailingAnchor]
        ]];
        
        // Present the web view controller
        UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
        [rootViewController presentViewController:webViewController animated:YES completion:^{
            // code on completion
        }];
    });
}


@end
