import {PeriodRecord} from "../../records/period.record";
import {OperationRecord} from "../../records/operation.record";
import {createNewOperationsFromRepetitiveHandler} from "../../utils/create-new-operations-from-repetitive-handler";
import {pool} from "../../utils/db";

afterAll(async () => {
    pool.end();
});

test('createNewOperationFromRepetitiveHandler can get all user`s root repetitive operations and create new ones which belongs to given period.', async () => {
    const newPeriod = new PeriodRecord({
        budgetAmount: 5000, freeCashAmount: 0, isActive: false, paymentsAmount: 0, savingsAmount: 5000, userId: "[test-user-id-for-handlers]"
    });
    await newPeriod.insert();
    const rootOp = new OperationRecord({
        amount: -50, isRepetitive: true, type: 1, category: 1, subcategory: 1, userId: newPeriod.userId, description: 'test-description-for-handler-testing',
    });
    await rootOp.insert();

    setTimeout(async () => {
        await createNewOperationsFromRepetitiveHandler(newPeriod.id, newPeriod.userId);
        const found = await OperationRecord.findPeriodOperations(newPeriod.id, newPeriod.userId);
        expect(found.length).toBe(1);
        expect(found[0].periodId).toBe(newPeriod.id);
        expect(found[0].originId).toBe(rootOp.id);
        expect(found[0].createdAt).not.toBe(rootOp.createdAt);

        await newPeriod.delete();
        await rootOp.delete();
        await found[0].delete();
    }, 1000);
});