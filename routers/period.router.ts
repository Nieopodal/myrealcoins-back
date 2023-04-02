import {Request, Response, Router} from "express";
import {PeriodRecord} from "../records/period.record";
import {user} from "./operation.router";    //@TODO remove this when UserRecord is ready.
import {OperationRecord} from "../records/operation.record";
import {sendErrorJsonHandler, sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {insertNewPeriodHandler} from "../utils/insert-new-period-handler";
import {createNewOperationFromRepetitiveHandler} from "../utils/create-new-operation-from-repetitive-handler";

export const periodRouter = Router()

    .post('/create-new-operation-from-schema/:id', async (req, res) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const isCreated = await createNewOperationFromRepetitiveHandler(req.params.id, user.id, actualPeriod);
        sendSuccessJsonHandler(res, isCreated);
    })

    .get('/', async (req: Request, res: Response) => {  //this will send all periods
        const periodList = await PeriodRecord.getAll(user.id);
        sendSuccessJsonHandler(res, periodList);
    })

    .get('/actual', async (req: Request, res: Response) => {   //this will send actual period or null
        const actualPeriod = await PeriodRecord.getActual(user.id);
        sendSuccessJsonHandler(res, actualPeriod);
    })

    .get('/:id', async (req: Request, res: Response) => {  //this will send found period or null
        const foundPeriod = await PeriodRecord.getOne(req.params.id, user.id);
        sendSuccessJsonHandler(res, foundPeriod);
    })

    .post('/', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        if (actualPeriod) {
            if (actualPeriod.checkIfActualPeriodShouldEnd()) {
                await actualPeriod.closePeriod();
                const newPeriod = await insertNewPeriodHandler(req, user.id);

                sendSuccessJsonHandler(res, newPeriod);
                return;
            }
            sendErrorJsonHandler(res, 'Aktualny okres jeszcze się nie zakończył.');
            return;
        }
        const repetitiveOperationIds = await insertNewPeriodHandler(req, user.id);
        sendSuccessJsonHandler(res, repetitiveOperationIds);
    })


    .delete('/:id', async (req: Request, res: Response) => {
        const foundPeriod = await PeriodRecord.getOne(req.params.id, user.id);
        const periodOperations = await OperationRecord.findPeriodOperations(foundPeriod.id, user.id);
        for (const operation of periodOperations) {
            await operation.delete();
        }
        await foundPeriod.delete();
        sendSuccessJsonHandler(res, true);
    });
