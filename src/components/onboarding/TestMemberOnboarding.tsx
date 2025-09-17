import { FC, useState } from 'react';
import Joyride, { Step } from 'react-joyride';

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome!',
    content: "This is your Test Member Dashboard. Let's take a quick tour of your key features.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="my-test-groups"]',
    content: 'See all your assigned test groups here.',
  },
  {
    target: '[data-tour="start-session"]',
    content: 'Start a new testing session with one click.',
  },
  {
    target: '[data-tour="feedback-history"]',
    content: 'Review your feedback history and progress.',
  },
  {
    target: '[data-tour="testing-guide"]',
    content: 'Read instructions and guidelines for effective testing.',
  },
];

const checklist = [
  'Welcome to your Test Member Dashboard! Here you can join and participate in test groups.',
  'Start testing sessions and provide feedback easily.',
  'Track your feedback history and progress.',
  'Read testing instructions and guidelines for best results.',
  'Reach out to moderators if you need help.',
];

const TestMemberOnboarding: FC<{ onComplete: () => void }> = ({ onComplete }) => {
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
        <h2 className="text-2xl font-bold mb-4">Test Member Onboarding</h2>
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

export default TestMemberOnboarding; 