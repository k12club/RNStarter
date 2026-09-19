import UIKit
import React
import RNBootSplash
import React_RCTAppDelegate
import ReactAppDependencyProvider

/**
 * iOS 27 SDK (Xcode 27) ไม่ยอมเปิดแอปที่ไม่ใช้ UIScene lifecycle
 * (crash ที่ _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption)
 * แต่ template ของ React Native ถึง 0.87 ยังใช้ AppDelegate + window แบบเดิม
 *
 * จึงแยกเป็น:
 * - AppDelegate  สร้าง React Native factory ครั้งเดียวตอนเปิดแอป
 * - SceneDelegate สร้าง UIWindow จาก UIWindowScene แล้วเริ่ม React Native ในนั้น
 *   (ประกาศ UIApplicationSceneManifest ใน Info.plist อย่างเดียวไม่พอ จะได้จอดำ)
 *
 * SceneDelegate อยู่ในไฟล์นี้เพื่อไม่ต้องแก้ project.pbxproj (rename โปรเจกต์ได้ปกติ)
 * ลบ workaround นี้เมื่อ template ของ React Native รองรับ UIScene เอง
 */
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

    return true
  }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    // ระบบอาจตัด scene ทิ้งตอนอยู่เบื้องหลังแล้วต่อใหม่ (process ยังอยู่):
    // ใช้หน้าจอ React Native เดิม ไม่เริ่มใหม่ซ้อนอีกชุด
    if let existingRoot = appDelegate.window?.rootViewController {
      appDelegate.window = window
      window.rootViewController = existingRoot
      window.makeKeyAndVisible()
      return
    }

    // โค้ดบางส่วนของ RN / library ยังอ่าน application.delegate.window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "RNStarter",
      in: window,
      launchOptions: Self.launchOptions(from: connectionOptions)
    )
  }

  // Deep link ตอนแอปเปิดอยู่แล้ว: rnstarter://...
  // (ภายใต้ scene lifecycle iOS ไม่เรียก application(_:open:options:) ของ AppDelegate)
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
      return
    }
    RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }

  // Universal link ตอนแอปเปิดอยู่แล้ว (ต้องตั้ง Associated Domains เพิ่ม)
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  /**
   * แอปถูกเปิดจาก link (cold start): URL มากับ connectionOptions ไม่ใช่ launchOptions
   * แปลงกลับเป็น launchOptions เพื่อให้ Linking.getInitialURL() ฝั่ง JS อ่านได้เหมือนเดิม
   */
  private static func launchOptions(
    from connectionOptions: UIScene.ConnectionOptions
  ) -> [UIApplication.LaunchOptionsKey: Any] {
    var options: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      options[.url] = url
    }
    if let activity = connectionOptions.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }) {
      options[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ]
    }
    return options
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  // react-native-bootsplash: แสดง BootSplash.storyboard จนกว่า JS จะเรียก BootSplash.hide()
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
