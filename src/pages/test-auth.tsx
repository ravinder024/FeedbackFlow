import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export default function TestAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Log session data for debugging
    console.log('Session:', session);
    console.log('Status:', status);
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold">Status</h2>
            <p className="text-sm">{status}</p>
          </div>

          {session ? (
            <>
              <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-semibold">User Information</h2>
                <div className="text-sm space-y-2">
                  <p><strong>Name:</strong> {session.user?.name}</p>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  {session.user?.image && (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Sign In with Google
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <pre className="overflow-auto bg-gray-100 p-2 rounded">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 