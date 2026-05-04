import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppErrorBoundary } from './components/ui/AppErrorBoundary.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

const root = createRoot(rootElement)

const renderBootMessage = (title: string, body: string, tone: 'loading' | 'error' = 'loading') => {
  const isError = tone === 'error'

  root.render(
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className={`w-full max-w-2xl rounded-3xl border p-6 shadow-lg ${isError ? 'border-red-200 bg-white' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isError ? 'text-red-500' : 'text-indigo-500'}`}>
          {isError ? 'Startup Error' : 'Loading'}
        </p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{body}</p>
      </div>
    </div>
  )
}

renderBootMessage('Starting student platform', 'Preparing routes, stores, and UI...')

void import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[main] Failed to bootstrap app:', error)
    renderBootMessage('The frontend failed to start.', message, 'error')
  })
