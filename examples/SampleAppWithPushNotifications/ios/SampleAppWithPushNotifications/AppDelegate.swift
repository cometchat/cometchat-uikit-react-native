import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import RNCallKeep
import PushKit
import UserNotifications
import RNCPushNotificationIOS

// Make sure you've properly bridged the RNVoipPushNotificationManager in your Swift Bridging Header
// #import "RNVoipPushNotificationManager.h"

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate {

  // MARK: - ADD A PushKit Registry property
  private var pushRegistry: PKPushRegistry?
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

    // ============================================
    // (Recommended) Register for VoIP right away
    // ============================================
    RNVoipPushNotificationManager.voipRegistration()

    // ============================================
    // Set up PushKit with desiredPushTypes = [.voIP]
    // ============================================
    pushRegistry = PKPushRegistry(queue: .main)
    pushRegistry?.delegate = self
    pushRegistry?.desiredPushTypes = [.voIP]

    // Setup user notifications center delegate
    UNUserNotificationCenter.current().delegate = self
    
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
    // Forward token to RNCPushNotificationIOS
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("⚡️[AppDelegate] didFailToRegisterForRemoteNotificationsWithError => \(error)")
    // Forward error to RNCPushNotificationIOS
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    // Forward notification to RNCPushNotificationIOS
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
  }

  // MARK: - UserNotificationCenter (for iOS 10+)

  @available(iOS 10.0, *)
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
  }

  @available(iOS 10.0, *)
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Show the notification while in foreground
    completionHandler([.alert, .badge, .sound])
  }

  // MARK: - Handle CallKit for iOS 10+ (SiriKit etc.)
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RNCallKeep.application(application, continue: userActivity) {
      (restoredObjects: [Any]?) in
        restorationHandler(restoredObjects as? [UIUserActivityRestoring])
    }
  }

  // MARK: - PKPushRegistryDelegate (VoIP Token)

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    guard type == .voIP else { return }
    let voipToken = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    print("⚡️[AppDelegate] VoIP Token updated: \(voipToken)")
    // Let RN VoipPushNotificationManager know
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    print("⚡️[AppDelegate] pushRegistry didInvalidatePushTokenFor => type: \(type)")
    print("VoIP Push Token invalidated.")
  }

  // MARK: - Handle incoming VoIP push
  func pushRegistry(
  _ registry: PKPushRegistry,
  didReceiveIncomingPushWith payload: PKPushPayload,
  for type: PKPushType,
  completion: @escaping () -> Void
) {
    // Only proceed with reporting the call if the app is not in the foreground.
    if UIApplication.shared.applicationState == .active {
        // If desired, you could still forward the push to your RN module here.
        completion()
        return
    }

    // Process the VoIP push only when the app is in background or killed.
    if type == .voIP {
        let payloadDict = payload.dictionaryPayload as? [String: Any] ?? [:]
        let callUUID = (payloadDict["uuid"] as? String) ?? UUID().uuidString

        // --- Extract relevant fields from the payload
        let callAction = payloadDict["callAction"] as? String ?? ""
        let callerNameValue = payloadDict["senderName"] as? String
            ?? payloadDict["title"] as? String
            ?? "Unknown"
        let callerName = callerNameValue
        let handle = callerNameValue
        let hasVideo = (payloadDict["callType"] as? String) != "audio"

        // --- Add RNVoipPushNotificationManager completion handler
        RNVoipPushNotificationManager.addCompletionHandler(callUUID, completionHandler: completion)

        // --- Forward the push payload to RNVoipPushNotificationManager
        RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)

        // --- Decide how to handle the call action
        if callAction == "initiated" {
            RNCallKeep.reportNewIncomingCall(
              callUUID,
              handle: handle,
              handleType: "generic",
              hasVideo: hasVideo,
              localizedCallerName: callerName,
              supportsHolding: false,
              supportsDTMF: false,
              supportsGrouping: false,
              supportsUngrouping: false,
              fromPushKit: true,
              payload: nil
            )
        } else if callAction == "unanswered" {
            RNCallKeep.endCall(withUUID: callUUID, reason: 3)
        } else if callAction == "rejected" {
            RNCallKeep.endCall(withUUID: callUUID, reason: 6)
        } else if callAction == "busy" {
            RNCallKeep.endCall(withUUID: callUUID, reason: 1)
        } else if callAction == "cancelled" {
            RNCallKeep.endCall(withUUID: callUUID, reason: 6)
        } else if callAction == "ended" {
            RNCallKeep.endCall(withUUID: callUUID, reason: 2)
        } else {
            RNCallKeep.endCall(withUUID: callUUID, reason: 3)
        }
    } else {
        completion()
    }
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

// MARK: - Static UUID Storage
extension AppDelegate {
  static var callUUID: String?
}

