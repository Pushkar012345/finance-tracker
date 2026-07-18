import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validateBody } from "../middleware/validate";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", categoryController.listCategories);
router.post("/", validateBody(createCategorySchema), categoryController.createCategory);
router.patch("/:id", validateBody(updateCategorySchema), categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;