import {Router} from "express";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
import controller from "../controller";
import multer from "multer";

// Cấu hình multer để xử lý upload ảnh
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const router = Router();

// Avg Daily Spend endpoints
router.get("/avg-daily-spend", jwtAuthMiddleware, controller.avgDailySpendMetric.getAvgDailySpend);
router.post("/avg-daily-spend", jwtAuthMiddleware, controller.avgDailySpendMetric.updateAvgSpend);

// Healthy Food Ratio endpoints
router.get("/healthy-food-ratio", jwtAuthMiddleware, controller.healthyFoodRatioMetric.getHealthyFoodRatio);
router.post("/healthy-food-ratio", jwtAuthMiddleware, upload.single('file'), controller.healthyFoodRatioMetric.createOrUpdateHealthyFoodRatio);

// Spend Variability endpoints
router.get("/spend-variability", jwtAuthMiddleware, controller.spendVariabilityMetric.getSpendVariability);

export default router;
