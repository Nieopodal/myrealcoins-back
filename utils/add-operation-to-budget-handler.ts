import {NewOperationEntity, OperationType} from "../types";
import {PeriodRecord} from "../records/period.record";

export const AddOperationToBudgetHandler = async (newOperation: NewOperationEntity, actualPeriod: PeriodRecord) => {
    if (!newOperation) {
        throw new Error('Operation not found.')
    }
    switch (newOperation.type) {
        case OperationType.AddToBudget: {
            await actualPeriod.changeBudgetOperation(newOperation.amount);
            break;
        }
        case OperationType.BudgetReduction: {
            await actualPeriod.changeBudgetOperation(newOperation.amount);
            break;
        }
        case OperationType.Payment: {
            await actualPeriod.addPaymentOperation(newOperation.amount);
            break;
        }
        case OperationType.AddToSavings: {
            await actualPeriod.addToSavingsOperation(newOperation.amount);
            break;
        }
        case OperationType.AddFromSavings: {
            await actualPeriod.addFromSavingsOperation(newOperation.amount);
            break;
        }
        case OperationType.AddToCushion: {
            await actualPeriod.addToCushionOperation(newOperation.amount);
            break;
        }
        case OperationType.AddFromCushion: {
            await actualPeriod.addFromCushionOperation(newOperation.amount);
            break;
        }
        default:
            throw new Error('Incorrect Operation Type.');
    }
};