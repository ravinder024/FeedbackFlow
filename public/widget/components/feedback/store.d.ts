export type PinStatus = 'new' | 'inProgress' | 'resolved';
export interface Pin {
    id: string;
    pageUrl: string;
    xPercent: number;
    yPercent: number;
    status: PinStatus;
    userId: string;
    createdAt: string;
}
interface FeedbackStore {
    pins: Pin[];
    selectedPinId?: string;
    setPins: (pins: Pin[]) => void;
    setSelectedPin: (pinId?: string) => void;
    addPin: (pin: Pin) => void;
    updatePinStatus: (pinId: string, status: PinStatus) => void;
}
export declare const useFeedbackStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FeedbackStore>>;
export {};
