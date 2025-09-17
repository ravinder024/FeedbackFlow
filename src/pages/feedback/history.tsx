import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import FeedbackHistory from '@/components/feedback/FeedbackHistory';

interface FeedbackHistoryPageProps {
  feedbackItems: any[]; // Replace with proper type from your schema
}

export default function FeedbackHistoryPage({ feedbackItems }: FeedbackHistoryPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Feedback History</h1>
          <FeedbackHistory items={feedbackItems} />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Fetch feedback items for the user
  const feedbackItems = await prisma.testFeedback.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        {
          session: {
            testGroup: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      session: {
        include: {
          testGroup: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    props: {
      feedbackItems: JSON.parse(JSON.stringify(feedbackItems)),
    },
  };
}; 