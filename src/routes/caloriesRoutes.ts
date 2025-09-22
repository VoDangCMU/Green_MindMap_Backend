import {Router} from "express";
import controller from "@root/controller";


const caloriesRouter = Router();

caloriesRouter.post('/create-calories', controller.calories.CreateCalories);
caloriesRouter.get('/get-calories', controller.calories.GetCalories);
caloriesRouter.get('/get-calories-by-id:id', controller.calories.GetCaloriesById);
caloriesRouter.put('/update-calories:id', controller.calories.UpdateCalories);
caloriesRouter.delete('/delete-calories:id', controller.calories.DeleteCalories);

export default caloriesRouter;