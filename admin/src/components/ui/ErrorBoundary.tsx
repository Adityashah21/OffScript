import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    // Note: Never log personal user data (PII) to console or tracking per instructions
    console.error('App Error caught by ErrorBoundary:', error.message);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">
            An unexpected error occurred while rendering this view. You can reload the dashboard to resume your session.
          </p>

          <Button
            variant="default"
            size="sm"
            onClick={this.handleReset}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Dashboard</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
