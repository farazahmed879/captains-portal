import mongoose, { Model } from 'mongoose';

/** Fields a client must never be able to set through a create/update body. */
const PROTECTED_FIELDS = ['_id', 'id', 'tenantId', 'createdAt', 'updatedAt', '__v'];

/** Returns a shallow copy of `body` without fields that would let a client re-home or forge a record. */
export const stripProtectedFields = <T extends Record<string, any>>(body: T): Partial<T> => {
  const clean: Record<string, any> = { ...(body || {}) };
  for (const field of PROTECTED_FIELDS) delete clean[field];
  return clean as Partial<T>;
};

export interface TenantRefCheck {
  model: Model<any>;
  ids: unknown;
  label: string;
}

/**
 * Verifies every referenced id exists inside the caller's tenant.
 * Empty values (undefined, null, '') are skipped so optional references still work.
 * Returns an error message for the first failing reference, or null if all are valid.
 */
export const findInvalidTenantRef = async (
  tenantId: string | undefined,
  checks: TenantRefCheck[]
): Promise<string | null> => {
  if (!tenantId) return 'Missing tenant context';

  for (const { model, ids, label } of checks) {
    const list = (Array.isArray(ids) ? ids : [ids])
      .filter((v) => v !== undefined && v !== null && v !== '')
      .map((v) => String(v));
    const unique = Array.from(new Set(list));
    if (unique.length === 0) continue;

    if (unique.some((v) => !mongoose.isValidObjectId(v))) {
      return `Invalid ${label} id`;
    }

    const found = await model.countDocuments({ _id: { $in: unique }, tenantId });
    if (found !== unique.length) {
      return `${label} not found`;
    }
  }
  return null;
};
