import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import FeedbackCollector from '../src/components/feedback/FeedbackCollector';

interface TestPageProps {
  testGroupId: string;
}

export default function TestPinPersistence({ testGroupId }: TestPageProps) {
  const [testGroup, setTestGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDomain(window.location.hostname);
    fetchTestGroup();
  }, [testGroupId]);

  const fetchTestGroup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test-groups/mock-${testGroupId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestGroup(data);
      console.log('Fetched test group:', data);
    } catch (err) {
      console.error('Error fetching test group:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSend = async () => {
    if (!inviteEmails.trim()) return;

    try {
      setInviteStatus('Sending...');
      const emails = inviteEmails.split(',').map(email => email.trim()).filter(Boolean);
      
    const response = await fetch('/api/test-groups/mock-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
      emails,
      testGroupId,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setInviteStatus(`✅ Success: ${result.message}`);
        setInviteEmails('');
      } else {
        setInviteStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Invite error:', err);
      setInviteStatus(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) return <div className="p-4">Loading test group...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!testGroup) return <div className="p-4">Test group not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Pin Persistence Test - {testGroup.name}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Test Group Info</h3>
              <p><strong>ID:</strong> {testGroup.id}</p>
              <p><strong>Name:</strong> {testGroup.name}</p>
              <p><strong>Status:</strong> {testGroup.status}</p>
              <p><strong>Current Domain:</strong> {currentDomain}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Pin Storage Keys</h3>
              <p><strong>Test Group:</strong> {testGroupId}</p>
              <p><strong>Domain:</strong> {currentDomain}</p>
              <p><strong>Page:</strong> {window.location.pathname}</p>
              <p className="text-sm text-gray-600 mt-2">
                Pins are stored with composite keys to ensure isolation between test groups and domains.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Test Member Invites</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter emails separated by commas"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleInviteSend}
                disabled={!inviteEmails.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send Invites
              </button>
            </div>
            {inviteStatus && (
              <div className="text-sm mt-2">{inviteStatus}</div>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click anywhere on the page to create feedback pins</li>
              <li>Pins are automatically saved with test group + domain + page URL</li>
              <li>Refresh the page - pins should persist</li>
              <li>Open this page in different domains/ports to test isolation</li>
              <li>Switch test groups to verify pin isolation</li>
              <li>Open browser dev tools to see storage keys in localStorage</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 relative min-h-96">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Click Anywhere to Create Pins
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded flex items-center justify-center text-white font-semibold">
              Sample Area 1
            </div>
            <div className="h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-white font-semibold">
              Sample Area 2
            </div>
            <div className="h-24 bg-gradient-to-r from-yellow-400 to-red-500 rounded flex items-center justify-center text-white font-semibold">
              Sample Area 3
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Storage Key Pattern:</strong> pins_{testGroupId}_{currentDomain}_{window.location.pathname}</p>
            <p><strong>Current Storage Key:</strong> pins_{testGroupId}_{currentDomain}_/test-pins</p>
          </div>

          {/* FeedbackCollector will overlay on this container */}
          <FeedbackCollector 
            testGroupId={testGroupId} 
            testSessionId="session-pins-test"
            onPinCreated={(pin) => {
              console.log('Pin created:', pin);
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="flex gap-4 justify-center">
            <a
              href="/test-pins?testGroupId=test-group-saucedemo"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Switch to SauceDemo Group
            </a>
            <a
              href="/test-pins?testGroupId=test-group-httpbin"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Switch to HTTPBin Group
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { testGroupId } = context.query;
  
  return {
    props: {
      testGroupId: testGroupId || 'test-group-saucedemo',
    },
  };
};
