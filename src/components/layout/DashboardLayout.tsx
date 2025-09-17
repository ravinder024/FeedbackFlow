import { ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserRole } from '@/types/roles';

interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
  icon?: string;
  description?: string;
}

const navigation: NavItem[] = [
  // Admin Navigation
  {
    label: 'Dashboard',
    href: '/admin/platform',
    roles: [UserRole.ADMIN],
    icon: '📊',
    description: 'System-wide analytics and metrics'
  },
  {
    label: 'User Management',
    href: '/admin/users',
    roles: [UserRole.ADMIN],
    icon: '👥',
    description: 'Manage all users on the platform'
  },
  {
    label: 'System Settings',
    href: '/admin/settings',
    roles: [UserRole.ADMIN],
    icon: '⚙️',
    description: 'Configure platform settings'
  },
  {
    label: 'Activity Logs',
    href: '/dashboard/activity',
    roles: [UserRole.ADMIN],
    icon: '📊',
    description: 'View system events and user activity'
  },
  {
    label: 'Billing',
    href: '/admin/billing',
    roles: [UserRole.ADMIN],
    icon: '💰',
    description: 'Manage billing and subscriptions'
  },
  
  // Moderator Navigation
  {
    label: 'Test Groups',
    href: '/test-groups/dashboard',
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
    icon: '🧪',
    description: 'Manage your test groups'
  },
  {
    label: 'PinFlow',
    href: '/pinflow',
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
    icon: '📍',
    description: 'Monitor feedback pin activity'
  },
  {
    label: 'Analytics',
    href: '/test-groups/analytics',
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
    icon: '📈',
    description: 'View feedback analytics'
  },
  {
    label: 'Reports',
    href: '/test-groups/reports',
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
    icon: '📝',
    description: 'Generate and view reports'
  },
  
  // Test Member Navigation
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: [UserRole.TEST_MEMBER],
    icon: '🏠',
    description: 'Your testing dashboard'
  },
  {
    label: 'Feedback History',
    href: '/feedback/history',
    roles: [UserRole.TEST_MEMBER, UserRole.MODERATOR, UserRole.ADMIN],
    icon: '📋',
    description: 'View your submitted feedback'
  },
  {
    label: 'Testing Guide',
    href: '/guide',
    roles: [UserRole.TEST_MEMBER, UserRole.MODERATOR, UserRole.ADMIN],
    icon: '📚',
    description: 'Learn how to provide effective feedback'
  },
];

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role as UserRole;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check session status and expiration
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (!sessionData || sessionData.expired || !sessionData.user) {
          await signOut({ redirect: true, callbackUrl: '/auth/signin' });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // If we can't verify the session, sign out as a precaution
        await signOut({ redirect: true, callbackUrl: '/auth/signin' });
      }
    };

    // Check immediately and then every minute
    if (status === 'authenticated') {
      checkSession();
      const interval = setInterval(checkSession, 60000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Handle unauthenticated state
  useEffect(() => {
    if (status === 'unauthenticated') {
      signOut({ redirect: true, callbackUrl: '/auth/signin' });
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredNav = navigation.filter(item => item.roles.includes(userRole));
  
  // Group navigation items by role for better organization
  const adminNavItems = filteredNav.filter(item => item.roles.includes(UserRole.ADMIN) && !item.roles.includes(UserRole.TEST_MEMBER));
  const moderatorNavItems = filteredNav.filter(item => 
    item.roles.includes(UserRole.MODERATOR) && 
    !item.roles.includes(UserRole.ADMIN) && 
    !item.roles.includes(UserRole.TEST_MEMBER)
  );
  const testMemberNavItems = filteredNav.filter(item => item.roles.includes(UserRole.TEST_MEMBER));

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect to home page if signOut fails
      router.push('/');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.MODERATOR:
        return 'bg-blue-100 text-blue-800';
      case UserRole.TEST_MEMBER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      let dataTour = undefined;
      if (item.label === 'User Management') dataTour = 'user-management';
      if (item.label === 'System Settings') dataTour = 'system-settings';
      if (item.label === 'Test Groups') dataTour = 'test-groups';
      if (item.label === 'Analytics') dataTour = 'analytics';
      if (item.label === 'Reports') dataTour = 'reports';
      if (item.label === 'Feedback History') dataTour = 'feedback-history';
      if (item.label === 'Testing Guide') dataTour = 'testing-guide';
      
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            router.pathname === item.href || router.pathname.startsWith(item.href + '/')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          {...(dataTour ? { 'data-tour': dataTour } : {})}
          title={isSidebarCollapsed ? item.label : undefined}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {!isSidebarCollapsed && <span>{item.label}</span>}
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard">
                  <span className="text-xl font-bold text-gray-800">FeedbackFlow</span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getRoleBadgeColor(userRole)}`}>
                  {userRole.toLowerCase().replace('_', ' ')}
                </span>
              </div>
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    {session?.user?.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name || ''}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        {session?.user?.name?.[0] || 'U'}
                      </div>
                    )}
                  </button>
                </div>
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="px-4 py-2 text-sm text-gray-700">
                      {session?.user?.name}
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {session?.user?.email}
                    </div>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <div className="ml-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    router.pathname === item.href
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="flex">
        {/* Side navigation for desktop */}
        <div className={`fixed inset-y-0 pt-16 ${isSidebarCollapsed ? 'w-14' : 'w-64'} transition-width duration-300 ease-in-out z-10`}>
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 h-full">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="px-3 mt-4">
                {userRole === UserRole.ADMIN && adminNavItems.length > 0 && (
                  <div className="mb-6">
                    {!isSidebarCollapsed && (
                      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                      </h3>
                    )}
                    <div className="mt-2 space-y-1">
                      {renderNavItems(adminNavItems)}
                    </div>
                  </div>
                )}
                
                {(userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR) && moderatorNavItems.length > 0 && (
                  <div className="mb-6">
                    {!isSidebarCollapsed && (
                      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Moderator
                      </h3>
                    )}
                    <div className="mt-2 space-y-1">
                      {renderNavItems(moderatorNavItems)}
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  {!isSidebarCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </h3>
                  )}
                  <div className="mt-2 space-y-1">
                    {renderNavItems(testMemberNavItems)}
                  </div>
                </div>

                {/* Collapse/Expand button */}
                <div className="px-3 mt-6">
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {isSidebarCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {!isSidebarCollapsed && <span className="ml-2">Collapse</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-14' : 'ml-64'}`}>
          <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 