declare const require: any;

let isCallingPackageInstalled, CometChatCalls;

try {
   // Attempt to require the package
   CometChatCalls = require('@cometchat/calls-sdk-react-native')?.CometChatCalls;
   isCallingPackageInstalled = true;
   
   // If no error is thrown, the package is installed
   // console.log('calls sdk is installed.');

} catch (error) {
   isCallingPackageInstalled = false;
   // If an error is thrown, the package is not installed
   // console.log('calls sdk is not installed.');
}

export const CallingPackage = {
   isCallingPackageInstalled,
   CometChatCalls
}
