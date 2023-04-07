import {PeriodRecord} from "../records/period.record";
import {OperationRecord} from "../records/operation.record";
import {UserRecord} from "../records/user.record";

export const insertNewPeriodHandler = async (userId: string, newUser?: boolean): Promise<OperationRecord[] | PeriodRecord> => {
    const user = await UserRecord.getOneById(userId);

    if (!user) {
        throw new Error('User not found.');
    }

    const newPeriod = new PeriodRecord({
        id: null,
        userId: userId,
        isActive: true,
        freeCashAmount: user.defaultBudgetAmount,
        budgetAmount: user.defaultBudgetAmount,
        paymentsAmount: 0,
        savingsAmount: 0,
        ends: null,
        starts: null,
        createdAt: null,
    });
    await newPeriod.insert();

    if (newUser) {
        return newPeriod;
    }

    return await OperationRecord.findRepetitiveOperations(userId);
};