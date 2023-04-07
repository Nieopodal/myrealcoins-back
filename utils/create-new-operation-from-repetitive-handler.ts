import {OperationRecord} from "../records/operation.record";
import {getStandardFormattedDateTime} from "./datetime-handlers";
import {AddOperationToBudgetHandler} from "./add-operation-to-budget-handler";
import {PeriodRecord} from "../records/period.record";
import {ValidationError} from "./error";

export const createNewOperationFromRepetitiveHandler = async (schemaId: string, userId: string, actualPeriod: PeriodRecord): Promise<true> => {
    const operationSchema = await OperationRecord.getOne(schemaId, userId);

    if (!operationSchema) {
        throw new ValidationError('Operacja nie została znaleziona.');
    }

    if (!operationSchema.isRepetitive || operationSchema.periodId) {
        throw new Error();
    }

    const properOperation = new OperationRecord({
        ...operationSchema,
        id: null,
        originId: operationSchema.id,
        periodId: actualPeriod.id,
        userId: userId,
        createdAt: getStandardFormattedDateTime(),
    });

    await AddOperationToBudgetHandler(properOperation, actualPeriod);
    await properOperation.insert();

    return true;
};