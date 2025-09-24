import {Router} from 'express';
import traitController from '@root/controller/traitController';

const router = Router();

router.post('/trait/create', traitController.createTrait);
router.get('/trait/:id', traitController.getTraitById);
router.put('/trait/update/:id', traitController.updateTraitById);
router.delete('/trait/delete/:id', traitController.deleteTraitById);

export default router;