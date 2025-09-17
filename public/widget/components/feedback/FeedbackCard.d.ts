import { SessionStatus } from '@prisma/client';
interface FeedbackCardProps {
    feedback: {
        id: string;
        content: string;
        category: string | null;
        rating: number | null;
        qualityScore: number | null;
        createdAt: string;
        session: {
            id: string;
            status: SessionStatus;
        };
        user: {
            name: string | null;
            email: string | null;
        };
    };
    onStatusChange: (sessionId: string, newStatus: SessionStatus) => void;
}
export default function FeedbackCard({ feedback, onStatusChange }: FeedbackCardProps): import("react/jsx-runtime").JSX.Element;
export {};
