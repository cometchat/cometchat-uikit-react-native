import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import AppErrorBoundary from './AppErrorBoundary';
import {ActiveChatProvider} from './src/utils/ActiveChatContext';
import {registerBackgroundCallTask} from '@cometchat/push-notifications-react-native';

// Lets a FULLY KILLED app reject a call declined from its notification. The package does
// the work; this only registers its background task (Android — a no-op on iOS).
registerBackgroundCallTask();

if (global?.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();

  function globalErrorHandler(error, isFatal) {
    console.log(
      '[GlobalErrorHandler]:',
      isFatal ? 'Fatal:' : 'Non-Fatal:',
      error,
    );
    defaultHandler?.(error, isFatal);
  }

  global.ErrorUtils.setGlobalHandler(globalErrorHandler);
}

if (typeof process === 'object' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.log('[Unhandled Promise Rejection]:', reason);
  });
}

const Root = () => (
  <AppErrorBoundary>
    <ActiveChatProvider>
      <App />
    </ActiveChatProvider>
  </AppErrorBoundary>
);

AppRegistry.registerComponent(appName, () => Root);