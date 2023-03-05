import {OperationRecord} from "../records/operation.record";
import {getStandardFormattedDateTime} from "./datetime-handlers";

export const createNewOperationsFromRepetitiveHandler = async (periodId: string, userId: string) => {
    const repetitiveOperationList = await OperationRecord.findRepetitiveOperations(userId);

    for (const operation of repetitiveOperationList) {
        const properOperation = new OperationRecord({
            ...operation,
            id: null,
            originId: operation.id,
            periodId: periodId,
            userId: userId,
            createdAt: getStandardFormattedDateTime(),
        });
        await properOperation.insert();
    }
};