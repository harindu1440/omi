import { create } from 'zustand';
import { Room, RoomPlayer } from '@/types/room';

interface RoomStore {
  room: Room | null;
  myPlayer: RoomPlayer | null;
  isLoading: boolean;
  error: string | null;

  setRoom: (room: Room) => void;
  setMyPlayer: (player: RoomPlayer) => void;
  updatePlayer: (updated: RoomPlayer) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  myPlayer: null,
  isLoading: false,
  error: null,

  setRoom: (room) => set({ room }),
  setMyPlayer: (myPlayer) => set({ myPlayer }),
  updatePlayer: (updated) =>
    set((state) => ({
      room: state.room
        ? {
            ...state.room,
            players: state.room.players.map((p) =>
              p.userId === updated.userId ? updated : p,
            ),
          }
        : null,
      myPlayer:
        state.myPlayer?.userId === updated.userId ? updated : state.myPlayer,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ room: null, myPlayer: null, isLoading: false, error: null }),
}));
