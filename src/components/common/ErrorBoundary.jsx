import React from 'react';
import { ErrorCard } from './ErrorCard.jsx';

/** Wraps the decision-detail workflow: a scenario that throws renders an
 *  error card, never a blank screen. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  handleRetry() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorCard
          message={this.state.error.message || 'This view could not be rendered.'}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
