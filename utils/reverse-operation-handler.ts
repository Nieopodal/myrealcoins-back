import {PeriodRecord} from "../records/period.record";
import {OperationEntity, OperationType} from "../types";

export const ReverseOperationHandler = async (foundOperation: OperationEntity, actualPeriod: PeriodRecord) => {

    if (!foundOperation) {
        throw new Error('Operation not found.')
    }
    switch (foundOperation.type) {
        case OperationType.AddToBudget: {
            await actualPeriod.changeBudgetOperation(foundOperation.amount * -1);
            break;
        }
        case OperationType.BudgetReduction: {
            await actualPeriod.changeBudgetOperation(foundOperation.amount * -1);
            break;
        }
        case OperationType.Payment: {
            await actualPeriod.reversePaymentOperation(foundOperation.amount);
            break;
        }
        case OperationType.AddToSavings: {
            await actualPeriod.addFromSavingsOperation(foundOperation.amount * -1);
            break;
        }
        case OperationType.AddFromSavings: {
            await actualPeriod.addToSavingsOperation(foundOperation.amount * -1);
            break;
        }
        case OperationType.AddToCushion: {
            await actualPeriod.addFromCushionOperation();
            break;
            //     @TODO need to make this working first
        }
        case OperationType.AddFromCushion: {
            await actualPeriod.addToCushionOperation();
            break;
            //     @TODO need to make this working first
        }
        default:
            throw new Error('Incorrect Operation Type.');
    }
};