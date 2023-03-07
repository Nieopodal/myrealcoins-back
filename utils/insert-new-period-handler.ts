import {Request} from "express";
import {PeriodRecord} from "../records/period.record";

export const insertNewPeriodHandler = async (req: Request, userId: string): Promise<PeriodRecord> => {
    const newPeriod = new PeriodRecord({
        ...req.body,            //@TODO do we need req.body?
        id: null,
        userId: userId,
        isActive: true,
    });
    await newPeriod.insert();

    return newPeriod;
};