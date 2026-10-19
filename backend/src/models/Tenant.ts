import { Schema, model, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Tenant = model<ITenant>('Tenant', TenantSchema);
