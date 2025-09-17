import { FC, useState } from 'react';
import Joyride, { Step } from 'react-joyride';

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome!',
    content: "This is your Moderator Dashboard. Let's take a quick tour of your key features.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="test-groups"]',
    content: 'Create and manage your test groups here.',
  },
  {
    target: '[data-tour="invite-members"]',
    content: 'Easily invite team members by email. You can invite multiple members at once and assign them roles.',
  },
  {
    target: '[data-tour="member-management"]',
    content: 'Manage your test group members, their roles, and permissions.',
  },
  {
    target: '[data-tour="analytics"]',
    content: 'Track analytics and progress for your test groups.',
  },
  {
    target: '[data-tour="reports"]',
    content: 'Export test results and generate reports.',
  },
  {
    target: '[data-tour="group-settings"]',
    content: 'Customize your test group settings and manage member access.',
  },
];

const checklist = [
  'Welcome to the Moderator Dashboard! Here you can manage your test groups.',
  'Create your first test group to get started.',
  'Invite team members using their email addresses.',
  'Assign roles to members (Test Member or Moderator).',
  'Track analytics and export test results.',
  'Send announcements and manage group settings.',
];

const ModeratorOnboarding: FC<{ onComplete: () => void }> = ({ onComplete }) => {
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
        <h2 className="text-2xl font-bold mb-4">Moderator Onboarding</h2>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          {checklist.map((step, i) => (
            <li key={i} className="text-gray-700">{step}</li>
          ))}
        </ol>
        <div className="space-y-4">
          <button
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold"
            onClick={onComplete}
          >
            Complete Onboarding
          </button>
          <p className="text-sm text-gray-500 text-center">
            You can always access help and documentation from the settings menu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeratorOnboarding; 