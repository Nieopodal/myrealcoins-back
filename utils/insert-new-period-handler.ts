import {Request} from "express";
import {PeriodRecord} from "../records/period.record";
import {user} from "../routers/operation.router";

export const insertNewPeriodHandler = async (req: Request): Promise<PeriodRecord> => {
    const newPeriod = new PeriodRecord({
        ...req.body,
        userId: user.id,
        isActive: true,
    });
    await newPeriod.insert();
    return newPeriod;
};