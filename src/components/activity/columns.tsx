"use client";

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ExternalLink, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type EventLogRow = {
  id: string;
  eventType: string;
  pinId: string | null;
  pageUrl: string | null;
  userId: string | null;
  testGroupId: string | null;
  timestamp: Date;
  data: any;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

// Event type color mapping
const getEventTypeBadge = (eventType: string) => {
  const colors: Record<string, string> = {
    'PIN_CREATED': 'bg-green-100 text-green-800',
    'PIN_UPDATED': 'bg-blue-100 text-blue-800',
    'PIN_DELETED': 'bg-red-100 text-red-800',
    'COMMENT_ADDED': 'bg-purple-100 text-purple-800',
    'FEEDBACK_SUBMITTED': 'bg-orange-100 text-orange-800',
    'PAGE_VISIT': 'bg-gray-100 text-gray-800',
    'HOME_VISIT': 'bg-indigo-100 text-indigo-800',
    'DASHBOARD_VISIT': 'bg-cyan-100 text-cyan-800',
    'FEEDBACK_VISIT': 'bg-pink-100 text-pink-800',
    'ADMIN_VISIT': 'bg-yellow-100 text-yellow-800',
    'AUTH_VISIT': 'bg-emerald-100 text-emerald-800',
  };

  const colorClass = colors[eventType] || 'bg-gray-100 text-gray-800';
  
  return (
    <Badge variant="secondary" className={colorClass}>
      {eventType.replace(/_/g, ' ')}
    </Badge>
  );
};

// View context button component
const ViewContextButton = ({ row }: { row: EventLogRow }) => {
  const handleViewContext = () => {
    if (row.pageUrl) {
      // Open the page URL in a new tab
      window.open(row.pageUrl, '_blank');
    } else if (row.pinId) {
      // If we have a pin ID but no page URL, we could show a modal or navigate to a pin view
      console.log('View pin:', row.pinId);
    }
  };

  const hasContext = row.pageUrl || row.pinId;
  
  if (!hasContext) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleViewContext}
      className="h-7 px-2 text-xs"
    >
      {row.pinId ? (
        <>
          <MapPin className="h-3 w-3 mr-1" />
          View Pin
        </>
      ) : (
        <>
          <ExternalLink className="h-3 w-3 mr-1" />
          View Page
        </>
      )}
    </Button>
  );
};

export const columns: ColumnDef<EventLogRow>[] = [
  {
    accessorKey: 'timestamp',
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: any) => {
      const timestamp = row.getValue('timestamp') as Date;
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'eventType',
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Event Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: any) => {
      const eventType = row.getValue('eventType') as string;
      return getEventTypeBadge(eventType);
    },
    filterFn: (row: any, id: any, value: any) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }: any) => {
      const user = row.getValue('user') as EventLogRow['user'];
      const userId = row.original.userId;
      
      if (!user && userId === 'anonymous') {
        return (
          <div className="text-sm text-gray-500 italic">
            Anonymous
          </div>
        );
      }
      
      if (!user) {
        return (
          <div className="text-sm text-gray-500">
            Unknown ({userId})
          </div>
        );
      }
      
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {user.name || 'Unnamed User'}
          </div>
          {user.email && (
            <div className="text-xs text-gray-500">
              {user.email}
            </div>
          )}
        </div>
      );
    },
    filterFn: (row: any, id: any, value: any) => {
      const user = row.getValue(id) as EventLogRow['user'];
      const searchValue = value.toLowerCase();
      
      if (!user) {
        return 'anonymous'.includes(searchValue);
      }
      
      return (
        (user.name?.toLowerCase().includes(searchValue) ?? false) ||
        (user.email?.toLowerCase().includes(searchValue) ?? false)
      );
    },
  },
  {
    accessorKey: 'pageUrl',
    header: 'Page',
    cell: ({ row }: any) => {
      const pageUrl = row.getValue('pageUrl') as string;
      const data = row.original.data;
      
      // For user activities, the path might be in metadata
      const path = pageUrl || (data as any)?.path;
      
      if (!path) {
        return (
          <div className="text-sm text-gray-500">
            —
          </div>
        );
      }
      
      // Truncate long URLs
      const displayUrl = path.length > 40 ? `${path.substring(0, 40)}...` : path;
      
      return (
        <div className="text-sm font-mono">
          {displayUrl}
        </div>
      );
    },
  },
  {
    accessorKey: 'pinId',
    header: 'Pin ID',
    cell: ({ row }: any) => {
      const pinId = row.getValue('pinId') as string;
      
      if (!pinId) {
        return (
          <div className="text-sm text-gray-500">
            —
          </div>
        );
      }
      
      return (
        <div className="text-sm font-mono bg-gray-50 px-2 py-1 rounded text-center">
          {pinId}
        </div>
      );
    },
  },
  {
    accessorKey: 'testGroupId',
    header: 'Test Group',
    cell: ({ row }: any) => {
      const testGroupId = row.getValue('testGroupId') as string;
      
      if (!testGroupId) {
        return (
          <div className="text-sm text-gray-500">
            —
          </div>
        );
      }
      
      return (
        <div className="text-sm">
          {testGroupId === 'default-group' ? (
            <span className="text-gray-500 italic">Default</span>
          ) : (
            <span className="font-mono">{testGroupId}</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) => {
      return <ViewContextButton row={row.original} />;
    },
  },
];