require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-cometchat-ui-kit"
  s.version      = package["version"]
  s.summary      = package["description"][0...140]  # Shorten summary to max 140 characters
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"].is_a?(Hash) ? [package["author"]] : package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/cometchat/cometchat-uikit-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.static_framework = true  # Set static_framework for the main spec if needed
  s.frameworks = ["PhotosUI"]

  s.subspec "Video" do |ss|
    ss.source_files  = "ios/Video/*.{h,m}"
  end
  
  s.subspec "VideoCaching" do |ss|
    ss.dependency "react-native-cometchat-ui-kit/Video"
    ss.dependency "SPTPersistentCache", "~> 1.1.0"
    ss.dependency "DVAssetLoaderDelegate", "~> 0.3.1"

    ss.source_files = "ios/VideoCaching/**/*.{h,m}"
  end

  # React Native's own helper wires up React-Core and the New Architecture
  # dependencies and flags (RN 0.71+). It replaces the hand-rolled
  # RCT_NEW_ARCH_ENABLED block, which stopped meaning anything in RN 0.82.
  install_modules_dependencies(s)
end