import user from "./userController";
import token from "./tokenController";
import questions from "./questionsController";
import template from "./templateController";
import trait from "./traitController";
import location from "./locationController";
import bigFive from "./bigFiveController";
import behavior from "./behaviorController";
import threadHall from "./threadHallController";
import userAnswers from "./userAnswersController";
import surveyScenarios from "./surveyScenarioController";
import dailyPending from "./dailySpendingController";
import {modelController as model} from "./modelController";
import preAppSurvey from "./preAppSurveyController";
import nightOutFreq from "./nighOutFreqController";
import avgDailySpendMetric from "./metrics/averageDailySpendController";
import spendVariabilityMetric from "./metrics/spendVariabilityController";
import brandNoveltyMetric from "./metrics/brandNoveltyController";
import listAdherenceMetric from "./metrics/listAdherenceController";
import dailyDistanceKmMetric from "./metrics/dailyDistanceKmController";
import novelLocationRatioMetric from "./metrics/novelLocationRatioController";
import publicTransitRatioMetric from "./metrics/publicTransitRatioController";

export default {
    behavior,
    bigFive,
    dailyPending,
    location,
    avgDailySpendMetric,
    spendVariabilityMetric,
    brandNoveltyMetric,
    listAdherenceMetric,
    dailyDistanceKmMetric,
    novelLocationRatioMetric,
    publicTransitRatioMetric,
    model,
    nightOutFreq,
    preAppSurvey,
    questions,
    surveyScenarios,
    template,
    threadHall,
    token,
    trait,
    user,
    userAnswers
};
