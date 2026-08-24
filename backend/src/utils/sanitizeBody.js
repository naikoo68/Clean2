// Guards generic create/update handlers that spread the raw request body into a
// model (`Model.create({ ...req.body })` / `findByIdAndUpdate(id, { ...req.body })`).
//
// Without this, a caller can set fields that are meant to be assigned only by
// the server or by dedicated endpoints — a "mass assignment" hole. Concretely a
// client/institute-admin could otherwise:
//   - set `tenantId` to another institute → break multi-tenant isolation,
//   - set `owner` to claim/plant content in someone else's space,
//   - set `_id` to spoof or collide with an id,
//   - flip `deleted`/`deletedAt` to un-delete or hide records,
//   - forge a `publicToken` / inflate `publicViews` (public share links are
//     created only through the dedicated share endpoint).
//
// These are never legitimately set via the generic create/update body, so we
// strip them here. Everything else (the real content fields) passes through, so
// this is a denylist by design — safe against accidentally dropping valid
// fields as models grow.
const PROTECTED_FIELDS = [
  "_id",
  "id",
  "__v",
  "tenantId",
  "owner",
  "createdAt",
  "updatedAt",
  "deleted",
  "deletedAt",
  "publicToken",
  "publicViews",
];

// Return a shallow copy of `body` with protected fields removed. Pass `extra`
// to strip additional handler-specific fields.
export function sanitizeBody(body, extra = []) {
  const out = { ...(body || {}) };
  for (const field of PROTECTED_FIELDS) delete out[field];
  for (const field of extra) delete out[field];
  return out;
}
