import { Request, Response, RequestHandler } from "express";
import AppDataSource from "../infrastructure/database";
import { AvgDailySpend } from "../entity/daily_spend";
import { Brand } from "../entity/brands";
import { BigFive } from "../entity/big_five";
import { getLogger } from "../infrastructure/logger";
import axios from "axios";
import FormData from "form-data";

interface OCRResponse {
    doc: {
        source_id: string | null;
        currency: string;
        payment_method: string;
        notes: string | null;
    };
    vendor: {
        name: string;
        address: string | null;
        geo_hint: string | null;
    };
    datetime: {
        date: string;
        time: string | null;
    };
    items: any[];
    totals: {
        subtotal: number | null;
        discount: number | null;
        tax: number | null;
        grand_total: number;
    };
}

class OCRController {
    /**
     * Process OCR from image
     * POST /api/ocr
     * Body: multipart/form-data with file field
     */
    public processOCR: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "File is required" });
            return;
        }

        try {
            // Create FormData for API request
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            // Call OCR API
            const response = await axios.post<OCRResponse>(
                'https://ai-greenmind.khoav4.com/ocr_text',
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 30000
                }
            );

            const ocrResult = response.data;
            logger.info("OCR processed successfully", { userId, vendor: ocrResult.vendor.name });

            // Parse date from datetime.date (format: MM/DD/YYYY)
            const dateStr = ocrResult.datetime.date;
            const [month, day, year] = dateStr.split('/');
            const spendDate = new Date(`${year}-${month}-${day}`);

            // Update or create daily spend record
            const spendRepository = AppDataSource.getRepository(AvgDailySpend);

            // Check if record exists for this day
            let spendRecord = await spendRepository
                .createQueryBuilder("spend")
                .leftJoinAndSelect("spend.user", "user")
                .where("user.id = :userId", { userId })
                .andWhere("spend.day_spend = :day", { day: spendDate })
                .getOne();

            if (spendRecord) {
                // Add to existing total
                spendRecord.total_spend += ocrResult.totals.grand_total;
                await spendRepository.save(spendRecord);
                logger.info("Updated daily spend", { userId, date: spendDate, amount: ocrResult.totals.grand_total });
            } else {
                // Create new record
                const newSpend = spendRepository.create({
                    user: { id: userId } as any,
                    total_spend: ocrResult.totals.grand_total,
                    day_spend: spendDate
                });
                await spendRepository.save(newSpend);
                logger.info("Created daily spend record", { userId, date: spendDate, amount: ocrResult.totals.grand_total });
            }

            // Add vendor name to brands
            if (ocrResult.vendor.name) {
                const brandRepository = AppDataSource.getRepository(Brand);

                // Get the latest brand record
                const latestBrand = await brandRepository.findOne({
                    where: { userId },
                    order: { startDay: 'DESC' }
                });

                const currentDate = new Date();
                let shouldCreateNewRecord = true;

                if (latestBrand) {
                    // Calculate days difference
                    const daysDiff = Math.floor(
                        (currentDate.getTime() - latestBrand.startDay.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (daysDiff <= 7) {
                        // Add to existing record if not already exists
                        if (!latestBrand.brands.includes(ocrResult.vendor.name)) {
                            latestBrand.brands.push(ocrResult.vendor.name);
                            await brandRepository.save(latestBrand);
                            logger.info("Added vendor to existing brand record", { userId, vendor: ocrResult.vendor.name });
                        }
                        shouldCreateNewRecord = false;
                    }
                }

                if (shouldCreateNewRecord) {
                    // Create new brand record
                    const newBrand = brandRepository.create({
                        userId,
                        brands: [ocrResult.vendor.name],
                        startDay: currentDate
                    });
                    await brandRepository.save(newBrand);
                    logger.info("Created new brand record with vendor", { userId, vendor: ocrResult.vendor.name });
                }
            }

            // Get user's big_five data
            const bigFiveRepository = AppDataSource.getRepository(BigFive);
            const bigFive = await bigFiveRepository.findOne({
                where: { user: { id: userId } },
                relations: ['user']
            });

            // Prepare response with OCR result and big_five
            const responseData: any = {
                ...ocrResult
            };

            if (bigFive) {
                responseData.big_five = {
                    O: bigFive.openness,
                    C: bigFive.conscientiousness,
                    E: bigFive.extraversion,
                    A: bigFive.agreeableness,
                    N: bigFive.neuroticism
                };
            }

            // Return OCR result with big_five
            res.status(200).json(responseData);
        } catch (error) {
            logger.error("Error processing OCR", error as Error);

            if (axios.isAxiosError(error)) {
                res.status(error.response?.status || 500).json({
                    message: "OCR processing failed",
                    error: error.response?.data || error.message
                });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    };
}

export default new OCRController();
