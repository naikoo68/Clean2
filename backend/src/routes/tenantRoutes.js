import { Router } from "express";
import { listTenants, getTenant, createTenant, updateTenantStatus } from "../controllers/tenantController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Super-admin only (the platform admin acts as super-admin until the dedicated
// super_admin role lands in Phase 4).
const superAdmin = [protect, authorize("admin")];

router.get("/", ...superAdmin, listTenants);
router.post("/", ...superAdmin, createTenant);
router.get("/:id", ...superAdmin, getTenant);
router.patch("/:id/status", ...superAdmin, updateTenantStatus);

export default router;
