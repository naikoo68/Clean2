import Tenant from "../models/Tenant.js";

// Super-admin management of tenants (institutes). Phase 1: manual create/list/
// suspend so the super-admin can set institutes up and test the foundation.
// The public, paid, self-service onboarding that auto-creates a tenant arrives
// in Phase 5 (it will reuse createTenant's provisioning logic).
//
// All routes here run behind [protect, authorize("admin")] — the existing
// platform admin acts as the super-admin until the dedicated super_admin role
// lands in Phase 4.

const RESERVED_SLUGS = new Set([
  "www", "api", "app", "admin", "mail", "static", "assets", "cdn", "help",
  "support", "status", "blog", "docs", "dashboard", "login", "signup",
]);

const normSlug = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const sanitize = (t) => ({
  id: t._id,
  name: t.name,
  slug: t.slug,
  customDomain: t.customDomain || "",
  status: t.status,
  ownerName: t.ownerName || "",
  ownerEmail: t.ownerEmail || "",
  subscriptionPlan: t.subscriptionPlan,
  isTrial: t.isTrial,
  expiresAt: t.expiresAt,
  createdAt: t.createdAt,
});

// GET /api/tenants — list all institutes (newest first).
export async function listTenants(req, res) {
  const search = String(req.query.search || "").trim();
  const filter = { deleted: { $ne: true } };
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { slug: rx }, { ownerEmail: rx }];
  }
  const tenants = await Tenant.find(filter).sort("-createdAt").lean();
  res.json({ tenants: tenants.map(sanitize), total: tenants.length });
}

// GET /api/tenants/:id
export async function getTenant(req, res) {
  const t = await Tenant.findById(req.params.id);
  if (!t || t.deleted) return res.status(404).json({ message: "Tenant not found" });
  res.json(sanitize(t));
}

// POST /api/tenants — create an institute (super-admin, manual).
export async function createTenant(req, res) {
  const name = String(req.body?.name || "").trim();
  const slug = normSlug(req.body?.slug || name);
  if (!name) return res.status(400).json({ message: "Institute name is required" });
  if (!slug) return res.status(400).json({ message: "A valid subdomain is required" });
  if (RESERVED_SLUGS.has(slug)) return res.status(409).json({ message: "That subdomain is reserved. Please choose another." });

  const exists = await Tenant.findOne({ slug });
  if (exists) return res.status(409).json({ message: "That subdomain is already taken" });

  const t = await Tenant.create({
    name,
    slug,
    ownerName: String(req.body?.ownerName || "").trim(),
    ownerEmail: String(req.body?.ownerEmail || "").toLowerCase().trim(),
    status: req.body?.status === "active" ? "active" : "pending",
  });
  res.status(201).json(sanitize(t));
}

// PATCH /api/tenants/:id/status — activate / suspend an institute.
export async function updateTenantStatus(req, res) {
  const status = String(req.body?.status || "");
  if (!["pending", "active", "suspended"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const t = await Tenant.findById(req.params.id);
  if (!t || t.deleted) return res.status(404).json({ message: "Tenant not found" });
  t.status = status;
  await t.save();
  res.json(sanitize(t));
}
