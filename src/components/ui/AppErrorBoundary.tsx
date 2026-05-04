import React from 'react'

interface AppErrorBoundaryState {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unknown runtime error',
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Runtime error:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
        <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Runtime Error</p>
          <h1 className="mt-2 text-xl font-semibold">The frontend crashed while rendering.</h1>
          <p className="mt-3 text-sm text-slate-600">
            Refresh once. If this stays visible, the error message below will help us fix it.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {this.state.message}
          </pre>
        </div>
      </div>
    )
  }
}
