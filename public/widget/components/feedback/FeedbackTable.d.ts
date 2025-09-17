import { SessionStatus } from '@prisma/client';
interface FeedbackTableProps {
    testGroupId: string;
    onStatusChange: (sessionId: string, newStatus: SessionStatus) => void;
}
export default function FeedbackTable({ testGroupId, onStatusChange }: FeedbackTableProps): import("react/jsx-runtime").JSX.Element;
export {};
