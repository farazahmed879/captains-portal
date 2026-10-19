import { Schema, model, Document, Types } from 'mongoose';

export interface IPlayer extends Document {
  tenantId: Types.ObjectId;
  teamIds: Types.ObjectId[];
  name: string;
  phone?: string;
  email?: string;
  role: 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
  battingStyle: 'right_hand' | 'left_hand';
  bowlingStyle: 'right_arm_fast' | 'right_arm_medium' | 'right_arm_spin' | 'left_arm_fast' | 'left_arm_spin' | 'none';
  jerseyNumber?: number;
  profilePhoto?: string;
  isRegular: boolean;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
      default: 'all_rounder',
    },
    battingStyle: {
      type: String,
      enum: ['right_hand', 'left_hand'],
      default: 'right_hand',
    },
    bowlingStyle: {
      type: String,
      enum: ['right_arm_fast', 'right_arm_medium', 'right_arm_spin', 'left_arm_fast', 'left_arm_spin', 'none'],
      default: 'right_arm_medium',
    },
    jerseyNumber: { type: Number },
    profilePhoto: { type: String },
    isRegular: { type: Boolean, default: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PlayerSchema.index({ tenantId: 1, name: 1 });

export const Player = model<IPlayer>('Player', PlayerSchema);
