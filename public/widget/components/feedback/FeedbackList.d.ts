import { Pin, PinStatus } from './store';
interface FeedbackListProps {
    pins: Pin[];
    onPinSelect: (pin: Pin) => void;
    onStatusChange: (pinId: string, status: PinStatus) => void;
    selectedPinId?: string;
    className?: string;
}
export declare const FeedbackList: ({ pins, onPinSelect, onStatusChange, selectedPinId, className }: FeedbackListProps) => import("react/jsx-runtime").JSX.Element;
export {};
