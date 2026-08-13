import { Component, type ErrorInfo, type ReactNode } from 'react';
import './BrowserErrorBoundary.css';

interface BrowserErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface BrowserErrorBoundaryState {
  error: Error | null;
}

export default class BrowserErrorBoundary extends Component<BrowserErrorBoundaryProps, BrowserErrorBoundaryState> {
  public state: BrowserErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): BrowserErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('A browser module failed to render.', error, info.componentStack);
  }

  public componentDidUpdate(previousProps: BrowserErrorBoundaryProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  public render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="browser-error" role="alert">
        <div className="browser-error__code">:(</div>
        <h2>Internet Explorer cannot display this CodeHawks module.</h2>
        <p>{this.state.error.message}</p>
        <button type="button" onClick={() => this.setState({ error: null })}>Try Again</button>
      </section>
    );
  }
}
