import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import react_native_cometchat_push_notifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

   var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {


    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
 
    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // VoIP pushes: @cometchat/push-notifications-react-native creates and owns the PushKit
    // registry (VoIP token + reporting incoming calls to CallKit). Must run BEFORE React
    // Native starts: a call that wakes a killed app has to reach CallKit within ~5s.
    CometChatPushNotificationsAppDelegate.registerForVoIPPushes()

    // NOTE: the package sets itself as the UNUserNotificationCenter delegate
    // (to honour showInForeground + emit notificationTapped), so the app does
    // not set one here.

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
      withModuleName: "sampleapp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

   // MARK: - Standard APNs Token Methods

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    print("⚡️[AppDelegate] didRegisterForRemoteNotificationsWithDeviceToken deviceToken => \(deviceToken)")
    CometChatPushNotificationsAppDelegate.didRegisterAPNsToken(deviceToken)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("⚡️[AppDelegate] didFailToRegisterForRemoteNotificationsWithError => \(error)")
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    CometChatPushNotificationsAppDelegate.didReceiveRemoteNotification(userInfo)
    completionHandler(.noData)
  }

}
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
