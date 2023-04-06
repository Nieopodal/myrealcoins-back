import {Response, Router} from "express";
import {PeriodRecord} from "../records/period.record";
import {OperationRecord} from "../records/operation.record";
import {sendErrorJsonHandler, sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {insertNewPeriodHandler} from "../utils/insert-new-period-handler";
import {createNewOperationFromRepetitiveHandler} from "../utils/create-new-operation-from-repetitive-handler";
import {verifyToken} from "../utils/user/auth-jwt";
import {UserRequest} from "../types/_auth/_auth";

export const periodRouter = Router()

    .post('/create-new-operation-from-schema/:id', verifyToken, async (req: UserRequest, res) => {
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        const isCreated = await createNewOperationFromRepetitiveHandler(req.params.id, req.userId, actualPeriod);
        sendSuccessJsonHandler(res, isCreated);
    })

    .get('/', verifyToken, async (req: UserRequest, res: Response) => {  //this will send all periods
        const periodList = await PeriodRecord.getAll(req.userId);
        sendSuccessJsonHandler(res, periodList);
    })

    .get('/actual', verifyToken, async (req: UserRequest, res: Response) => {   //this will send actual period or null
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        sendSuccessJsonHandler(res, actualPeriod);
    })

    .get('/:id', verifyToken, async (req: UserRequest, res: Response) => {  //this will send found period or null
        const foundPeriod = await PeriodRecord.getOne(req.params.id, req.userId);
        sendSuccessJsonHandler(res, foundPeriod);
    })

    .post('/', verifyToken, async (req: UserRequest, res: Response) => {
        console.log('tutaj jestm')
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        if (actualPeriod) {
            if (actualPeriod.checkIfActualPeriodShouldEnd()) {
                await actualPeriod.closePeriod();
                const RepetitiveOperations = await insertNewPeriodHandler(req.userId);

                sendSuccessJsonHandler(res, RepetitiveOperations);
                return;
            } else {
                sendErrorJsonHandler(res, 'Aktualny okres jeszcze się nie zakończył.');
                return;
            }
        }
        const newPeriod = await insertNewPeriodHandler(req.userId, true);
        sendSuccessJsonHandler(res, newPeriod);
    })


    .delete('/:id', verifyToken, async (req: UserRequest, res: Response) => {
        const foundPeriod = await PeriodRecord.getOne(req.params.id, req.userId);
        const periodOperations = await OperationRecord.findPeriodOperations(foundPeriod.id, req.userId);
        for (const operation of periodOperations) {
            await operation.delete();
        }
        await foundPeriod.delete();
        sendSuccessJsonHandler(res, true);
    });
