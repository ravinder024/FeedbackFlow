import React, { useState, useMemo } from 'react';
import { Pin, PinStatus } from './store';

type SortField = 'pageUrl' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface FeedbackListProps {
  pins: Pin[];
  onPinSelect: (pin: Pin) => void;
  onStatusChange: (pinId: string, status: PinStatus) => void;
  selectedPinId?: string;
  className?: string;
}

export const FeedbackList = ({
  pins,
  onPinSelect,
  onStatusChange,
  selectedPinId,
  className
}: FeedbackListProps) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<PinStatus | 'all'>('all');

  const sortedAndFilteredPins = useMemo(() => {
    let filtered = statusFilter === 'all'
      ? pins
      : pins.filter(pin => pin.status === statusFilter);

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'pageUrl') {
        comparison = a.pageUrl.localeCompare(b.pageUrl);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [pins, sortField, sortDirection, statusFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  return (
    <div className={className}>
      <div className="mb-4 px-6 py-3 flex items-center space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PinStatus | 'all')}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="inProgress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('pageUrl')}
            >
              Page {sortField === 'pageUrl' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('status')}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('createdAt')}
            >
              Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAndFilteredPins.map((pin) => (
            <tr 
              key={pin.id}
              onClick={() => onPinSelect(pin)}
              className={`
                cursor-pointer transition-colors hover:bg-gray-50
                ${selectedPinId === pin.id ? 'bg-blue-50' : ''}
              `}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new URL(pin.pageUrl).pathname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pin.xPercent.toFixed(1)}%, {pin.yPercent.toFixed(1)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={pin.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(pin.id, e.target.value as PinStatus);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${pin.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      pin.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}
                  `}
                >
                  <option value="new">New</option>
                  <option value="inProgress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(pin.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
