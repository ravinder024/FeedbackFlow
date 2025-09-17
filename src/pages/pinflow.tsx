"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface EventLog {
  id: string;
  eventType: 'PIN_CREATED' | 'PIN_UPDATED' | 'PIN_DELETED' | 'COMMENT_ADDED' | 'COMMENT_EDITED' | 'COMMENT_DELETED';
  pinId?: string;
  userId?: string;
  pageUrl?: string;
  x?: number;
  y?: number;
  emoji?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  comment?: string;
  metadata?: any;
  createdAt: string;
}

interface EventLogResponse {
  eventLogs: EventLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const DUMMY_TEST_GROUPS = [
  { id: 'tg1', name: 'Alpha Group', pageUrl: '/demo-test' },
  { id: 'tg2', name: 'Beta Group', pageUrl: '/dashboard' },
  { id: 'tg3', name: 'Gamma Group', pageUrl: '/guide' },
];

const DUMMY_EVENT_LOGS: EventLog[] = [
  {
    id: '1',
    eventType: 'PIN_CREATED',
    pinId: 'p1',
    userId: 'john@example.com',
    pageUrl: 'https://feedbackflow.com/demo-test',
    x: 120,
    y: 200,
    emoji: '😀',
    severity: 'low',
    comment: 'Great feature! Love the new design.',
    createdAt: new Date(Date.now() - 3000).toISOString(), // 3 seconds ago
    metadata: { status: 'active', testGroup: 'Alpha Group' }
  },
  {
    id: '2',
    eventType: 'PIN_CREATED',
    pinId: 'p2',
    userId: 'sarah@example.com',
    pageUrl: 'https://feedbackflow.com/dashboard',
    x: 300,
    y: 400,
    emoji: '😡',
    severity: 'high',
    comment: 'Bug found here. The button is not responsive.',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    metadata: { status: 'active', testGroup: 'Beta Group' }
  },
  {
    id: '3',
    eventType: 'PIN_CREATED',
    pinId: 'p3',
    userId: 'mike@example.com',
    pageUrl: 'https://feedbackflow.com/guide',
    x: 120,
    y: 200,
    emoji: '😐',
    severity: 'medium',
    comment: 'Documentation could be clearer here.',
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(), // 2 hours ago
    metadata: { status: 'resolved', testGroup: 'Gamma Group' }
  },
  {
    id: '4',
    eventType: 'PIN_CREATED',
    pinId: 'p4',
    userId: 'anna@example.com',
    pageUrl: 'https://feedbackflow.com/demo-test',
    x: 450,
    y: 300,
    emoji: '�',
    severity: 'critical',
    comment: 'Critical issue with data loading.',
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(), // 1 day ago
    metadata: { status: 'deleted', testGroup: 'Alpha Group' }
  },
];

const PinFlowDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    severity: ''
  });
  const [selectedTestGroup, setSelectedTestGroup] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'deleted'>('active');
  const [selectedPin, setSelectedPin] = useState<EventLog | null>(null);

  const itemsPerPage = 50;

  // Redirect if not authenticated or not admin/moderator
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  const fetchEventLogs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        ...(filters.pageUrl && { pageUrl: filters.pageUrl }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.severity && { severity: filters.severity })
      });

      const response = await fetch(`/api/eventlog?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch event logs');
      
      const data: EventLogResponse = await response.json();
      setEventLogs(data.eventLogs);
      setTotalPages(Math.ceil(data.pagination.total / itemsPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event logs');
    } finally {
      setLoading(false);
    }
  };


  // Demo: Filter dummy logs by selected test group and tab
  useEffect(() => {
    if (session && (session.user.role === 'ADMIN' || session.user.role === 'MODERATOR')) {
      setLoading(true);
      setTimeout(() => {
        let filtered = DUMMY_EVENT_LOGS;
        
        // Filter by status tab
        filtered = filtered.filter(log => log.metadata?.status === activeTab);
        
        if (selectedTestGroup) {
          const group = DUMMY_TEST_GROUPS.find(g => g.id === selectedTestGroup);
          if (group) filtered = filtered.filter(log => log.pageUrl?.includes(group.pageUrl));
        }
        if (filters.search) {
          const keyword = filters.search.toLowerCase();
          filtered = filtered.filter(log =>
            (log.pageUrl && log.pageUrl.toLowerCase().includes(keyword)) ||
            (log.userId && log.userId.toLowerCase().includes(keyword)) ||
            (log.comment && log.comment.toLowerCase().includes(keyword))
          );
        }
        if (filters.eventType) filtered = filtered.filter(log => log.eventType === filters.eventType);
        if (filters.severity) filtered = filtered.filter(log => log.severity === filters.severity);
        setEventLogs(filtered);
        setTotalPages(1);
        setLoading(false);
      }, 400);
    }
  }, [session, currentPage, filters, selectedTestGroup, activeTab]);

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 60) return `${diffSecs} secs ago`;
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleQuickResolve = (logId: string) => {
    // Move pin to resolved tab with "Quick resolved" status
    setEventLogs(logs => logs.filter(log => log.id !== logId));
    // In real implementation, would make API call to update status
  };

  const handleViewPin = (log: EventLog) => {
    setSelectedPin(log);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({ pageUrl: '', eventType: '', severity: '' });
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'PIN_CREATED': return 'bg-green-100 text-green-800';
      case 'PIN_UPDATED': return 'bg-blue-100 text-blue-800';
      case 'PIN_DELETED': return 'bg-red-100 text-red-800';
      case 'COMMENT_ADDED': return 'bg-purple-100 text-purple-800';
      case 'COMMENT_EDITED': return 'bg-yellow-100 text-yellow-800';
      case 'COMMENT_DELETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
      default: return 'bg-gray-400';
    }
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return null; // Will redirect
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PinFlow Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor and analyze feedback pin activity across all domains
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Total Events: {eventLogs.length}
            </div>
          </div>
        </div>

        {/* Test Group Selector */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-3">
            <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0">Test Group</label>
            <select
              value={selectedTestGroup}
              onChange={e => setSelectedTestGroup(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Groups</option>
              {DUMMY_TEST_GROUPS.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by keyword, URL, user, or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All event types</option>
                <option value="PIN_CREATED">Pin Created</option>
                <option value="PIN_UPDATED">Pin Updated</option>
                <option value="PIN_DELETED">Pin Deleted</option>
                <option value="COMMENT_ADDED">Comment Added</option>
                <option value="COMMENT_EDITED">Comment Edited</option>
                <option value="COMMENT_DELETED">Comment Deleted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'resolved'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'deleted'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Deleted
              </button>
            </nav>
          </div>
        </div>

        {/* Event Logs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Event Log</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading event logs...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
              <button
                onClick={() => {}}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : eventLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No event logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emoji
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        By User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewPin(log)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-4 h-4 rounded-full ${getSeverityColor(log.severity)}`}></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatRelativeTime(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-lg">{log.emoji || '📍'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <a 
                            href={log.pageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.pageUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {log.comment || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.userId || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPin(log);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              View
                            </button>
                            {activeTab === 'active' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickResolve(log.id);
                                }}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Quick Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Severity Legend */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Severity Legend:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-700"></div>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span>No Severity</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pin Detail Modal */}
        {selectedPin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Pin Details</h3>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              {/* Tabs at the top of modal */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSelectedPin({ ...selectedPin, _activeTab: 'details' })}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${!selectedPin._activeTab || selectedPin._activeTab === 'details' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setSelectedPin({ ...selectedPin, _activeTab: 'comments' })}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${selectedPin._activeTab === 'comments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Comments ({Array.isArray(selectedPin.comments) ? selectedPin.comments.length : 0})
                </button>
              </div>
              {/* Tab content */}
              <div>
                {(!selectedPin._activeTab || selectedPin._activeTab === 'details') && (
                  <div className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Test Group</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPin.metadata?.testGroup || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Used</label>
                        <p className="mt-1 text-sm text-gray-900">{formatRelativeTime(selectedPin.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created By</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPin.userId || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <div className="mt-1 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedPin.severity)}`}></div>
                          <span className="text-sm text-gray-900 capitalize">{selectedPin.severity || 'No severity'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL</label>
                      <a 
                        href={selectedPin.pageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline break-all"
                      >
                        {selectedPin.pageUrl}
                      </a>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPin.comment || 'No description provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emoji</label>
                      <span className="mt-1 text-2xl">{selectedPin.emoji || '📍'}</span>
                    </div>
                  </div>
                )}
                {selectedPin._activeTab === 'comments' && (
                  <div className="space-y-3 max-h-60 overflow-y-auto mt-4 p-6">
                    {Array.isArray(selectedPin.comments) && selectedPin.comments.length > 0 ? (
                      selectedPin.comments.map((comment, idx) => (
                        <div key={comment.id || idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {comment.author || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {typeof comment.timestamp === 'string' ? formatRelativeTime(comment.timestamp) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No comments yet</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedPin(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {activeTab === 'active' && (
                  <button
                    onClick={() => {
                      handleQuickResolve(selectedPin.id);
                      setSelectedPin(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Quick Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PinFlowDashboard;
