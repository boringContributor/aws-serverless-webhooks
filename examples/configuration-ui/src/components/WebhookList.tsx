import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listConfigs, deleteConfig, updateConfig, createConfig } from '../api/api'
import { Badge } from './ui/badge'
import { DropdownMenu } from './ui/DropdownMenu'
import { CreateWebhookModal } from './CreateWebhookModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { MoreVertical, Link as LinkIcon, Plus } from 'lucide-react'
import type { Paths, Components } from '@webhooks/client'

interface WebhookListProps {
  onSelectWebhook: (webhookId: string) => void
}

export const WebhookList = ({ onSelectWebhook }: WebhookListProps) => {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  console.log('WebhookList: isCreateModalOpen =', isCreateModalOpen)

  const { data: webhooks, isLoading, error, isError } = useQuery({
    queryKey: ['webhooks'],
    queryFn: listConfigs,
  })

  console.log('WebhookList render:', { webhooks, isLoading, isError, error })

  const deleteMutation = useMutation({
    mutationFn: deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Paths.UpdateWebhookConfig.RequestBody }) =>
      updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })

  const createMutation = useMutation({
    mutationFn: createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })

  const handleToggleStatus = (webhook: Components.Schemas.Webhook) => {
    if (!webhook.webhook_id) return

    updateMutation.mutate({
      id: webhook.webhook_id,
      data: {
        status: webhook.status === 'enabled' ? 'disabled' : 'enabled'
      }
    })
  }

  const handleDelete = (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook endpoint?')) {
      deleteMutation.mutate(webhookId)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="text-destructive mb-2 font-medium">Error loading webhooks</div>
        <div className="text-muted-foreground text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
      </div>
    )
  }

  const webhookList = webhooks?.data || []

  if (webhookList.length === 0) {
    return (
      <>
        <CreateWebhookModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data)
          }}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <LinkIcon className="w-16 h-16 text-muted mb-4" />
          <div className="text-foreground mb-4 font-medium">No webhook endpoints configured</div>
          <p className="text-muted-foreground text-sm mb-6">Create your first webhook endpoint to get started</p>
          <button
            onClick={() => {
              console.log('Empty state button clicked!')
              setIsCreateModalOpen(true)
            }}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 p-4 bg-white text-black rounded-md font-medium text-sm hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Create Endpoint
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <CreateWebhookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data)
        }}
      />
      <div className="webhook-list">
        {/* Header with Create button */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Endpoints</h2>
            <p className="text-sm text-muted-foreground">
              {webhookList.length} {webhookList.length === 1 ? 'endpoint' : 'endpoints'}
            </p>
          </div>
          <button
            onClick={() => {
              console.log('Button clicked!')
              setIsCreateModalOpen(true)
            }}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-md font-medium text-sm hover:bg-zinc-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Endpoint
          </button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6">Endpoint</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhookList.map((webhook) => (
              <TableRow
                key={webhook.webhook_id}
                className="cursor-pointer group"
              >
                <TableCell
                  className="py-5 px-6"
                  onClick={() => webhook.webhook_id && onSelectWebhook(webhook.webhook_id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">
                      {webhook.name || 'Unnamed endpoint'}
                    </span>
                    <Badge
                      className={webhook.status === 'enabled' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}
                    >
                      {webhook.status === 'enabled' ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {webhook.event_types && webhook.event_types.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {webhook.event_types.join(', ')}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(webhook.created_at)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1.5 truncate max-w-2xl">
                    {webhook.endpoint}
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6 relative" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu
                    trigger={<MoreVertical className="w-5 h-5" />}
                    items={[
                      {
                        label: webhook.status === 'enabled' ? 'Disable' : 'Enable',
                        onClick: () => handleToggleStatus(webhook)
                      },
                      {
                        label: 'Delete',
                        onClick: () => webhook.webhook_id && handleDelete(webhook.webhook_id),
                        variant: 'danger'
                      }
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
