import {Request, Response, Router} from "express";
import {OperationRecord} from "../records/operation.record";
import {ErrorResponse, SuccessResponse} from "../types";

import {NewOperationEntity, OperationEntity} from "../types";
import {PeriodRecord} from "../records/period.record";
import {AddOperationToBudgetHandler} from "../utils/add-operation-to-budget-handler";
import {ReverseOperationHandler} from "../utils/reverse-operation-handler";

export const user = {
    id: '[test-user-id]',
};
// @TODO remember to remove this mock when UserRecord is ready.

export const operationRouter = Router()

    .get('/search/description?', async (req:Request, res: Response) => {
        try{
            const operationList = await OperationRecord.getAll(req.params.description ?? '', user.id);

            res.json({
                success: true,
                payload: operationList,
            } as SuccessResponse<OperationEntity[]>);

        } catch(e) {
            res.json({
                success: false,
                error: e.message,
            } as ErrorResponse);
        }
    })

    .get('/:id', async (req: Request, res: Response) => {
        try{
            const operation = await OperationRecord.getOne(req.params.id, user.id);

            res.json({
                success: true,
                payload: operation,
            } as SuccessResponse<OperationEntity>);

        } catch(e) {
            res.json({
                success: false,
                error: e.message,
            } as ErrorResponse);
        }
    })

    .post('/:id', async (req: Request, res: Response) => {

        try{
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const newOperation = new OperationRecord({
                ...req.params,
                userId: user.id,
            } as NewOperationEntity);

            await AddOperationToBudgetHandler(newOperation, actualPeriod);
            const newOperationId = await newOperation.insert();

            res.json({
                success: true,
                payload: newOperationId,
            } as SuccessResponse<string>);

        } catch(e) {
            res.json({
                success: false,
                error: e.message,
            } as ErrorResponse);
        }
    })

    .put('/:id', async (req: Request, res: Response) => {

        try{
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

            await ReverseOperationHandler(foundOperation, actualPeriod);
            const editedOperation = new OperationRecord({
                ...req.params,
                id: foundOperation.id,
                userId: user.id,
            } as NewOperationEntity);

            const modifiedId = await editedOperation.update();

            res.json({
                success: true,
                payload: modifiedId,
            } as SuccessResponse<string>);
        } catch(e) {
            res.json({
                success: false,
                error: e.message,
            } as ErrorResponse);
        }
    })

    .delete('/:id', async (req: Request, res: Response) => {
        try{
            const actualPeriod = await PeriodRecord.getActual(user.id);
            const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

            await ReverseOperationHandler(foundOperation, actualPeriod);
            const isRemoved = await foundOperation.delete();

            res.json({
                success: true,
                payload: isRemoved,
            } as SuccessResponse<boolean>);

        } catch(e) {
            res.json({
                success: false,
                error: e.message,
            } as ErrorResponse);
        }
    })


