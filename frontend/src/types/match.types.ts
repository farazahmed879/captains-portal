import { MatchResult, MatchStage, MatchType, PaymentMethod, PaymentStatus } from '../constants';

export interface MatchPayment {
  _id: string;
  matchId: string | Match;
  playerId: any;
  feeAssigned: number;
  feePaid: number;
  paymentStatus: PaymentStatus | string;
  paymentMethod: PaymentMethod | string;
  paymentDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Match {
  _id: string;
  teamId: any;
  tournamentId?: any;
  opponentTeam: string;
  venue: string;
  matchDate: string;
  matchType?: MatchType | string;
  tournamentStage?: MatchStage | string;
  stage?: MatchStage | string;
  perPlayerFee: number;
  totalMatchExpense: number;
  overs?: number;
  result?: MatchResult | string;
  ourScore?: string;
  opponentScore?: string;
  groundCost?: number;
  umpireCost?: number;
  ballCost?: number;
  refreshmentCost?: number;
  otherCosts?: number;
  winningPrizeMoney?: number;
  notes?: string;
  collectedAmount?: number;
  pendingAmount?: number;
  payments?: MatchPayment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMatchFormValues {
  teamId: string;
  tournamentId: string;
  opponentTeam: string;
  venue: string;
  matchDate: string;
  matchType: string;
  stage: string;
  perPlayerFee: number | '';
  totalMatchExpense: number | '';
  overs: number | '';
  notes: string;
}

export interface EditMatchFormValues {
  teamId?: string;
  tournamentId?: string;
  opponentTeam: string;
  venue: string;
  matchDate: string;
  matchType: string;
  stage: string;
  perPlayerFee: number | '';
  totalMatchExpense: number | '';
  overs?: number | '';
  result: string;
  notes: string;
}

export interface AssignSquadFeeFormValues {
  playerId: string;
  feeAssigned: number | '';
  feePaid: number | '';
  paymentMethod: string;
}

export interface EditPaymentFormValues {
  feePaid: number | '';
  paymentMethod: string;
  notes: string;
}
