import { create } from 'zustand';
import { PublicGameState, Card, PrivatePlayerState } from '@/types/game';

interface GameStore {
  // Public state — broadcast to all players
  gameState: PublicGameState | null;

  // Private state — only for the local player
  myHand: Card[];
  legalPlays: string[]; // card ids

  // Local UI state
  selectedCardId: string | null;
  isMyTurn: boolean;
  myPosition: 0 | 1 | 2 | 3 | null;
  myUserId: string | null;

  // Setters
  setGameState: (state: PublicGameState) => void;
  setPrivateState: (state: PrivatePlayerState) => void;
  setSelectedCard: (cardId: string | null) => void;
  setMyPosition: (position: 0 | 1 | 2 | 3) => void;
  setMyUserId: (userId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  myHand: [],
  legalPlays: [],
  selectedCardId: null,
  isMyTurn: false,
  myPosition: null,
  myUserId: null,

  setGameState: (gameState) => {
    const { myPosition } = get();
    const isMyTurn =
      myPosition !== null &&
      gameState.currentTrick?.currentTurn === myPosition;
    set({ gameState, isMyTurn });
  },

  setPrivateState: ({ hand, legalPlays }) =>
    set({ myHand: hand, legalPlays }),

  setSelectedCard: (selectedCardId) => set({ selectedCardId }),

  setMyPosition: (myPosition) => set({ myPosition }),

  setMyUserId: (myUserId) => set({ myUserId }),

  reset: () =>
    set({
      gameState: null,
      myHand: [],
      legalPlays: [],
      selectedCardId: null,
      isMyTurn: false,
      myPosition: null,
    }),
}));
