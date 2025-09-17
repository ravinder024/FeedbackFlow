import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSession } from 'next-auth/react';

export default function ProtectedTest() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
          
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <p className="block sm:inline"> You are authenticated and can view this protected content.</p>
          </div>

          <div className="mt-4 bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Your Profile</h2>
            <div className="text-sm space-y-2">
              <p><strong>Name:</strong> {session?.user?.name}</p>
              <p><strong>Email:</strong> {session?.user?.email}</p>
              {session?.user?.image && (
                <div>
                  <strong>Profile Image:</strong>
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="mt-2 w-16 h-16 rounded-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <h3 className="font-semibold mb-1">Session Data:</h3>
            <pre className="overflow-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 