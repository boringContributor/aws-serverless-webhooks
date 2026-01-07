import { useQuery } from '@tanstack/react-query'
import { listEvents, getEventById } from '../api/api'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useState } from 'react'
import { Circle, CheckCircle2, XCircle, Clock, RefreshCw, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface EventsListProps {
  webhookId: string
}

export const EventsList = ({ webhookId }: EventsListProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const { data: eventsData, isLoading, refetch } = useQuery({
    queryKey: ['events', webhookId],
    queryFn: () => listEvents({ webhookId }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  })

  const { data: selectedEvent } = useQuery({
    queryKey: ['event', webhookId, selectedEventId],
    queryFn: () => selectedEventId ? getEventById({ webhookId, eventId: selectedEventId }) : null,
    enabled: !!selectedEventId,
  })

  const events = eventsData?.data || []

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>
      case 'failure':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      default:
        return <Badge>{status || 'Unknown'}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading events...</div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Circle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm font-medium">No webhook events yet</p>
        <p className="text-muted-foreground text-xs mt-2">
          Events will appear here once webhooks are triggered
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
          {events.map((event) => (
            <button
              key={event.event_id}
              onClick={() => event.event_id && setSelectedEventId(event.event_id)}
              className="w-full text-left p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 bg-card border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {getStatusIcon(event.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {event.event_type || 'Unknown event'}
                      </span>
                      {event.http_status_code && (
                        <Badge variant="outline" className="text-xs">
                          {event.http_status_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate font-mono">{event.message_id || 'No ID'}</span>
                      <span>•</span>
                      <span>{formatDate(event.created_at)}</span>
                      {event.attempts && event.attempts > 1 && (
                        <>
                          <span>•</span>
                          <span>{event.attempts} attempts</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedEvent?.data && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl mb-2">Event Details</DialogTitle>
                    <DialogDescription className="font-mono text-sm">
                      {selectedEvent.data.message_id}
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedEvent.data.status)}
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Overview */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Overview</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Event Type</dt>
                    <dd className="font-mono">{selectedEvent.data.event_type || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{selectedEvent.data.status || 'Unknown'}</dd>
                  </div>
                  {selectedEvent.data.http_status_code && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">HTTP Status</dt>
                      <dd>{selectedEvent.data.http_status_code}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Attempts</dt>
                    <dd>{selectedEvent.data.attempts || 1}</dd>
                  </div>
                  {selectedEvent.data.created_at && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd>{new Date(selectedEvent.data.created_at).toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Error Message */}
              {selectedEvent.data.error_message && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-red-500">Error</h4>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-sm text-red-400 font-mono">
                      {selectedEvent.data.error_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Request Payload */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Request Payload</h4>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedEvent.data.message_payload, null, 2)}
                </pre>
              </div>

              {/* Response Body */}
              {selectedEvent.data.response_body && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Response</h4>
                  <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
                    {selectedEvent.data.response_body}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Metadata</h4>
                <dl className="space-y-2">
                  {selectedEvent.data.event_id && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Event ID</dt>
                      <dd className="font-mono text-xs truncate max-w-[250px]" title={selectedEvent.data.event_id}>
                        {selectedEvent.data.event_id}
                      </dd>
                    </div>
                  )}
                  {selectedEvent.data.message_id && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Message ID</dt>
                      <dd className="font-mono text-xs truncate max-w-[250px]" title={selectedEvent.data.message_id}>
                        {selectedEvent.data.message_id}
                      </dd>
                    </div>
                  )}
                  {selectedEvent.data.webhook_id && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Webhook ID</dt>
                      <dd className="font-mono text-xs truncate max-w-[250px]" title={selectedEvent.data.webhook_id}>
                        {selectedEvent.data.webhook_id}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
