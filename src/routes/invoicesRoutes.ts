import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const invoicesRouter = Router();
invoicesRouter.use(jwtAuthMiddleware);
invoicesRouter.post('/invoices/create-invoice', controller.invoices.CreateInvoice);
invoicesRouter.get('/invoices/get-invoices', controller.invoices.GetInvoices);
invoicesRouter.get('/invoices/get-invoices-by-id/:id', controller.invoices.GetInvoiceById);
invoicesRouter.put('/invoices/update-invoice/:id', controller.invoices.UpdateInvoice);
invoicesRouter.delete('/invoices/delete-invoice/:id', controller.invoices.DeleteInvoice);

export default invoicesRouter;