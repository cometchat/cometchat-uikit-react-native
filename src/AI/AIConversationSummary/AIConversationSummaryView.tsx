
import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { CometChatContext, CometChatTheme, localize } from '../../shared';
import { AIConversationSummaryConfiguration } from './configuration';
import { CometChatPanel } from '../../shared/views/CometChatPanel/CometChatPanel';
import CometChatAICard from '../../shared/views/CometChatAICard/CometChatAICard';

interface IAIConversationSummaryProps {
    getConversationSummaryCallback?: (theme?: CometChatTheme) => Promise<string>
    editReplyCallback?: (reply: string) => void
    configuration?: AIConversationSummaryConfiguration
    theme?: CometChatTheme,
    onPanelClose: () => void
};

const defaultProps: IAIConversationSummaryProps = {
    getConversationSummaryCallback: undefined,
    editReplyCallback: undefined,
    configuration: undefined,
    theme: new CometChatTheme({}),
    onPanelClose: () => { }
}

const enum States {
    loading = "loading",
    error = "error",
    empty = "empty",
    loaded = "loaded"
}

let inProgress = false;
const AIConversationSummaryView = (props: IAIConversationSummaryProps) => {

    const [messageListState, setMessageListState] = useState<States>(States.loading);
    const [activeView, setActiveView] = useState<JSX.Element | null>(null);

    const { theme } = useContext(CometChatContext)

    const errorStateText: string = localize("SOMETHING_WRONG");
    const emptyStateText: string = localize("NO_MESSAGES_FOUND");
    const loadingStateText: string = localize("GENERATING_SUMMARY");
    const titleText: string = localize("CONVERSATION_SUMMARY")

    useEffect(() => {
        fetchButtonContent();
    }, []);

    function fetchButtonContent() {
        setMessageListState(States.loading);
        if (props && props.getConversationSummaryCallback) {
            props.getConversationSummaryCallback(theme)
                .then((response) => {
                    if (response) {
                        inProgress = true;
                        getLoadedView(response)
                            .then(res => {
                                setMessageListState(States.loaded);
                                setActiveView(res);
                            })
                            .catch(err => {
                                inProgress = false;
                                setMessageListState(States.empty);
                            })
                    } else {
                        inProgress = false;
                        setMessageListState(States.empty);
                    }
                })
                .catch((err) => {
                    inProgress = false;
                    setMessageListState(States.error);
                })
        }
    }

    /**
     * Create a view based on the value of the `state` prop.
     */
    function getStateView(): JSX.Element | null {
        let res: JSX.Element | null = null;
        switch (messageListState) {
            case States.loading:
                res = getLoadingView();
                break;
            case States.error:
                res = getErrorView();
                break;
            case States.empty:
                res = getEmptyView();
                break;
            case States.loaded:
                break;
            default:
                const x: never = messageListState;
        }
        return res;
    }

    /**
     * Creates the loading view
     */
    function getLoadingView(): JSX.Element {
        let LoadingView = props.configuration?.LoadingStateView;
        return (

            <CometChatAICard
                state={States.loading}
                style={props.configuration?.conversationSummaryStyle}
                loadingIconURL={props.configuration?.loadingIconURL}
                loadingStateText={loadingStateText}
            >
                {LoadingView ? <LoadingView /> : null}
            </CometChatAICard>
        );
    }

    /**
     * Creates the error view
     */
    function getErrorView(): JSX.Element | null {
        let ErrorView = props.configuration?.ErrorStateView;
        return (
            <CometChatAICard
                state={States.error}
                style={props.configuration?.conversationSummaryStyle}
                errorIconURL={props.configuration?.errorIconURL}
                errorStateText={errorStateText}
            >
                {ErrorView ? <ErrorView /> : null}
            </CometChatAICard>
        );
    }

    /**
     * Creates the empty view
     */
    function getEmptyView(): JSX.Element {
        let EmptyView = props.configuration?.EmptyStateView;
        return (
            <CometChatAICard
                state={States.empty}
                style={props.configuration?.conversationSummaryStyle}
                emptyIconURL={props.configuration?.emptyIconURL}
                emptyStateText={emptyStateText}
            >
                {EmptyView ? <EmptyView /> : null}
            </CometChatAICard>
        );
    }

    /**
     * Creates the loaded view
     */
    async function getLoadedView(conversationSummary: string): Promise<JSX.Element> {
        return new Promise((resolve, reject) => {
            try {
                let CustomView = props.configuration?.customView;

                if (CustomView) {
                    props.configuration?.customView!(conversationSummary, props.onPanelClose).then((res: any) => {
                        return resolve(res);
                    })
                        .catch((err: CometChat.CometChatException) => {
                            return reject(err)
                        })
                } else {
                    let conversationSummaryView = <CometChatPanel
                        title={titleText}
                        textContent={conversationSummary}
                        style={props.configuration?.conversationSummaryStyle}
                        onClose={props.onPanelClose}
                    />
                    return resolve(conversationSummaryView);
                }
            } catch (e) {
                reject(e);
            }
        })
    }

    return (
        <View style={{ marginTop: 10, overflow: "hidden" }} >
            {messageListState === States.loaded ? activeView : getStateView()}
        </View>
    );
};

AIConversationSummaryView.defaultProps = defaultProps
export default AIConversationSummaryView;
