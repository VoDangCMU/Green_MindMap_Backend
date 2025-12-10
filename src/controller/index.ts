import user from "./userController";
import token from "./tokenController";
import questions from "./questionsController";
import template from "./templateController";
import trait from "./traitController";
import location from "./locationController";
import bigFive from "./bigFiveController";
import behavior from "./behaviorController";
import behaviorFeedback from "./behaviorFeedbackController";
import userAnswers from "./userAnswersController";
import surveyScenarios from "./surveyScenarioController";
import dailyPending from "./dailySpendingController";
import {modelController as model} from "./modelController";
import preAppSurvey from "./preAppSurveyController";
import questionSet from "./questionSetController";
import avgDailySpendMetric from "./metrics/averageDailySpendController";
import spendVariabilityMetric from "./metrics/spendVariabilityController";
import brandNoveltyMetric from "./metrics/brandNoveltyController";
import listAdherenceMetric from "./metrics/listAdherenceController";
import dailyDistanceKmMetric from "./metrics/dailyDistanceKmController";
import novelLocationRatioMetric from "./metrics/novelLocationRatioController";
import publicTransitRatioMetric from "./metrics/publicTransitRatioController";
import nightOutFreqMetric from "./metrics/nightOutFreqController";

export default {
    behavior,
    behaviorFeedback,
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
    nightOutFreqMetric,
    model,
    preAppSurvey,
    questions,
    questionSet,
    surveyScenarios,
    template,
    token,
    trait,
    user,
    userAnswers
};
