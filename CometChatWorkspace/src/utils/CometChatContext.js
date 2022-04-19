import React from 'react';
import PropTypes from 'prop-types';

import { UIKitSettings } from './UIKitSettings';
import { FeatureRestriction } from './FeatureRestriction';
import { theme } from '../resources/theme';

export const CometChatContext = React.createContext({});

export class CometChatContextProvider extends React.Component {
  constructor(props) {
    super(props);

    const settings = new UIKitSettings();
    const featureRestriction = new FeatureRestriction(settings);

    this.state = {
      UIKitSettings: settings,
      FeatureRestriction: featureRestriction,
      theme: theme,
    };
  }

  render() {
    return (
      <CometChatContext.Provider value={this.state}>
        {this.props.children}
      </CometChatContext.Provider>
    );
  }
}
