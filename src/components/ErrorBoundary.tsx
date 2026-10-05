import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 border border-red-200 rounded">
          <h1 className="text-xl font-bold">Something went wrong.</h1>
          <pre className="mt-4 text-sm bg-white p-4 rounded overflow-auto">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
