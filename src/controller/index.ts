import user from "./userController";
import token from "./tokenController";
import invoices from "./invoicesController";
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
import metrics from "./metricsController";

export default {
    behavior,
    bigFive,
    dailyPending,
    invoices,
    location,
    metrics,
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
