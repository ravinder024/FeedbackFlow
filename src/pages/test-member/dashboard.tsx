import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { UserRole } from '@/types/roles';
import TestMemberDashboard from '@/components/dashboard/TestMemberDashboard';
import FeedbackHistory from '@/components/feedback/FeedbackHistory';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';

export default function TestMemberDashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!session?.user || session.user.role !== UserRole.TEST_MEMBER) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Member Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <section>
          <TestMemberDashboard />
        </section>

        <section>
          <FeedbackHistory />
        </section>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user || session.user.role !== UserRole.TEST_MEMBER) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}; 