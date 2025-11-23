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
import healthyFoodRatioMetric from "./metrics/healthyFoodRatioController";

export default {
    behavior,
    bigFive,
    dailyPending,
    location,
    avgDailySpendMetric,
    healthyFoodRatioMetric,
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
