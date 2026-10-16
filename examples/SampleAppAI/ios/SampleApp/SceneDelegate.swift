import UIKit
import React
import React_RCTAppDelegate

// iOS 27 (and any app built against that SDK) requires the UIScene life cycle:
// UIKit terminates apps that still create their window in the app delegate.
// The window is owned by the scene now; AppDelegate keeps the pre-React setup
// because that still has to run before any scene connects.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    guard
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      assertionFailure("React Native factory was not created in AppDelegate")
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    // React Native reads application.delegate.window directly (RCTDeviceInfo,
    // RCTLogBoxView), so keep the app delegate pointing at the scene's window.
    appDelegate.window = window

    // startReactNative(...) assigns the root view controller and calls
    // makeKeyAndVisible, so the window does not need further setup here.
    factory.startReactNative(
      withModuleName: "ai_sample_app",
      in: window,
      launchOptions: appDelegate.launchOptions
    )
  }
}
