import { PlayerRole, BattingStyle, BowlingStyle, PlayerReturnSource, PaymentMethod } from '../constants';

export interface Player {
  _id: string;
  name: string;
  jerseyNumber?: number | string;
  role?: PlayerRole | string;
  battingStyle?: BattingStyle | string;
  bowlingStyle?: BowlingStyle | string;
  phone?: string;
  notes?: string;
  totalFeeAssigned?: number;
  totalFeePaid?: number;
  totalReturned?: number;
  netBalance?: number;
  matchesPlayed?: number;
  tournamentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerReturn {
  _id: string;
  playerId: string | Player;
  amount: number;
  source: PlayerReturnSource | string;
  tournamentId?: any;
  matchId?: any;
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPlayerFormValues {
  name: string;
  jerseyNumber: number | '';
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  phone: string;
  email?: string;
  notes: string;
}

export interface EditPlayerFormValues {
  name: string;
  jerseyNumber: number | '';
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  phone: string;
  email?: string;
  kitSizeChest?: string;
  kitSizeTrouser?: string;
  notes: string;
}

export interface PlayerReturnFormValues {
  amount: number | '';
  source: PlayerReturnSource | string;
  paymentMethod?: PaymentMethod | string;
  returnDate?: string;
  tournamentId?: string;
  notes?: string;
}
