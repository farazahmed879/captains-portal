import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  playerId?: Types.ObjectId;
  role: 'super_admin' | 'captain' | 'treasurer' | 'viewer';
  avatar?: string;
  isActive: boolean;
  dashboardSettings?: {
    widgets: string[];
    selections: {
      playerId?: string;
      tournamentId?: string;
      teamId?: string;
      sponsorId?: string;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    role: {
      type: String,
      enum: ['super_admin', 'captain', 'treasurer', 'viewer'],
      default: 'captain',
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    dashboardSettings: {
      widgets: { type: [String], default: [] },
      selections: {
        playerId: { type: String, default: 'all' },
        tournamentId: { type: String, default: 'all' },
        teamId: { type: String, default: 'all' },
        sponsorId: { type: String, default: 'all' },
      },
    },
  },
  { timestamps: true }
);

// Unique email per tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);
