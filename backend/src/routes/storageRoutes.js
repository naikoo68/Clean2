import { Router } from "express";
import { storageStats, cleanupAttempts } from "../controllers/storageController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const admin = [protect, authorize("admin")];

router.get("/admin/storage", ...admin, storageStats);
router.post("/admin/storage/cleanup", ...admin, cleanupAttempts);

export default router;
