import {Request, Response, Router} from "express";
import {OperationRecord} from "../records/operation.record";
import {NewOperationEntity} from "../types";
import {PeriodRecord} from "../records/period.record";
import {AddOperationToBudgetHandler} from "../utils/add-operation-to-budget-handler";
import {ReverseOperationHandler} from "../utils/reverse-operation-handler";
import {sendErrorJsonHandler, sendSuccessJsonHandler} from "../utils/json-response-handlers";

export const user = {
    id: '[test-user-id]',
};  // @TODO remember to remove this mock when UserRecord is ready.

export const operationRouter = Router()

    .get('/search/description?', async (req: Request, res: Response) => {
        try {
            const operationList = await OperationRecord.getAll(req.params.description ?? '', user.id);
            sendSuccessJsonHandler(res, operationList);

        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    })

    .get('/get-period-operations/:periodId', async (req: Request, res: Response) => {
        try {
            const operationList = await OperationRecord.findPeriodOperations(req.params.periodId, user.id);
            sendSuccessJsonHandler(res, operationList);


        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    })

    .get('/:id', async (req: Request, res: Response) => {
        try {
            const operation = await OperationRecord.getOne(req.params.id, user.id);
            sendSuccessJsonHandler(res, operation);


        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    })

    .post('/', async (req: Request, res: Response) => {

        try {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const newOperation = new OperationRecord({
                ...req.params,
                userId: user.id,
            } as NewOperationEntity);

            await AddOperationToBudgetHandler(newOperation, actualPeriod);
            const newOperationId = await newOperation.insert();
            sendSuccessJsonHandler(res, newOperationId);

        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    })

    .put('/:id', async (req: Request, res: Response) => {

        try {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

            await ReverseOperationHandler(foundOperation, actualPeriod);
            const editedOperation = new OperationRecord({
                ...req.params,
                id: foundOperation.id,
                userId: user.id,
            } as NewOperationEntity);

            const modifiedId = await editedOperation.update();
            sendSuccessJsonHandler(res, modifiedId);

        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    })

    .delete('/:id', async (req: Request, res: Response) => {
        try {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

            await ReverseOperationHandler(foundOperation, actualPeriod);
            const isRemoved = await foundOperation.delete();
            sendSuccessJsonHandler(res, isRemoved);

        } catch (e) {
            sendErrorJsonHandler(res, e.message);
        }
    });


