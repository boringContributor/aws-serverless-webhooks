import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { ScrollArea } from './ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import type { Components, Paths } from '@webhooks/client'

interface EditWebhookModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Paths.UpdateWebhookConfig.RequestBody) => Promise<void>
  webhook: Components.Schemas.Webhook
}

const AVAILABLE_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'order.created',
  'order.updated',
  'payment.succeeded',
  'payment.failed',
]

interface FormData {
  endpoint: string
  name: string
  event_types: string[]
}

export const EditWebhookModal = ({ isOpen, onClose, onSubmit, webhook }: EditWebhookModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      endpoint: webhook.endpoint || '',
      name: webhook.name || '',
      event_types: webhook.event_types || [],
    },
  })

  const selectedEvents = watch('event_types')

  // Update form when webhook changes
  useEffect(() => {
    reset({
      endpoint: webhook.endpoint || '',
      name: webhook.name || '',
      event_types: webhook.event_types || [],
    })
  }, [webhook, reset])

  const toggleEvent = (event: string) => {
    const current = selectedEvents || []
    if (current.includes(event)) {
      setValue('event_types', current.filter((e) => e !== event), { shouldDirty: true })
    } else {
      setValue('event_types', [...current, event], { shouldDirty: true })
    }
  }

  const onSubmitForm = async (data: FormData) => {
    try {
      await onSubmit({
        endpoint: data.endpoint,
        name: data.name || undefined,
        event_types: data.event_types,
      })
      onClose()
    } catch (err) {
      console.error('Failed to update webhook:', err)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[525px] !bg-zinc-900 !text-white !border-zinc-800">
        <DialogHeader>
          <DialogTitle>Edit Endpoint</DialogTitle>
          <DialogDescription>
            Update your webhook endpoint configuration
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL *</Label>
              <Input
                id="endpoint"
                type="url"
                placeholder="https://example.com/webhooks"
                disabled={isSubmitting}
                {...register('endpoint', {
                  required: 'Endpoint URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL',
                  },
                })}
              />
              {errors.endpoint && (
                <p className="text-sm text-destructive">{errors.endpoint.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="My webhook endpoint"
                disabled={isSubmitting}
                {...register('name')}
              />
            </div>

            <div className="space-y-2">
              <Label>Events *</Label>
              <ScrollArea className="h-64 rounded-md border p-4">
                <div className="space-y-3">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event} className="flex items-center space-x-3">
                      <Checkbox
                        id={event}
                        checked={selectedEvents?.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={event}
                        className="text-sm font-mono cursor-pointer"
                      >
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedEvents?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Select at least one event to listen for
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || selectedEvents?.length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
