import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { signupSchema, loginSchema, refreshSchema } from "../validators/auth.validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", authRateLimiter, validateBody(signupSchema), authController.signupHandler);
router.post("/login", authRateLimiter, validateBody(loginSchema), authController.loginHandler);
router.post("/refresh", validateBody(refreshSchema), authController.refreshHandler);
router.post("/logout", validateBody(refreshSchema), authController.logoutHandler);
router.get("/me", requireAuth, authController.meHandler);

export default router;