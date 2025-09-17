import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { generateWidgetSnippet, generateWidgetInstructions } from '@/lib/widget-embed';

interface TestGroupSettingsProps {
  testGroupId: string;
  domain: string;
  onUpdate: (settings: any) => void;
}

interface SheetIntegration {
  sheetId: string;
  lastSync: string | null;
  settings: {
    autoSync: boolean;
    syncInterval: string;
  };
}

export default function TestGroupSettings({ testGroupId, domain, onUpdate }: TestGroupSettingsProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [widgetToken, setWidgetToken] = useState<string | null>(null);
  const [sheetIntegration, setSheetIntegration] = useState<SheetIntegration | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchSheetIntegration();
  }, [testGroupId]);

  const fetchSheetIntegration = async () => {
    try {
      const response = await fetch(`/api/test-groups/${testGroupId}/sheets`);
      if (response.ok) {
        const data = await response.json();
        setSheetIntegration(data.integration);
      }
    } catch (error) {
      console.error('Error fetching sheet integration:', error);
    }
  };

  const handleSheetIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfiguring(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const sheetId = formData.get('sheetId') as string;
      const clientEmail = formData.get('clientEmail') as string;
      const privateKey = formData.get('privateKey') as string;
      const projectId = formData.get('projectId') as string;

      const response = await fetch(`/api/test-groups/${testGroupId}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
            project_id: projectId,
          },
        }),
      });

      if (response.ok) {
        await fetchSheetIntegration();
      } else {
        throw new Error('Failed to setup integration');
      }
    } catch (error) {
      console.error('Error setting up sheet integration:', error);
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleManualExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/test-groups/${testGroupId}/sheets`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to export feedback');
      }

      await fetchSheetIntegration();
    } catch (error) {
      console.error('Error exporting feedback:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemoveIntegration = async () => {
    if (!confirm('Are you sure you want to remove the Google Sheets integration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/test-groups/${testGroupId}/sheets`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSheetIntegration(null);
      } else {
        throw new Error('Failed to remove integration');
      }
    } catch (error) {
      console.error('Error removing sheet integration:', error);
    }
  };

  const generateEmbedCode = async () => {
    try {
      const response = await fetch('/api/test-groups/widget-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testGroupId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate widget token');
      }

      const data = await response.json();
      setWidgetToken(data.token);
    } catch (error) {
      console.error('Error generating widget token:', error);
      alert('Failed to generate widget embed code. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    if (!widgetToken) return;

    const snippet = generateWidgetSnippet(
      testGroupId,
      widgetToken,
      window.location.origin
    );

    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-xl font-semibold mb-4">Widget Integration</h2>
        <p className="text-gray-600 mb-4">{generateWidgetInstructions(domain)}</p>

        {!widgetToken ? (
          <button
            onClick={generateEmbedCode}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate Embed Code
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {generateWidgetSnippet(testGroupId, widgetToken, window.location.origin)}
              </pre>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={copyToClipboard}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={() => setWidgetToken(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Generate New Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets Integration */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Google Sheets Integration</h2>
        
        {!sheetIntegration ? (
          <form onSubmit={handleSheetIntegration} className="space-y-4">
            <div>
              <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700">
                Google Sheet ID
              </label>
              <input
                type="text"
                id="sheetId"
                name="sheetId"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter the Google Sheet ID"
              />
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">
                Service Account Email
              </label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your-service-account@project.iam.gserviceaccount.com"
              />
            </div>

            <div>
              <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700">
                Private Key
              </label>
              <textarea
                id="privateKey"
                name="privateKey"
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
              />
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                Project ID
              </label>
              <input
                type="text"
                id="projectId"
                name="projectId"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your-project-id"
              />
            </div>

            <button
              type="submit"
              disabled={isConfiguring}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isConfiguring ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isConfiguring ? 'Setting up...' : 'Setup Integration'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sheet ID: {sheetIntegration.sheetId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last synced:{' '}
                    {sheetIntegration.lastSync
                      ? new Date(sheetIntegration.lastSync).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={handleManualExport}
                    disabled={isExporting}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isExporting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isExporting ? 'Exporting...' : 'Export Now'}
                  </button>
                  <button
                    onClick={handleRemoveIntegration}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Remove Integration
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={sheetIntegration.settings.autoSync}
                  onChange={(e) =>
                    onUpdate({
                      sheetSettings: {
                        ...sheetIntegration.settings,
                        autoSync: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-900">
                  Auto-sync enabled
                </label>
              </div>

              <div className="flex items-center">
                <select
                  value={sheetIntegration.settings.syncInterval}
                  onChange={(e) =>
                    onUpdate({
                      sheetSettings: {
                        ...sheetIntegration.settings,
                        syncInterval: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-2">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowSubdomains"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onChange={(e) => onUpdate({ allowSubdomains: e.target.checked })}
            />
            <label htmlFor="allowSubdomains" className="ml-2 text-gray-700">
              Allow widget on subdomains
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireAuthentication"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              defaultChecked
              disabled
            />
            <label htmlFor="requireAuthentication" className="ml-2 text-gray-700">
              Require member authentication (recommended)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 