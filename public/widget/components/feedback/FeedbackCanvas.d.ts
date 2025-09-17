import { Pin } from './store';
interface FeedbackCanvasProps {
    pins: Pin[];
    onPinClick: (pin: Pin) => void;
    selectedPinId?: string;
    className?: string;
}
export declare const FeedbackCanvas: ({ pins, onPinClick, selectedPinId, className }: FeedbackCanvasProps) => import("react/jsx-runtime").JSX.Element;
export {};
