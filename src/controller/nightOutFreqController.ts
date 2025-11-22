import { Request, Response } from "express";
import { z } from "zod";
import axios from "axios";
import AppDataSource from "../infrastructure/database";
import { NightOutFreq } from "../entity/night_out_freq";
import { User } from "../entity/user";
import { BigFive } from "../entity/big_five";
import { PreAppSurvey } from "../entity/pre_app_survey";
import NUMBER from "../config/schemas/Number";
import TEXT from "../config/schemas/Text";
import { v4 as uuidv4 } from "uuid";

const NightOutFreqSchema = z.object({
    night_out_count: NUMBER.optional(),
    base_night_out: NUMBER,
    weight: NUMBER.optional().default(0.2),
    direction: TEXT.optional().default("up"),
    sigma_r: NUMBER.optional().default(1.0),
    alpha: NUMBER.optional().default(0.5),
    home_location: TEXT,
    ocean_score: z.object({
        O: NUMBER,
        C: NUMBER,
        E: NUMBER,
        A: NUMBER,
        N: NUMBER,
    }),
});

const ResponseSchema = z.object({
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
    }),
});

const AI_API_URL = "https://ai-greenmind.khoav4.com/night_out_freq";

const NightOutFreqRepository = AppDataSource.getRepository(NightOutFreq);
const BigFiveRepository = AppDataSource.getRepository(BigFive);
const UserRepository = AppDataSource.getRepository(User);
const PreAppSurveyRepository = AppDataSource.getRepository(PreAppSurvey);

export class NightOutFreqController {
    public async patchNightOut(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = await UserRepository.findOne({
                where: { id: userId },
                relations: ["bigFive"],
            });

            if (!user || !user.bigFive) {
                return res.status(404).json({ error: "User or User BigFive not found" });
            }

            const survey = await PreAppSurveyRepository.findOne({
                where: { user: { id: userId } },
            });

            if (!survey) {
                return res.status(404).json({
                    error: "PreAppSurvey not found for this user",
                });
            }

            let nightOut = await NightOutFreqRepository.findOne({
                where: { user: { id: userId } },
                relations: ["bigFiveBefore", "bigFiveAfter"],
            });

            if (!nightOut) {
                nightOut = NightOutFreqRepository.create({
                    id: uuidv4(),
                    night_out_count: 0,
                    base_night_out: survey.nightOutings ?? 0,
                    weight: 0.2,
                    direction: "up",
                    sigma_r: 1.0,
                    alpha: 0.5,
                    home_location: user.location ?? "unknown",
                    bigFiveBefore: user.bigFive,
                    user,
                });

                await NightOutFreqRepository.save(nightOut);
            }

            nightOut.night_out_count = (nightOut.night_out_count || 0) + 1;

            const payload = {
                night_out_count: nightOut.night_out_count,
                base_night_out: survey.nightOutings ?? 0,
                direction: nightOut.direction,
                weight: nightOut.weight,
                sigma_r: nightOut.sigma_r,
                alpha: nightOut.alpha,
                home_location: nightOut.home_location,
                ocean_score: {
                    O: user.bigFive.openness,
                    C: user.bigFive.conscientiousness,
                    E: user.bigFive.extraversion,
                    A: user.bigFive.agreeableness,
                    N: user.bigFive.neuroticism,
                },
            };

            const parsePayload = NightOutFreqSchema.safeParse(payload);
            if (!parsePayload.success) {
                return res.status(400).json({
                    error: "Invalid payload",
                    details: parsePayload.error.errors,
                });
            }

            const response = await axios.post(AI_API_URL, payload);
            const parsed = ResponseSchema.safeParse(response.data);

            if (!parsed.success) {
                return res.status(500).json({
                    error: "Invalid response from AI service",
                    details: parsed.error.errors,
                });
            }

            const updated = parsed.data.new_ocean_score;

            const newBigFive = BigFiveRepository.create({
                openness: updated.O,
                conscientiousness: updated.C,
                extraversion: updated.E,
                agreeableness: updated.A,
                neuroticism: updated.N,
            });

            await BigFiveRepository.save(newBigFive);

            nightOut.metric = parsed.data.metric;
            nightOut.vt = parsed.data.vt;
            nightOut.bt = parsed.data.bt;
            nightOut.r = parsed.data.r;
            nightOut.n = parsed.data.n;
            nightOut.contrib = parsed.data.contrib;
            nightOut.bigFiveAfter = newBigFive;

            user.bigFive = newBigFive;

            await NightOutFreqRepository.save(nightOut);
            await UserRepository.save(user);

            return res.status(200).json({
                data: {
                    user_id: userId,
                    night_out_count: nightOut.night_out_count,
                    ocean_score_before: payload.ocean_score,
                    ocean_score_after: updated,
                    metric: parsed.data.metric,
                    vt: parsed.data.vt,
                    bt: parsed.data.bt,
                    r: parsed.data.r,
                    n: parsed.data.n,
                    contrib: parsed.data.contrib,
                },
            });
        } catch (e) {
            console.error("Error in patchNightOut:", e);
            return res.status(500).json({
                error: "Failed to process night out behavior",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    }
}

export default new NightOutFreqController();
