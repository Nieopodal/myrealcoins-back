import {Request} from "express";
import {PeriodRecord} from "../records/period.record";
import {OperationRecord} from "../records/operation.record";

export const insertNewPeriodHandler = async (req: Request, userId: string): Promise<OperationRecord[]> => {
    const newPeriod = new PeriodRecord({
        ...req.body,            //@TODO do we need req.body?
        id: null,
        userId: userId,
        isActive: true,
        freeCashAmount: 5000,
        budgetAmount: 5000, //@TODO change to user
    });
    await newPeriod.insert();

    return await OperationRecord.findRepetitiveOperations(userId);
};