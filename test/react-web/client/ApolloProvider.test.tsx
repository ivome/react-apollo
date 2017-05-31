
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { shallow, mount, ReactWrapper } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

declare function require(name: string);
import * as TestUtils from 'react-dom/test-utils';

import ApolloClient from 'apollo-client';

import gql from 'graphql-tag';

import ApolloProvider  from '../../../src/ApolloProvider';
import graphql from '../../../src/graphql';
import { MockedProvider, mockNetworkInterface } from '../../../src/test-utils';

describe('<ApolloProvider /> Component', () => {
  const client = new ApolloClient();
  const store = createStore(() => ({}));

  interface ChildContext {
    client: Object;
  }

  class Child extends React.Component<any, { store: any, client: any}> {
    static contextTypes: React.ValidationMap<any> = {
      client: PropTypes.object.isRequired
    };

    context: ChildContext;

    render() {
      return <div />;
    }

    componentDidUpdate() {
      if (this.props.data) this.props.data.refetch()
    }
  }
  class ChildWithOptionalStore extends React.Component<any, {client: any}> {
    static contextTypes: React.ValidationMap<any> = {
      client: PropTypes.object.isRequired
    };

    context: ChildContext;

    render() { return <div />; }

    componentDidUpdate() {
      if (this.props.data) this.props.data.refetch()
    }
  }

  const query = gql`query { authors { id } } `;
  const GQLChild = graphql(query)(Child);

  class Container extends React.Component<any, any> {
    constructor(props) {
      super(props);
      this.state = {};
    }

    componentDidMount() {
      this.setState({
        client: this.props.client,
      });
    }

    render() {
      return (
        <ApolloProvider client={this.state.client || this.props.client}>
          <Child />
        </ApolloProvider>
      );
    }
  }

  class ConnectedContainer extends React.Component<any, any> {
    constructor(props) {
      super(props);
      this.state = {};
    }

    componentDidMount() {
      this.setState({
        client: this.props.client,
      });
    }

    render() {
      return (
        <ApolloProvider client={this.state.client || this.props.client}>
          <GQLChild/>
        </ApolloProvider>
      );
    }
  }

  it('should render children components', () => {
    const wrapper = shallow(
      <ApolloProvider client={client}>
        <div className='unique'/>
      </ApolloProvider>
    );

    expect(wrapper.contains(<div className='unique'/>)).toBe(true);
  });

  it('should require a client', () => {
    const originalConsoleError = console.error;
    console.error = () => { /* noop */ };
    expect(() => {
      shallow(
        <ApolloProvider client={undefined}>
          <div className='unique'/>
        </ApolloProvider>
      );
    }).toThrowError(
      'ApolloClient was not passed a client instance. Make ' +
      'sure you pass in your client via the "client" prop.'
    );
    console.error = originalConsoleError;
  });

  it('should not require a store', () => {
    const wrapper = shallow(
      <ApolloProvider client={client}>
        <div className='unique'/>
      </ApolloProvider>
    );

    expect(wrapper.contains(<div className='unique'/>)).toBe(true);
  });

  it('should throw if rendered without a child component', () => {
    const originalConsoleError = console.error;
    console.error = () => { /* noop */ };
    expect(() => {
      shallow(
        <ApolloProvider client={client}/>
      );
    }).toThrowError(Error);
    console.error = originalConsoleError;
  });

  it('should add the client to the child context', () => {
    const tree = TestUtils.renderIntoDocument(
      <ApolloProvider client={client}>
        <Child />
      </ApolloProvider>
    ) as React.Component<any, any>;

    const child = TestUtils.findRenderedComponentWithType(tree, Child);
    expect(child.context.client).toEqual(client);

  });

  it('should update props when the client changes', () => {
    const container = shallow(<Container client={client} />);
    expect(container.find(ApolloProvider).props().client).toEqual(client);

    const newClient = new ApolloClient();
    container.setState({ client: newClient });
    expect(container.find(ApolloProvider).props().client).toEqual(newClient);
    expect(container.find(ApolloProvider).props().client).not.toEqual(client);
  });

  it('should update props when the store changes', () => {
    const container = shallow(<Container client={client} />);

    const newStore = createStore(() => ({}));
    container.setState({ store: newStore });
    expect(container.find(ApolloProvider).props().store).toEqual(newStore);
    expect(container.find(ApolloProvider).props().store).not.toEqual(store);
  });

  it('should call clients init store when a store is not passed', () => {
    const testClient = new ApolloClient();
    testClient.store = store;

    const initStoreMock = jest.fn();
    testClient.initStore = initStoreMock;

    const container = TestUtils.renderIntoDocument(
      <Container client={testClient} />
    ) as React.Component<any, any>;
    expect(initStoreMock).toHaveBeenCalled();

    initStoreMock.mockClear();
    const newClient = new ApolloClient();
    newClient.store = store;
    newClient.initStore = initStoreMock;
    container.setState({ client: newClient });

    expect(initStoreMock).toHaveBeenCalled();
  });

  it('should not call clients init store when a store is passed', () => {
    const testClient = new ApolloClient();

    const initStoreMock = jest.fn();
    testClient.initStore = initStoreMock;

    const container = TestUtils.renderIntoDocument(
      <Container client={testClient} />
    ) as React.Component<any, any>;

    expect(initStoreMock).not.toHaveBeenCalled();

    initStoreMock.mockClear();
    const newClient = new ApolloClient();
    container.setState({ client: newClient });

    expect(initStoreMock).not.toHaveBeenCalled();

    const newStore = createStore(() => ({}));
    container.setState({ store: store });
    expect(initStoreMock).not.toHaveBeenCalled();
  });

  it('child component should be able to query new client and store when props change', () => {
    const container = TestUtils.renderIntoDocument(
      <Container client={client} />
    ) as React.Component<any, any>;

    const child = TestUtils.findRenderedComponentWithType(container, Child);
    expect(child.context.client).toEqual(client);

    const newClient = new ApolloClient({});
    const newStore = createStore(() => ({}));

    container.setState({
      client: newClient,
    });

    expect(child.context.client).toEqual(newClient);
    expect(child.context.client).not.toEqual(client);
  });

  /* it('should refetch against the new client when the client prop changes', () => {
    const initialInterface = { query: jest.fn() };
    const initialClient = new ApolloClient({
      networkInterface: initialInterface,
    });

    const container = TestUtils.renderIntoDocument(
      <ConnectedContainer client={initialClient} />
    ) as React.Component<any, any>;

    expect(initialInterface.query).toHaveBeenCalled();
    initialInterface.query.mockClear();

    const nextInterface = { query: jest.fn() };
    const nextClient = new ApolloClient({
      networkInterface: nextInterface,
    });

    container.setState({
      client: nextClient,
    });

    // Both cases fail
    expect(initialInterface.query).not.toHaveBeenCalled();
    expect(nextInterface.query).toHaveBeenCalled();
  }); */
});
