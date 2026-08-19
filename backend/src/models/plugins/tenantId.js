import mongoose from "mongoose";

// Global Mongoose plugin (Phase 2). Adds an optional `tenantId` to every model
// schema so records can be scoped to an institute (tenant). Applied globally in
// config/registerModelPlugins.js BEFORE any model schema is compiled.
//
// Design notes:
// - NO index is declared here on purpose. A global plugin also runs on embedded
//   sub-document schemas; declaring an index here would create junk indexes on
//   the PARENT collection at the sub-path. The real tenantId indexes are created
//   on the top-level collections by the migration (scripts/migrateTenants.js).
// - Phase 2 only ADDS the field — it does NOT filter/scope anything, so the app
//   keeps behaving exactly as before. The auto-scoping query hooks will be added
//   to THIS plugin in Phase 3 (with a Tenant-model exemption).
export default function tenantIdPlugin(schema) {
  // Skip embedded sub-document schemas (they don't own a collection).
  if (schema.options && schema.options._id === false) return;
  // Don't redefine if a schema already declares it.
  if (schema.path("tenantId")) return;
  schema.add({ tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", default: null } });
}
