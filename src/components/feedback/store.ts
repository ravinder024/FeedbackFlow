import { create } from 'zustand';

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

export const useFeedbackStore = create<FeedbackStore>((set: any) => ({
  pins: [],
  selectedPinId: undefined,
  setPins: (pins: Pin[]) => set({ pins }),
  setSelectedPin: (pinId?: string) => set({ selectedPinId: pinId }),
  addPin: (pin: Pin) => set((state: FeedbackStore) => ({ pins: [...state.pins, pin] })),
  updatePinStatus: (pinId: string, status: PinStatus) =>
    set((state: FeedbackStore) => ({
      pins: state.pins.map((pin: Pin) => 
        pin.id === pinId ? { ...pin, status } : pin
      ),
    })),
}));
