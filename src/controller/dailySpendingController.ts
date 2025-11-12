import { Request, Response } from "express";
import { z } from "zod";
import { Between } from "typeorm";
import axios from "axios";
import AppDataSource from "../infrastructure/database";
import { AvgDailySpend } from "../entity/avg_daily_spend";
import { Invoices } from "../entity/invoices";
import { User } from "../entity/user";
import { BigFive } from "../entity/big_five";
import NUMBER from "../config/schemas/Number";

const DailySpendingRepo = AppDataSource.getRepository(AvgDailySpend);
const InvoiceRepo = AppDataSource.getRepository(Invoices);
const UserRepo = AppDataSource.getRepository(User);

const API_URL = "https://ai-greenmind.khoav4.com/avg_daily_spend";

const DEFAULTS = {
    weight: 0.2,
    sigma_r: 1.0,
    alpha: 0.5,
};

const DailySpendingParamsSchema = z.object({
    date: z.string().date().optional(),
    dailyTotal: z.number().optional(),
    direction: z.string().default("down"),
    baseAvg: z.number(),
    weight: z.number().min(0).max(1).optional().default(DEFAULTS.weight),
    sigma_r: z.number().optional().default(DEFAULTS.sigma_r),
    alpha: z.number().optional().default(DEFAULTS.alpha),
});

const AnalyzeResponseSchema = z.object({
    metric: z.string(),
    vt: NUMBER,
    bt: NUMBER,
    r: NUMBER,
    n: NUMBER,
    contrib: NUMBER,
    new_ocean_score: z.object({
        O: NUMBER,
        C: NUMBER,
        E: NUMBER,
        A: NUMBER,
        N: NUMBER,
    })
})
export class DailySpendingController {
    public CreateAvgDailySpend = async (req: Request, res: Response) => {
        try {
            const parsed = DailySpendingParamsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid parameters", details: parsed.error.errors });
            }

            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = await UserRepo.findOne({
                where: { id: userId },
                relations: { bigFive: true }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (!parsed.data.baseAvg) {
                return res.status(400).json({ error: "Base average is required" });
            }

            const targetDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            const startDate = new Date(targetDate);

            const endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999);

            let dailyTotal: number;

            if (!parsed.data.dailyTotal) {
                const invoices = await InvoiceRepo.find({
                    where: {
                        user: { id: userId },
                        issuedDate: Between(startDate, endDate),
                    },
                });
                if (invoices.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No invoices found for this date",
                        date: targetDate.toISOString().split("T")[0],
                    });
                }

                dailyTotal = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
            } else {
                dailyTotal = parsed.data.dailyTotal;
            }

            const saved = await DailySpendingRepo.save({
                user: user,
                totalDaily: dailyTotal,
                baseAvg: parsed.data.baseAvg,
                direction: parsed.data.direction,
                weight: parsed.data.weight,
                sigma_r: parsed.data.sigma_r,
                alpha: parsed.data.alpha,
                bigFiveBefore: user.bigFive,
            });

            return res.status(200).json({
                success: true,
                data: saved,
            });

        } catch (e) {
            return res.status(400).json({
                error: "Failed to calculate average daily spending",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };


    public AnalyzeAvgDailySpend = async (req: Request, res: Response) => {
        const {id} = req.params;
        try {
            const dailySpendRecord = await DailySpendingRepo.findOne({
                where: {id: id},
                relations: {
                    user: {bigFive: true},
                    bigFiveBefore: true,
                    bigFiveAfter: true
                }
            });

            if (!dailySpendRecord) {
                return res.status(404).json({ error: "Daily spending record not found" });
            }
            const payload = {
                daily_total: dailySpendRecord.totalDaily,
                base_avg: dailySpendRecord.baseAvg,
                direction: dailySpendRecord.direction,
                weight: dailySpendRecord.weight,
                sigma_r: dailySpendRecord.sigma_r,
                alpha: dailySpendRecord.alpha,
                ocean_score: dailySpendRecord.bigFiveBefore
            }
            const response = await axios.post(API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status !== 200) {
                return res.status(500).json({ error: "Analysis service error", details: response.data });
            }


            const parsed = AnalyzeResponseSchema.safeParse(response.data);

            if (!parsed.success) {
                return res.status(500).json({ error: "Invalid response from analysis service", details: parsed.error.errors });
            }

            const newBigFive = new BigFive();
            newBigFive.openness = parsed.data.new_ocean_score.O;
            newBigFive.conscientiousness = parsed.data.new_ocean_score.C;
            newBigFive.extraversion = parsed.data.new_ocean_score.E;
            newBigFive.agreeableness = parsed.data.new_ocean_score.A;
            newBigFive.neuroticism = parsed.data.new_ocean_score.N;

            await AppDataSource.getRepository(BigFive).save(newBigFive);
            dailySpendRecord.metric = parsed.data.metric;
            dailySpendRecord.vt = parsed.data.vt;
            dailySpendRecord.bt = parsed.data.bt;
            dailySpendRecord.r = parsed.data.r;
            dailySpendRecord.n = parsed.data.n;
            dailySpendRecord.contrib = parsed.data.contrib;
            dailySpendRecord.bigFiveAfter = newBigFive;

            dailySpendRecord.user.bigFive = newBigFive;
            await DailySpendingRepo.save(dailySpendRecord);

            await UserRepo.save(dailySpendRecord.user);
            // Ensure the response includes meaningful data
            return res.status(200).json({
                success: true,
                data: {
                    dailySpendRecord
                },
            });
        } catch (e) {
            return res.status(400).json({
                error: "Failed to analyze average daily spending",
                details: e instanceof Error ? e.message : String(e),
            })
        }
    }

    public GetAvgDailySpend = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const dailySpendRecord = await DailySpendingRepo.findOne({
                where: { id: id },
                relations: {
                    user: { bigFive: true },
                    bigFiveBefore: true,
                    bigFiveAfter: true
                },
            });

            if (!dailySpendRecord) {
                return res.status(404).json({ error: "Daily spending record not found" });
            }

            return res.status(200).json({
                success: true,
                data: dailySpendRecord,
            });
        } catch (e) {
            return res.status(400).json({
                error: "Failed to fetch average daily spending record",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    public DeleteAvgDailySpend = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const dailySpendRecord = await DailySpendingRepo.findOne({
                where: { id: id }
            });

            if (!dailySpendRecord) {
                return res.status(404).json({ error: "Daily spending record not found" });
            }

            await DailySpendingRepo.remove(dailySpendRecord);

            return res.status(200).json({
                success: true,
                message: "Daily spending record deleted successfully",
            });
        } catch (e) {
            return res.status(400).json({
                error: "Failed to delete average daily spending record",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    public GetAllAvgDailySpend = async (req: Request, res: Response) => {
        try {
            const dailySpendRecords = await DailySpendingRepo.find({
                relations: {
                    user: { bigFive: true },
                },
            });

            return res.status(200).json({
                success: true,
                data: dailySpendRecords,
            });
        } catch (e) {
            return res.status(400).json({
                error: "Failed to fetch all average daily spending records",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new DailySpendingController();
