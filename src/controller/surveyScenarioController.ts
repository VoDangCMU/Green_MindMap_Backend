import { RequestHandler } from "express";
import { z } from "zod";
import { In } from "typeorm";
import NUMBER from "../config/schemas/Number";
import TEXT from "../config/schemas/Text";

import { SurveyScenario } from "../entity/survey_scenario";
import { Locations } from "../entity/locations";
import { Questions } from "../entity/questions";
import { User } from "../entity/user";
import { ScenarioAssignment } from "../entity/scenario_assignments";
import AppDataSource from "../infrastructure/database";
import {SimulatedSurvey} from "../entity/simulated_survey";



const SurveyScenarioParamsSchema = z.object({
    minAge: NUMBER,
    maxAge: NUMBER,
    address: z.string().optional(),
    percentage: NUMBER,
    gender: TEXT.optional(),
});

const QuestionIdsSchema = z.object({
    questionIds: z.array(z.string().uuid()).min(1, {
        message: "At least one question ID is required",
    }),
});


class SurveyScenarioController {
    private SurveyScenarioRepo = AppDataSource.getRepository(SurveyScenario);
    private QuestionsRepo = AppDataSource.getRepository(Questions);
    private LocationRepo = AppDataSource.getRepository(Locations);
    private UserRepo = AppDataSource.getRepository(User);
    private SimulatedSurveyRepo = AppDataSource.getRepository(SimulatedSurvey);


    public CreateSurveyScenario: RequestHandler = async (req, res) => {
        try {
            const parsed = SurveyScenarioParamsSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({
                    success: false,
                    message: "Invalid input",
                    error: parsed.error.format(),
                });

            const { minAge, maxAge, percentage, address, gender } = parsed.data;

            if (minAge > maxAge)
                return res.status(400).json({ success: false, message: "Min age cannot be greater than max age" });

            if (percentage <= 0 || percentage > 100)
                return res.status(400).json({ success: false, message: "Percentage must be between 1 and 100" });

            let location;
            if (address) {
                location = await this.LocationRepo.findOne({ where: { address } });
                if (!location)
                    return res.status(404).json({ success: false, message: "Location not found" });
            }
            if (!gender) {
                return res.status(400).json({ success: false, message: "Gender must be provided" });
            }
            const scenario = this.SurveyScenarioRepo.create({
                minAge,
                maxAge,
                percentage,
                location,
                status: "draft",
            });

            if (gender.toLowerCase() !== "all") {
                scenario.gender = gender.toLowerCase();
            }
            await this.SurveyScenarioRepo.save(scenario);

            return res.status(201).json({
                success: true,
                message: "Survey scenario created successfully",
                data: scenario,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public AttachQuestions: RequestHandler = async (req, res) => {
        try {
            const { id: scenarioId } = req.params;
            const parsed = QuestionIdsSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ success: false, message: "Invalid input", error: parsed.error.format() });

            const scenario = await this.SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["questions"],
            });
            if (!scenario)
                return res.status(404).json({ success: false, message: "Scenario not found" });

            const questions = await this.QuestionsRepo.findBy({ id: In(parsed.data.questionIds) });
            if (questions.length !== parsed.data.questionIds.length)
                return res.status(404).json({ success: false, message: "One or more questions not found" });

            scenario.questions = questions;
            await this.SurveyScenarioRepo.save(scenario);

            return res.status(200).json({
                success: true,
                message: "Questions attached successfully",
                data: scenario,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public GetSurveyScenarios: RequestHandler = async (_req, res) => {
        try {
            const scenarios = await this.SurveyScenarioRepo.find({
                relations: ["location", "questions", "simulatedSurvey"],
                order: { createdAt: "DESC" },
            });

            return res.status(200).json({
                success: true,
                message: "Survey scenarios retrieved successfully",
                data: scenarios,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public DeleteSurveyScenario: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.SurveyScenarioRepo.delete(id);
            if (result.affected === 0)
                return res.status(404).json({ success: false, message: "Scenario not found" });

            return res.status(200).json({
                success: true,
                message: "Survey scenario deleted successfully",
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public SimulateScenario: RequestHandler = async (req, res) => {
        try {
            const { id: scenarioId } = req.params;

            const scenario = await this.SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["location", "questions"],
            });

            if (!scenario)
                return res.status(404).json({ success: false, message: "Scenario not found" });

            if (!scenario.questions?.length)
                return res.status(400).json({
                    success: false,
                    message: "Please attach at least one question before simulating"
                });

            const { minBirthDate, maxBirthDate } = this.calculateAgeDateRange(
                scenario.minAge,
                scenario.maxAge
            );

            const eligibleQuery = this.buildEligibleUsersQuery({
                minBirthDate,
                maxBirthDate,
                address: scenario.location?.address,
                gender: scenario.gender,
            });

            const totalEligible = await eligibleQuery.getCount();

            if (totalEligible === 0)
                return res.status(400).json({
                    success: false,
                    message: "No eligible users found for this scenario"
                });

            const targetCount = Math.ceil(totalEligible * (scenario.percentage / 100));

            const allEligibleUsers = await eligibleQuery
                .leftJoinAndSelect("user.locations", "location")
                .getMany();

            const shuffled = allEligibleUsers.sort(() => Math.random() - 0.5);
            const assignedUsers = shuffled.slice(0, targetCount);
            const unassignedUsers = shuffled.slice(targetCount);

            const today = new Date();
            const eligibleUsersData = allEligibleUsers.map((user) => {
                const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
                const age = dob
                    ? Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : null;

                const isAssigned = assignedUsers.some(u => u.id === user.id);

                return {
                    userId: user.id,
                    username: user.username || "",
                    fullName: user.fullName || "",
                    age,
                    gender: user.gender || null,
                    location: user.locations?.[0]?.address || scenario.location?.address || null,
                    status: (isAssigned ? "assigned" : "not_assigned") as "assigned" | "not_assigned",
                };
            });

            const result = await AppDataSource.transaction(async (manager) => {
                const assignmentRepo = manager.getRepository(ScenarioAssignment);
                const scenarioRepo = manager.getRepository(SurveyScenario);
                const simulatedRepo = manager.getRepository(SimulatedSurvey);


                const assignedAssignments = assignedUsers.map((user) =>
                    assignmentRepo.create({
                        scenario: { id: scenarioId } as SurveyScenario,
                        user: { id: user.id } as User,
                        status: "assigned"
                    })
                );

                const unassignedAssignments = unassignedUsers.map((user) =>
                    assignmentRepo.create({
                        scenario: { id: scenarioId } as SurveyScenario,
                        user: { id: user.id } as User,
                        status: "not_assigned"
                    })
                );

                const allAssignments = [...assignedAssignments, ...unassignedAssignments];
                await assignmentRepo.save(allAssignments);

                const simulation = simulatedRepo.create({
                    scenario: { id: scenarioId } as SurveyScenario,
                    totalEligible,
                    targetCount,
                    assignedCount: assignedAssignments.length,
                    unassignedCount: unassignedAssignments.length,
                    eligibleUsers: eligibleUsersData,
                    triggeredBy: req.user ? ({ id: (req.user as any).userId } as User) : undefined,
                    status: "completed",
                    notes: `Simulation completed: ${assignedAssignments.length} assigned, ${unassignedAssignments.length} not assigned out of ${totalEligible} eligible users.`,
                });

                const savedSimulation = await simulatedRepo.save(simulation);

                await scenarioRepo.update(scenarioId, { status: "sent" });

                return {
                    assignedCount: assignedAssignments.length,
                    unassignedCount: unassignedAssignments.length,
                    totalAssignments: allAssignments.length,
                    simulationId: savedSimulation.id,
                    simulation: savedSimulation,
                    eligibleUsers: eligibleUsersData,
                };
            });

            return res.status(200).json({
                success: true,
                message: `Scenario simulated successfully. Assigned to ${result.assignedCount} users, ${result.unassignedCount} eligible but not assigned`,
                data: {
                    scenarioId: scenario.id,
                    simulationId: result.simulationId,
                    totalEligible,
                    targetCount,
                    assigned: result.assignedCount,
                    unassigned: result.unassignedCount,
                    totalRecorded: result.totalAssignments,
                    simulation: {
                        status: result.simulation.status,
                        createdAt: result.simulation.createdAt,
                        notes: result.simulation.notes,
                    },
                    eligibleUsers: result.eligibleUsers,
                },
            });
        } catch (error: any) {
            console.error("SimulateScenario Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    };

    public GetSimulatedDetails: RequestHandler = async (req, res) => {
        try {
            const { id: scenarioId } = req.params;

            const simulatedSurvey = await this.SimulatedSurveyRepo.findOne({
                where: { scenario: { id: scenarioId } },
                relations: ["scenario", "scenario.location", "scenario.questions", "triggeredBy"],
            });

            if (!simulatedSurvey)
                return res.status(404).json({
                    success: false,
                    message: "No simulation found for this scenario"
                });

            const scenario = simulatedSurvey.scenario;
            const eligibleUsers = simulatedSurvey.eligibleUsers || [];

            return res.status(200).json({
                success: true,
                message: "Simulated scenario details retrieved successfully",
                data: {
                    simulationId: simulatedSurvey.id,
                    scenarioId: scenario.id,
                    scenarioStatus: scenario.status,
                    simulation: {
                        totalEligible: simulatedSurvey.totalEligible,
                        targetCount: simulatedSurvey.targetCount,
                        assigned: simulatedSurvey.assignedCount,
                        unassigned: simulatedSurvey.unassignedCount,
                        status: simulatedSurvey.status,
                        notes: simulatedSurvey.notes,
                        triggeredBy: simulatedSurvey.triggeredBy?.username || simulatedSurvey.triggeredBy?.fullName || "System",
                        triggeredAt: simulatedSurvey.createdAt,
                        updatedAt: simulatedSurvey.updatedAt,
                    },
                    demographics: {
                        minAge: scenario.minAge,
                        maxAge: scenario.maxAge,
                        location: scenario.location?.address || "All locations",
                        gender: scenario.gender || "All genders",
                        percentage: scenario.percentage,
                    },
                    questions: scenario.questions?.map(q => ({
                        id: q.id,
                        question: q.question,
                    })) || [],
                    eligibleUsers: eligibleUsers,
                },
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    };

    private calculateAgeDateRange(minAge: number, maxAge: number) {
        const today = new Date();
        return {
            minBirthDate: new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate()),
            maxBirthDate: new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()),
        };
    }

    private buildEligibleUsersQuery(args: {
        minBirthDate: Date;
        maxBirthDate: Date;
        address?: string;
        gender?: string;
    }) {
        const { minBirthDate, maxBirthDate, address, gender } = args;
        const qb = this.UserRepo.createQueryBuilder("user")
            .where("user.dateOfBirth BETWEEN :minBirthDate AND :maxBirthDate", { minBirthDate, maxBirthDate });

        if (address)
            qb.innerJoin("user.locations", "loc").andWhere("loc.address = :addr", { addr: address });
        if (gender)
            qb.andWhere("user.gender = :gender", { gender });

        return qb;
    }
}

export default new SurveyScenarioController();
