"use client";

import { Component, type ReactNode } from "react";
import { captureException } from "@/lib/monitoring/sentry";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-mingle-bg px-6 text-center">
          <p className="font-display text-xl font-bold text-mingle-white">
            Something went wrong
          </p>
          <p className="mt-2 max-w-sm text-sm text-mingle-text-secondary">
            Try again in a moment. If it keeps happening, come back later.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 rounded-full bg-mingle-cta px-8 py-3 font-display text-sm font-semibold text-mingle-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
