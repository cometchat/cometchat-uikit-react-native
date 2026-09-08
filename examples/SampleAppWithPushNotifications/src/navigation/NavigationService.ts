import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface PendingNavigation {
  name: keyof RootStackParamList;
  params?: any;
}

/**
 * A QUEUE, not a slot.
 *
 * This was a single `PendingNavigation | null`, so a second navigate() before the container
 * was ready overwrote the first. Deep-linking a thread notification issues two in a row —
 * Messages, then ThreadView — and the conversation underneath was being erased, leaving
 * ThreadView with nothing to go back to (or, when both were queued and only one survived,
 * nothing at all).
 */
let pendingNavigations: PendingNavigation[] = [];

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName] extends undefined
    ? undefined
    : RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    // navigationRef.navigate(name as never);
    navigationRef.navigate(name as any, params as any); 
  } else {
    // Save the navigation intent for later processing, PRESERVING order.
    pendingNavigations.push({name, params});
  }
}

export function processPendingNavigation() {
  if (!navigationRef.isReady() || pendingNavigations.length === 0) return;
  // Drain in the order they were requested, so the back stack ends up the way the caller
  // intended: conversation first, then the thread on top of it.
  const queued = pendingNavigations;
  pendingNavigations = [];
  for (const {name, params} of queued) {
    navigationRef.navigate(name as any, params as any);
  }
}
