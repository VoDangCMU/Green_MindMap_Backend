import { Router } from 'express';
import traitController from '../controller/traitController';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';

const traitRouter = Router();
traitRouter.use(jwtAuthMiddleware); // Re-enable JWT middleware for all trait routes
traitRouter.post('/trait/create', traitController.createTrait);
traitRouter.get('/trait/:id', traitController.getTraitById);
traitRouter.put('/trait/update/:id', traitController.updateTraitById);
traitRouter.delete('/trait/delete/:id', traitController.deleteTraitById);

export default traitRouter;