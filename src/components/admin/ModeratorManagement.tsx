import React, { useState } from 'react';

interface PromoteModeratorFormProps {
  userId: string;
  testGroupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PromoteModeratorForm({ userId, testGroupId, onSuccess, onCancel }: PromoteModeratorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/promote-moderator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, testGroupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote user');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Promote User to Moderator
      </h3>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-red-800">
          {error}
        </div>
      )}
      <p className="text-gray-600 mb-4">
        Are you sure you want to promote this user to moderator? They will have access to:
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-6">
        <li>Test group management</li>
        <li>Member management</li>
        <li>Feedback moderation</li>
        <li>Analytics and reporting</li>
      </ul>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Promoting...' : 'Confirm Promotion'}
        </button>
      </div>
    </div>
  );
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface TestGroup {
  id: string;
  name: string;
  domain: string;
}

export default function ModeratorManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTestGroup, setSelectedTestGroup] = useState<string | null>(null);
  const [showPromoteForm, setShowPromoteForm] = useState(false);

  const handlePromoteSuccess = () => {
    setShowPromoteForm(false);
    setSelectedUser(null);
    setSelectedTestGroup(null);
    // Refresh user list
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=TEST_MEMBER');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  const fetchTestGroups = async () => {
    try {
      const response = await fetch('/api/admin/all-test-groups');
      if (!response.ok) throw new Error('Failed to fetch test groups');
      const data = await response.json();
      setTestGroups(data.testGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test groups');
    }
  };

  React.useEffect(() => {
    Promise.all([fetchUsers(), fetchTestGroups()])
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Promote to Moderator</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a user and test group to promote them to moderator.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Select User
              </label>
              <select
                id="user"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="testGroup" className="block text-sm font-medium text-gray-700">
                Select Test Group
              </label>
              <select
                id="testGroup"
                value={selectedTestGroup || ''}
                onChange={(e) => setSelectedTestGroup(e.target.value || null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a test group...</option>
                {testGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.domain})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPromoteForm(true)}
                disabled={!selectedUser || !selectedTestGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Promote to Moderator
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPromoteForm && selectedUser && selectedTestGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <PromoteModeratorForm
              userId={selectedUser}
              testGroupId={selectedTestGroup}
              onSuccess={handlePromoteSuccess}
              onCancel={() => setShowPromoteForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 