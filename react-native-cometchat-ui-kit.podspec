require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-cometchat-ui-kit"
  s.version      = package["version"]
  s.summary      = package["description"][0...140]  # Shorten summary to max 140 characters
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"].is_a?(Hash) ? [package["author"]] : package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/cometchat-pro/cometchat-pro-react-native-ui-kit.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"

  s.static_framework = true  # Set static_framework for the main spec if needed
  s.dependency "React-Core"

  s.subspec "Video" do |ss|
    ss.source_files  = "ios/Video/*.{h,m}"
  end
  
  s.subspec "VideoCaching" do |ss|
    ss.dependency "react-native-cometchat-ui-kit/Video"
    ss.dependency "SPTPersistentCache", "~> 1.1.0"
    ss.dependency "DVAssetLoaderDelegate", "~> 0.3.1"

    ss.source_files = "ios/VideoCaching/**/*.{h,m}"
  end

  # Conditional compiler flags and dependencies for the new architecture
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = "#{folly_compiler_flags} -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Header/Public/**\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
    
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
    s.dependency "RCTSlider"
  end
end