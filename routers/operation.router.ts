import {Request, Response, Router} from "express";
import {OperationRecord} from "../records/operation.record";
import {NewOperationEntity} from "../types";
import {PeriodRecord} from "../records/period.record";
import {AddOperationToBudgetHandler} from "../utils/add-operation-to-budget-handler";
import {ReverseOperationHandler} from "../utils/reverse-operation-handler";
import {sendSuccessJsonHandler} from "../utils/json-response-handlers";

export const user = {
    id: '[test-user-id]',
};  // @TODO remember to remove this mock when UserRecord is ready.

export const operationRouter = Router()

    .get('/search/description?', async (req: Request, res: Response) => {
            const operationList = await OperationRecord.getAll(req.params.description ?? '', user.id);
            sendSuccessJsonHandler(res, operationList);
    })

    .get('/get-period-operations/:periodId', async (req: Request, res: Response) => {
            const operationList = await OperationRecord.findPeriodOperations(req.params.periodId, user.id);
            sendSuccessJsonHandler(res, operationList);
    })

    .get('/:id', async (req: Request, res: Response) => {
            const operation = await OperationRecord.getOne(req.params.id, user.id);
            sendSuccessJsonHandler(res, operation);
    })

    .post('/', async (req: Request, res: Response) => {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const newOperation = new OperationRecord({
                ...req.body,
                userId: user.id,
                periodId: actualPeriod.id,
            } as NewOperationEntity);
            await AddOperationToBudgetHandler(newOperation, actualPeriod);
            const newOperationId = await newOperation.insert();
            sendSuccessJsonHandler(res, newOperationId);
    })

    .post('/repetitive-operation', async (req, res) => {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const newRootOperation = new OperationRecord({
                ...req.body,
                periodId: null,
                isRepetitive: true,
                userId: user.id,
            } as NewOperationEntity);

            const newActualOperation = new OperationRecord({
                ...newRootOperation,
                id: null,
                periodId: actualPeriod.id,
                originId: newRootOperation.id,
            });
            await AddOperationToBudgetHandler(newActualOperation, actualPeriod);
            await newRootOperation.insert();
            const newOperationId = await newActualOperation.insert();
            sendSuccessJsonHandler(res, newOperationId);
    })

    .put('/:id', async (req: Request, res: Response) => {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

            await ReverseOperationHandler(foundOperation, actualPeriod);
            const editedOperation = new OperationRecord({
                ...req.body,
                id: foundOperation.id,
                userId: user.id,
            } as NewOperationEntity);
            const modifiedId = await editedOperation.update();
            sendSuccessJsonHandler(res, modifiedId);
    })

    .delete('/:id', async (req: Request, res: Response) => {
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);
            if (foundOperation.periodId) {
                await ReverseOperationHandler(foundOperation, actualPeriod);
            }
            const isRemoved = await foundOperation.delete();
            sendSuccessJsonHandler(res, isRemoved);
    });


