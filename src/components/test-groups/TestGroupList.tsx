import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/roles';

interface TestGroup {
  id: string;
  name: string;
  domain: string;
  description?: string | null;
  isActive: boolean;
  _count: {
    members: number;
  };
}

interface TestGroupListProps {
  testGroups: (TestGroup & {
    _count: { members: number };
  })[];
  onEdit?: (testGroup: TestGroup) => void;
  onDelete?: (testGroup: TestGroup) => void;
}

export default function TestGroupList({ testGroups, onEdit, onDelete }: TestGroupListProps) {
  const { data: session } = useSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canManageGroups = session?.user?.role === UserRole.ADMIN || 
                         session?.user?.role === UserRole.MODERATOR;

  return (
    <div className="space-y-4">
      {testGroups.map((group) => (
        <div
          key={group.id}
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
              <p className="text-gray-500">{group.domain}</p>
              <p className="text-sm text-gray-600 mt-2">{group.description}</p>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">{group._count.members} members</span>
                <span className="mx-2">•</span>
                <span className={group.isActive ? 'text-green-600' : 'text-red-600'}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {canManageGroups && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit?.(group)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(group)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 