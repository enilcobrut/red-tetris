import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

describe('App component', () => {
  test('renders without crashing', () => {
    const store = {
      getState: () => ({}),
      dispatch: () => {},
    };

    const { getByText } = render(
      React.createElement(Provider, { store },
        React.createElement(Router, null,
          React.createElement(App)
        )
      )
    );

    const linkElement = getByText(/home/i);
    expect(linkElement).toBeInTheDocument();
  });
});
