export interface RoomPlayer {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  position: 0 | 1 | 2 | 3;
  team: 0 | 1;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  joinedAt: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  maxPlayers: number;
  createdAt: string;
  expiresAt: string;
}

// API request/response types

export interface CreateRoomResponse {
  room: Room;
  player: RoomPlayer;
}

export interface JoinRoomRequest {
  code: string;
  username: string;
}

export interface JoinRoomResponse {
  room: Room;
  player: RoomPlayer;
}

export interface ReadyToggleResponse {
  player: RoomPlayer;
  allReady: boolean;
}
