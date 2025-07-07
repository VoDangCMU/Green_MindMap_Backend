import { healthCheckController } from "./check.controller";

export class Controller {
    private static instance: Controller;

    getHealthCheckController() {
        return healthCheckController;
    }

}

export default Controller;
