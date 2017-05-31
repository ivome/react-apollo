import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Component } from 'react';

import ApolloClient from 'apollo-client';

const invariant = require('invariant');

export declare interface ProviderProps {
  client: ApolloClient;
}

export default class ApolloProvider extends Component<ProviderProps, any> {
  static propTypes = {
    client: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    client: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);

    invariant(
      props.client,
      'ApolloClient was not passed a client instance. Make ' +
      'sure you pass in your client via the "client" prop.',
    );

    // This could be removed from future versions of react-apollo
    invariant(
      !props.store,
      'The "store" property was removed from ApolloProvider. If ' +
      'you need the store in the context, use the Provider component' +
      'from react-redux package instead.'
    );
  }

  getChildContext() {
    return {
      client: this.props.client,
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
