import { FC, useState } from 'react';
import Joyride, { Step } from 'react-joyride';

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome!',
    content: "This is the Admin Dashboard. Let's take a quick tour of your key features.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="platform-overview"]',
    content: 'View platform-wide analytics and health metrics here.',
  },
  {
    target: '[data-tour="user-management"]',
    content: 'Manage all users and promote moderators.',
  },
  {
    target: '[data-tour="system-settings"]',
    content: 'Configure system and billing settings.',
  },
  {
    target: '[data-tour="moderator-performance"]',
    content: 'Track moderator performance and activity.',
  },
];

const checklist = [
  'Welcome to the Admin Dashboard! Here you can manage the entire platform.',
  'Promote users to moderators and manage all test groups.',
  'View platform-wide analytics and system health.',
  'Configure billing and system settings.',
  'Access global user management and support tools.',
];

const AdminOnboarding: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [run, setRun] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        styles={{ options: { zIndex: 10000 } }}
        callback={data => {
          if (data.status === 'finished' || data.status === 'skipped') {
            setRun(false);
          }
        }}
      />
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">Admin Onboarding</h2>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          {checklist.map((step, i) => (
            <li key={i} className="text-gray-700">{step}</li>
          ))}
        </ol>
        <button
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold"
          onClick={onComplete}
        >
          Complete Onboarding
        </button>
      </div>
    </div>
  );
};

export default AdminOnboarding; 