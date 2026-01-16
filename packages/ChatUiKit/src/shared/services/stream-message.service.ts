import { Subject, of, BehaviorSubject, Subscription } from 'rxjs';
import { concatMap, delay, tap } from 'rxjs/operators';
import * as CometChatUIKitConstants from '../constants/UIKitConstants';
import { CometChatAIAssistantTools } from '../modals/CometChatAIAssistantTools';
import { CometChat } from '@cometchat/chat-sdk-react-native';

/**
 * Interface representing streaming message data that contains both the original message event
 * and the accumulated streamed text content that has been processed so far.
 */
export interface IStreamData {
  message: CometChat.AIAssistantBaseEvent,
  streamedMessages?: string;
}

/**
 * RxJS subjects for managing message streaming
 */
const messageSubject = new Subject<IStreamData>();
const messageQueue = new Subject<{ runId: string, event: CometChat.AIAssistantBaseEvent }>();

/**
 * Completion callbacks for each runId
 * Now supports aiToolResultMessage and aiToolArgumentMessage (as any, since not in SDK typings)
 */
export type QueueCompletionCallback = (
  aiAssistantMessage?: CometChat.AIAssistantMessage,
  aiToolResultMessage?: CometChat.AIToolResultMessage,
  aiToolArgumentMessage?: CometChat.AIToolArgumentMessage
) => void;
const queueCompletionCallbacks: { [runId: string]: QueueCompletionCallback } = {};

/**
 * Store tool result and argument messages by runId
 */
let lastAIToolResultMessages: { [runId: string]: any } = {};
let lastAIToolArgumentMessages: { [runId: string]: any } = {};


/**
 * Subscription for the message processing pipeline
 */
let subscription: Subscription | null;

/**
 * Storage for accumulated content by message ID during streaming
 */
let streamedMessages: { [runId: string]: string } = {};


/**
 * Per-runId event queue, matching Android logic
 */
const eventQueues: { [runId: string]: CometChat.AIAssistantBaseEvent[] } = {};
let lastAIAssistantMessages: Array<{ runId: string, message: CometChat.AIAssistantMessage }> = [];

/**
 * Store AIAssistantMessage for a runId
 */
export const storeAIAssistantMessage = (runId: string, message: CometChat.AIAssistantMessage) => {
  const existingIndex = lastAIAssistantMessages.findIndex(item => item.runId === runId);
  if (existingIndex !== -1) {
    lastAIAssistantMessages[existingIndex].message = message;
  } else {
    lastAIAssistantMessages.push({ runId, message });
  }
  checkQueueEmptyStatus(runId);
};

/**
 * Check and trigger queue completion for a runId
 */


function checkQueueEmptyStatus(runId: string) {
  const queue = eventQueues[runId];
  if (
    queue && queue.length === 0 &&
    streamingComplete[runId] === true &&
    renderingComplete[runId] === true &&
    queueCompletionCallbacks[runId]
  ) {
    const aiMsgEntry = lastAIAssistantMessages.find(item => item.runId === runId);
    const aiMsg = aiMsgEntry?.message;
    const toolResult = lastAIToolResultMessages[runId]?.message;
    const toolArg = lastAIToolArgumentMessages[runId]?.message;
    const indexToDelete = lastAIAssistantMessages.findIndex(item => item.runId === runId);
    if (indexToDelete !== -1) {
      lastAIAssistantMessages.splice(indexToDelete, 1);
    }
    if (aiMsg || toolResult || toolArg) {
      queueCompletionCallbacks[runId](aiMsg, toolResult, toolArg);
    }
  }
}

export const checkAndTriggerQueueCompletion = (runId: string) => {
  checkQueueEmptyStatus(runId);
};

/**
 * Storage for processed deltas to prevent duplicates
 */
let processedDeltas: { [runId: string]: Set<string> } = {};

/**
 * Configurable typing speed delay for text message content chunks
 */
let streamSpeed = 30;

let toolKitActions: CometChatAIAssistantTools;

/**
 * BehaviorSubject to track streaming state
 */
const streamingStateSubject = new BehaviorSubject<boolean>(false);

/**
 * Observable stream for streaming state changes
 */
export const streamingState$ = streamingStateSubject.asObservable();

/**
 * Observable stream for message updates
 */
export const messageStream = messageSubject.asObservable();

const toolEventsMap = [
  CometChatUIKitConstants.streamMessageTypes.tool_call_args,
  CometChatUIKitConstants.streamMessageTypes.tool_call_end,
  CometChatUIKitConstants.streamMessageTypes.tool_call_result,
  CometChatUIKitConstants.streamMessageTypes.tool_call_start
];

/**
 * Initializes the message processing pipeline with configurable delays
 * Processes messages sequentially with appropriate timing delays for different message types
 */
const initializeMessageProcessor = () => {
  if (subscription) {
    subscription.unsubscribe();
  }
  subscription = messageQueue.pipe(
    concatMap(({ runId, event }) => {
      let delayTime = 0;
      if (event.getType() === CometChatUIKitConstants.streamMessageTypes.run_started) {
        delayTime = 2000;
      } else if (event.getType() === CometChatUIKitConstants.streamMessageTypes.tool_call_start) {
        delayTime = 500; 
      } else if (event.getType() === CometChatUIKitConstants.streamMessageTypes.tool_call_args) {
        delayTime = 500;
      } else if (toolEventsMap.includes(event.getType())) {
        delayTime = 100;
      } else if (event.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_start) {
        delayTime = 2000;
      } else if (event.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_content) {
        delayTime = streamSpeed;
      } else if (event.getType() === CometChatUIKitConstants.streamMessageTypes.run_finished) {
        streamingStateSubject.next(false);
      }
      return of({ runId, event }).pipe(
        delay(delayTime),
        tap(() => processMessage(runId, event))
      );
    })
  ).subscribe();
};

// Initialize the processor on service load
initializeMessageProcessor();


/**
 * Connection status subject and observable for broadcasting connection events
 */
const streamConnectionSubject = new BehaviorSubject<{ status: 'connected' | 'disconnected' | 'error', error?: any }>({ status: 'connected' });
export const streamConnection$ = streamConnectionSubject.asObservable();

/**
 * Methods to be called by MessageList on connection events
 */
export const onConnected = () => {
  streamConnectionSubject.next({ status: 'connected' });
};
export const onDisconnected = () => {
  streamConnectionSubject.next({ status: 'disconnected' });
};
export const onConnectionError = (error?: any) => {
  streamConnectionSubject.next({ status: 'error', error });
};

/**
 * Starts a new streaming message session for a required runId and attaches a listener callback
 * Resets accumulated content and initializes the message processor
 * @param runId - The runId for the streaming session (required)
 * @param listenerCallback - Callback for each event in the stream (optional)
 */
/**
 * Starts a new streaming message session for a required runId and attaches a listener callback
 * Adds an onError callback for error handling.
 */
export const startStreamingForRunId = (
  runId: string,
  listenerCallback?: (event: CometChat.AIAssistantBaseEvent) => void,
  onError?: (error: any) => void
) => {
  if (!runId) {
    if (onError) onError(new Error('runId is required for startStreamingForRunId'));
    else throw new Error('runId is required for startStreamingForRunId');
    return;
  }
  streamedMessages[runId] = '';
  processedDeltas[runId] = new Set();
  if (listenerCallback) {
    listeners[runId] = listenerCallback;
  }
  if (onError) {
    errorListeners[runId] = onError;
  }
  initializeMessageProcessor();
  streamingStateSubject.next(true);
};

/**
 * Internal error listeners map for runId-based error callbacks
 */
const errorListeners: { [runId: string]: (error: any) => void } = {};

/**
 * Internal listeners map for runId-based event callbacks
 */
const listeners: { [runId: string]: (event: CometChat.AIAssistantBaseEvent) => void } = {};

/**
 * Handles incoming websocket messages by adding them to the processing queue
 * @param msg - The message update to process
 */
export const handleWebsocketMessage = (msg: CometChat.AIAssistantBaseEvent, runId?: string) => {
  const id = runId || (typeof msg.getMessageId === 'function' ? msg.getMessageId() : undefined);
  messageQueue.next({ runId: String(id), event: msg });
  if (listeners[String(id)]) {
    listeners[String(id)](msg);
  }
};

/**
 * Normalize and fix markdown fences
 */
function fixMarkdownFences(text: string): string {
  return text.replace(/(^|\n)``(\n|$)/g, '$1```$2');
}

/**
 * Auto-close unclosed fences at the end
 */
function autoCloseFences(text: string): string {
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    return text + "\n```";
  }
  return text;
}
/**
 * Track if streaming is actually complete for each runId
 */
let streamingComplete: { [runId: string]: boolean } = {};

/**
 * Track which streams have finished UI rendering
 */
let renderingComplete: { [runId: string]: boolean } = {};

/**
 * Called by the UI component when it finishes rendering
 */
export const notifyStreamRenderComplete = (runId: string) => {
  renderingComplete[runId] = true;
  checkQueueEmptyStatus(runId);
};



const processMessage = (runId: string, msg: CometChat.AIAssistantBaseEvent) => {
  const type = msg.getType();
  if (!streamedMessages[runId]) {
    streamedMessages[runId] = '';
    processedDeltas[runId] = new Set();
  }
  // Initialize event queue for runId if not present
  if (!eventQueues[runId]) {
    eventQueues[runId] = [];
  }
  // Add event to queue
  eventQueues[runId].push(msg);

  if (msg instanceof CometChat.AIAssistantMessage) {
    const runIdToUse = msg.getRunId?.() || msg.getMessageId?.();
    if (runIdToUse) {
      storeAIAssistantMessage(String(runIdToUse), msg);
    }
  }
  if ((msg as any).getType?.() === CometChatUIKitConstants.streamMessageTypes.tool_call_result) {
    lastAIToolResultMessages[runId] = msg;
    checkQueueEmptyStatus(runId);
  }
  if ((msg as any).getType?.() === CometChatUIKitConstants.streamMessageTypes.tool_call_args) {
    lastAIToolArgumentMessages[runId] = msg;
    checkQueueEmptyStatus(runId);
  }
  switch (type) {
    case CometChatUIKitConstants.streamMessageTypes.run_started: {
      messageSubject.next({ message: msg });
      if (listeners[runId]) {
        listeners[runId](msg);
      }
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.tool_call_start: {
      messageSubject.next({ message: msg });
      if (listeners[runId]) {
        listeners[runId](msg);
      }
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.tool_call_args:
    case CometChatUIKitConstants.streamMessageTypes.tool_call_result:
    case CometChatUIKitConstants.streamMessageTypes.tool_call_end: {
      messageSubject.next({ message: msg });
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.text_message_start: {
      messageSubject.next({ message: msg });
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.text_message_content: {
      const delta = (msg as CometChat.AIAssistantContentReceivedEvent).getDelta() || '';
      if (!delta) return;
      const current = streamedMessages[runId] || '';
      if (delta.startsWith(current)) {
        streamedMessages[runId] = delta;
      } else if (delta.length > 0) {
        let overlapIndex = -1;
        for (let i = Math.min(current.length, delta.length); i > 0; i--) {
          if (current.endsWith(delta.substring(0, i))) {
            overlapIndex = i;
            break;
          }
        }
        streamedMessages[runId] = current + delta.substring(overlapIndex === -1 ? 0 : overlapIndex);
      }
      // ✅ live normalization of fences
      const normalized = fixMarkdownFences(streamedMessages[runId]);
      messageSubject.next({
        message: msg,
        streamedMessages: normalized,
      });
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.text_message_end: {
      const finalText = autoCloseFences(fixMarkdownFences(streamedMessages[runId] || ''));
      messageSubject.next({ message: msg, streamedMessages: finalText });
      break;
    }
    case CometChatUIKitConstants.streamMessageTypes.run_finished: {
      const finalText = autoCloseFences(fixMarkdownFences(streamedMessages[runId] || ''));
      messageSubject.next({ message: msg, streamedMessages: finalText });
      streamingStateSubject.next(false);
      eventQueues[runId] = eventQueues[runId].filter(e => e !== msg);
      streamingComplete[runId] = true;
      checkQueueEmptyStatus(runId);

      if (listeners[runId]) {
        listeners[runId](msg);
        delete listeners[runId];
      }
      break;
    }
    default:
      messageSubject.next({ message: msg });
  }
  // Error handling: if message has error property, call onError
  if ((msg as any).error && errorListeners[runId]) {
    errorListeners[runId]((msg as any).error);
    delete errorListeners[runId];
  }
  if (type !== CometChatUIKitConstants.streamMessageTypes.run_finished) {
    eventQueues[runId] = eventQueues[runId].filter(e => e !== msg);

    checkQueueEmptyStatus(runId);
  }
};

/**
 * Registers a queue completion callback for a runId
 * Called when run_finished is processed for that runId
 */
export const setQueueCompletionCallback = (runId: string, callback: QueueCompletionCallback) => {
  queueCompletionCallbacks[runId] = callback;
};

/**
 * Removes a queue completion callback for a runId
 */
export const removeQueueCompletionCallback = (runId: string) => {
  if (queueCompletionCallbacks[runId]) {
    delete queueCompletionCallbacks[runId];
  }
  if (errorListeners[runId]) {
    delete errorListeners[runId];
  }
};

/**
 * Sets the typing speed delay for text message content chunks
 * @param delay - The delay in milliseconds between text content chunks (default: 80ms)
 */
export const setStreamSpeed = (delay: number) => {
  if (delay !== streamSpeed) {
    streamSpeed = delay;
  }
};

/**
 * Gets the current typing speed delay for text message content chunks
 * @returns The current delay in milliseconds
 */
export const getStreamSpeed = (): number => {
  return streamSpeed;
};

export const getAIAssistantTools = (): CometChatAIAssistantTools => {
  return toolKitActions;
};

export const setAIAssistantTools = (actions: CometChatAIAssistantTools): void => {
  toolKitActions = actions;
};

/**
 * Stops the streaming message session and cleans up resources
 * Unsubscribes from the message processor and resets accumulated content
 */
export const stopStreamingForRunId = (runId?: string) => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  if (runId) {
    delete streamedMessages[runId];
    delete processedDeltas[runId];
    delete queueCompletionCallbacks[runId];
    lastAIAssistantMessages = lastAIAssistantMessages.filter(item => item.runId !== runId);
    delete lastAIToolResultMessages[runId];
    delete lastAIToolArgumentMessages[runId];
    delete streamingComplete[runId];
    delete renderingComplete[runId];
    delete errorListeners[runId];
  } else {
    streamedMessages = {};
    processedDeltas = {};
    streamingComplete = {};
    renderingComplete = {};
    lastAIAssistantMessages = [];
    lastAIToolResultMessages = {};
    lastAIToolArgumentMessages = {};
    for (const key in queueCompletionCallbacks) {
      delete queueCompletionCallbacks[key];
    }
    for (const key in errorListeners) {
      delete errorListeners[key];
    }
  }
  streamingStateSubject.next(false);
};