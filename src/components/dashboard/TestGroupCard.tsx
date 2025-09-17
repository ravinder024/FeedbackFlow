import React from 'react';
import { TestGroup } from '@prisma/client';
import { useRouter } from 'next/router';

interface TestGroupCardProps {
  testGroup: TestGroup;
}

export default function TestGroupCard({ testGroup }: TestGroupCardProps) {
  const router = useRouter();

  const startTesting = async () => {
    try {
      const response = await fetch('/api/testing/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testGroupId: testGroup.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to start testing session');
      }

      const data = await response.json();
      
      // Open the test domain in a new tab
      window.open(testGroup.domain, '_blank');
      
      // Navigate to the session page
      router.push(`/test-groups/${testGroup.id}/sessions/${data.sessionId}`);
    } catch (error) {
      console.error('Error starting test session:', error);
      alert('Failed to start testing session. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{testGroup.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{testGroup.description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <span className="font-medium mr-2">Domain:</span>
          <a 
            href={testGroup.domain} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {new URL(testGroup.domain).hostname}
          </a>
        </div>
        
        <div className="flex items-center text-sm">
          <span className="font-medium mr-2">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            testGroup.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {testGroup.status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={startTesting}
          disabled={testGroup.status !== 'ACTIVE'}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            testGroup.status === 'ACTIVE'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Start Testing
        </button>
      </div>
    </div>
  );
} 