import { Router } from "express";
import locationController from "../controller/locationController";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();

router.use(jwtAuthMiddleware);

// Tạo location mới (user gửi vị trí hiện tại)
router.post("/", locationController.createLocation);

// Lấy tất cả locations của user hiện tại
router.get("/", locationController.GetLocations);

// Lấy vị trí mới nhất của user
router.get("/latest", locationController.GetLatestLocation);

// Lấy một location cụ thể
router.get("/:id", locationController.getLocationById);

// Cập nhật location
router.put("/:id", locationController.updateLocationById);

// Xóa location
router.delete("/:id", locationController.deleteLocationById);

export default router;
