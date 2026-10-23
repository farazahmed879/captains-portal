import { SponsorContractType, SponsorStatus, SponsorTxType, PaymentMethod } from '../constants';

export interface SponsorTransaction {
  _id: string;
  sponsorId: string | Sponsor;
  type: SponsorTxType;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod | string;
  tournamentId?: any;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sponsor {
  _id: string;
  teamId: any;
  sponsorName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  contractType: SponsorContractType | string;
  status?: SponsorStatus | string;
  amountInvested?: number;
  totalPayouts?: number;
  netBalance?: number;
  deliverablesAgreed?: string;
  notes?: string;
  transactions?: SponsorTransaction[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSponsorFormValues {
  teamId: string;
  contractType: string;
  companyName: string;
  sponsorName: string;
  amountInvested: number | '';
  deliverablesAgreed: string;
}

export interface EditSponsorFormValues {
  companyName: string;
  sponsorName: string;
  phone?: string;
  email?: string;
  contractType: string;
  status?: string;
  deliverablesAgreed: string;
  notes?: string;
}

export interface SponsorTxFormValues {
  type: SponsorTxType;
  amount: number | '';
  date: string;
  paymentMethod: string;
  tournamentId: string;
  notes: string;
}

export interface SponsorTransactionFormValues {
  type: SponsorTxType;
  amount: number;
  date: string;
  method: string;
  reference: string;
  tournamentId: string;
  notes: string;
}
