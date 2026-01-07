import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, deleteConfig, updateConfig } from '../api/api'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { EditWebhookModal } from './EditWebhookModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { useState } from 'react'
import { ArrowLeft, Copy, Eye, EyeOff, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { toast } from 'sonner'
import type { Paths } from '@webhooks/client'
import { EventsList } from './EventsList'

interface WebhookDetailProps {
  webhookId: string
  onBack: () => void
}

export const WebhookDetail = ({ webhookId, onBack }: WebhookDetailProps) => {
  const queryClient = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const { data: webhook, isLoading } = useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: () => getConfig(webhookId)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      onBack()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Paths.UpdateWebhookConfig.RequestBody }) =>
      updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook', webhookId] })
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })

  const handleToggleStatus = () => {
    if (!webhook) return

    updateMutation.mutate({
      id: webhookId,
      data: {
        status: webhook.status === 'enabled' ? 'disabled' : 'enabled'
      }
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(webhookId)
    setIsDeleteDialogOpen(false)
  }

  const handleRotateSecret = () => {
    // TODO: Implement rotate secret API call
    toast.info('Secret rotation not yet implemented')
    setIsRotateDialogOpen(false)
  }

  const handleEdit = async (data: Paths.UpdateWebhookConfig.RequestBody) => {
    await updateMutation.mutateAsync({
      id: webhookId,
      data
    })
    setIsEditModalOpen(false)
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
    return date.toLocaleDateString()
  }

  const copyToClipboard = (text: string, type: 'endpoint' | 'secret') => {
    navigator.clipboard.writeText(text)
    if (type === 'endpoint') {
      setCopiedEndpoint(true)
      setTimeout(() => setCopiedEndpoint(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!webhook) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-muted-foreground mb-4">Webhook not found</div>
        <Button onClick={onBack}>Back to list</Button>
      </div>
    )
  }

  return (
    <>
      <div className="webhook-detail space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to endpoints
        </Button>

        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-6">
                <CardTitle className="text-xl mb-2">{webhook.name || 'Unnamed Endpoint'}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <code className="text-sm font-mono break-all">{webhook.endpoint}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => webhook.endpoint && copyToClipboard(webhook.endpoint, 'endpoint')}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {copiedEndpoint && <span className="text-xs text-muted-foreground">Copied!</span>}
                </CardDescription>
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 hover:bg-zinc-800/60 rounded transition-all cursor-pointer">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 bg-zinc-900/95 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="cursor-pointer hover:bg-zinc-800/80">
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer hover:bg-zinc-800/80">
                    {webhook.status === 'enabled' ? 'Disable' : 'Enable'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRotateDialogOpen(true)} className="cursor-pointer hover:bg-zinc-800/80">
                    Rotate secret
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500 focus:text-red-500"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge className={webhook.status === 'enabled' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                {webhook.status === 'enabled' ? 'Enabled' : 'Disabled'}
              </Badge>

              {webhook.event_types && webhook.event_types.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Listening for:</span>
                  <span className="text-xs text-muted-foreground">
                    {webhook.event_types.join(', ')}
                  </span>
                </>
              )}

              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Created:</span>
              <span className="text-xs text-muted-foreground">{formatDate(webhook.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Signing Secret Card */}
        <Card>
          <CardHeader>
            <CardTitle>Signing Secret</CardTitle>
            <CardDescription>
              Use this secret to verify webhook signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-muted rounded-md text-sm font-mono">
                {showSecret ? webhook.secret : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
                className="cursor-pointer"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => webhook.secret && copyToClipboard(webhook.secret, 'secret')}
                className="cursor-pointer"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copiedSecret && <p className="text-xs text-muted-foreground mt-2">Secret copied to clipboard!</p>}
          </CardContent>
        </Card>

        {/* Webhook Events Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Webhook Events</CardTitle>
              <CardDescription>
                History of events sent to this endpoint
              </CardDescription>
            </div>
            <Button
              onClick={async () => {
                try {
                  const { dispatchWebhook } = await import('../api/api')
                  await dispatchWebhook()
                  toast.success('Test event dispatched successfully!')
                } catch (err) {
                  console.error('Failed to dispatch test event:', err)
                  toast.error('Failed to dispatch test event')
                }
              }}
              size="sm"
              className="cursor-pointer"
            >
              Send Test Event
            </Button>
          </CardHeader>
          <CardContent>
            <EventsList webhookId={webhookId} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {webhook && (
        <EditWebhookModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          webhook={webhook}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this webhook endpoint. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate Secret Confirmation Dialog */}
      <AlertDialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate Signing Secret?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new signing secret. The old secret will no longer work and you'll need to update your webhook consumer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotateSecret}>
              Rotate Secret
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
