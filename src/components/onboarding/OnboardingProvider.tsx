import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminOnboarding from './AdminOnboarding';
import ModeratorOnboarding from './ModeratorOnboarding';
import TestMemberOnboarding from './TestMemberOnboarding';
import { UserRole } from '@/types/roles';

interface OnboardingContextType {
  completed: boolean;
  setCompleted: (val: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export default function OnboardingProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [completed, setCompleted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show onboarding if not completed (could check localStorage or user profile)
    if (!completed && session?.user?.role) {
      setShow(true);
    }
  }, [completed, session]);

  const handleComplete = () => {
    setCompleted(true);
    setShow(false);
    // Optionally persist completion (e.g., localStorage or API)
  };

  return (
    <OnboardingContext.Provider value={{ completed, setCompleted }}>
      {show && session?.user?.role === UserRole.ADMIN && (
        <AdminOnboarding onComplete={handleComplete} />
      )}
      {show && session?.user?.role === UserRole.MODERATOR && (
        <ModeratorOnboarding onComplete={handleComplete} />
      )}
      {show && session?.user?.role === UserRole.TEST_MEMBER && (
        <TestMemberOnboarding onComplete={handleComplete} />
      )}
      {children}
    </OnboardingContext.Provider>
  );
} 