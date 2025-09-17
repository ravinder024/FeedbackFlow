import React, { useRef, useState } from 'react';
import FeedbackCollector from '../components/feedback/FeedbackCollector';

const SauceDemoTest: React.FC = () => {
  const feedbackRef = useRef<{ activatePinMode: () => void; placePinAt: (x: number, y: number) => void }>(null);
  const [testGroupId, setTestGroupId] = useState('test-group-saucedemo');
  const [targetUrl, setTargetUrl] = useState('https://www.saucedemo.com');

  const handleFeedbackSubmit = (feedback: any) => {
    console.log('Feedback submitted:', feedback);
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with instructions */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Universal Pin Persistence Test</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Test 1: Multi-Domain Pin Persistence</strong></p>
            <p>1. Configure test group and target URL below</p>
            <p>2. Place pins on elements in the iframe</p>
            <p>3. Change URL or test group and see pins are isolated</p>
            <p>4. Return to original settings and refresh page</p>
            <p>5. ✅ Expected: Pins should reappear for the specific test group + domain combination</p>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">Test Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Group ID</label>
              <input
                type="text"
                value={testGroupId}
                onChange={(e) => setTestGroupId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., test-group-saucedemo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target URL</label>
              <select
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="https://www.saucedemo.com">SauceDemo (E-commerce)</option>
                <option value="https://the-internet.herokuapp.com">The Internet (Test Site)</option>
                <option value="https://example.com">Example.com</option>
                <option value="https://httpbin.org">HTTPBin (API Testing)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <strong>Storage Key:</strong> feedback-pins-group-{testGroupId}_domain-{extractDomain(targetUrl).replace(/[^a-zA-Z0-9]/g, '-')}_page-{targetUrl.replace(/[^a-zA-Z0-9]/g, '-')}
          </div>
        </div>
      </div>

      {/* Target Website iframe */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 bg-gray-100 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{extractDomain(targetUrl)}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Group: {testGroupId}</span>
              <a 
                href={targetUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Open in new tab
              </a>
            </div>
          </div>
          <div className="relative">
            <iframe
              key={`${testGroupId}-${targetUrl}`} // Force re-render when config changes
              src={targetUrl}
              className="w-full h-96 border-0"
              title={extractDomain(targetUrl)}
              allow="same-origin"
            />
            {/* Feedback Collector overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="pointer-events-auto">
                <FeedbackCollector
                  key={`${testGroupId}-${targetUrl}`} // Force re-render when config changes
                  ref={feedbackRef}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  pageUrl={targetUrl}
                  testGroupId={testGroupId}
                  domain={extractDomain(targetUrl)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test controls */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => feedbackRef.current?.activatePinMode()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Activate Pin Mode
            </button>
            <button
              onClick={() => feedbackRef.current?.placePinAt(100, 100)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Test Pin at (100, 100)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              Refresh Page (Test Persistence)
            </button>
            <button
              onClick={() => {
                const key = `feedback-pins-group-${testGroupId}_domain-${extractDomain(targetUrl).replace(/[^a-zA-Z0-9]/g, '-')}_page-${targetUrl.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const pins = localStorage.getItem(key);
                console.log('Stored pins:', pins ? JSON.parse(pins) : 'None');
                alert(`Check console for stored pins. Key: ${key}`);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Debug Storage
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Use these controls to test pin functionality. Pins are isolated by test group and domain.
          </div>
        </div>
      </div>

      {/* Multi-Domain Test Scenarios */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2 text-yellow-800">Multi-Domain Test Scenarios</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Test A:</strong> Place pins with Group "saucedemo-test" on SauceDemo → Switch to HTTPBin → No pins visible → Switch back → Pins reappear</p>
            <p><strong>Test B:</strong> Place pins with Group "group-1" → Change to "group-2" → No pins visible → Change back to "group-1" → Pins reappear</p>
            <p><strong>Test C:</strong> Place pins on SauceDemo → Switch URL to The Internet → No pins visible → Switch back to SauceDemo → Pins reappear</p>
            <p><strong>Test D:</strong> Place pins → Refresh page → All pins persist in exact locations</p>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2">Debug Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Current Test Group: <strong>{testGroupId}</strong></p>
            <p>Current Domain: <strong>{extractDomain(targetUrl)}</strong></p>
            <p>Current URL: <strong>{targetUrl}</strong></p>
            <p>Storage Key: feedback-pins-group-{testGroupId}_domain-{extractDomain(targetUrl).replace(/[^a-zA-Z0-9]/g, '-')}_page-{targetUrl.replace(/[^a-zA-Z0-9]/g, '-')}</p>
            <p>Check browser console for detailed pin save/load logs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SauceDemoTest;
