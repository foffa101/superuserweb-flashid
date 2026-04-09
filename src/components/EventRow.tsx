import type { PlatformEvent, EventType, EventStatus } from '../lib/api';

const typeBadgeColors: Record<EventType, string> = {
  session_created: 'bg-blue-100 text-blue-700',
  session_verified: 'bg-green-100 text-green-700',
  session_expired: 'bg-amber-100 text-amber-700',
  session_failed: 'bg-red-100 text-red-700',
  rate_limit_hit: 'bg-amber-100 text-amber-700',
  ip_banned: 'bg-red-100 text-red-700',
  ip_unbanned: 'bg-green-100 text-green-700',
  api_key_rotated: 'bg-blue-100 text-blue-700',
  tenant_suspended: 'bg-red-100 text-red-700',
  tenant_activated: 'bg-green-100 text-green-700',
  settings_updated: 'bg-blue-100 text-blue-700',
  login: 'bg-slate-100 text-slate-700',
};

const statusDotColors: Record<EventStatus, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const statusLabelColors: Record<EventStatus, string> = {
  success: 'text-green-700 bg-green-50',
  warning: 'text-amber-700 bg-amber-50',
  error: 'text-red-700 bg-red-50',
  info: 'text-blue-700 bg-blue-50',
};

function formatType(type: EventType): string {
  return type.replace(/_/g, ' ');
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

interface EventRowProps {
  event: PlatformEvent;
}

export default function EventRow({ event }: EventRowProps) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
        {formatTimestamp(event.timestamp)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
        {event.tenantName}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${typeBadgeColors[event.eventType]}`}>
          {formatType(event.eventType)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
        {event.ip}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        {event.location}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${statusLabelColors[event.status]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotColors[event.status]}`} />
          {event.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
        {event.details}
      </td>
    </tr>
  );
}
