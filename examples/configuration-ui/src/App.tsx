import { useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { WebhookList } from './components/WebhookList'
import { WebhookDetail } from './components/WebhookDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
})

function App() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-white mb-2">Webhooks</h1>
            <p className="text-zinc-500 text-sm">
              Manage webhook endpoints to receive real-time notifications
            </p>
          </div>

          {/* Main content */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm">
            {selectedWebhookId ? (
              <div className="p-8">
                <WebhookDetail
                  webhookId={selectedWebhookId}
                  onBack={() => setSelectedWebhookId(null)}
                />
              </div>
            ) : (
              <WebhookList onSelectWebhook={setSelectedWebhookId} />
            )}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
