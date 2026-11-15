import { Component, lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (firstError) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      try {
        return await importer();
      } catch {
        throw firstError;
      }
    }
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ViewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="mx-auto my-12 max-w-md rounded-[24px] border border-[#e5e5e5] bg-[#ffffff] p-6 text-center shadow-[0_0_0_1px_rgba(68,44,97,0.08),0_1px_3px_0_rgba(68,44,97,0.08)]">
          <p className="font-display text-lg font-semibold text-[#442c61]">
            No se pudo cargar esta vista
          </p>
          <p className="mt-2 text-sm text-[#543b6c]">
            Ocurrió una interrupción temporal al obtener el módulo.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-5 inline-flex min-h-[42px] items-center justify-center rounded-[18px] bg-[#9c44dc] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#543b6c] cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
