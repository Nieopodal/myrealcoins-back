import {PeriodRecord} from "../../records/period.record";
import {OperationRecord} from "../../records/operation.record";
import {createNewOperationFromRepetitiveHandler} from "../../utils/create-new-operation-from-repetitive-handler";
import {pool} from "../../utils/db";

afterAll(async () => {
    pool.end();
});

test('createNewOperationFromRepetitiveHandler can, based on a given scheme, create a new operation belonging to actual period.', async () => {
    const newPeriod = new PeriodRecord({
        budgetAmount: 5000,
        freeCashAmount: 5000,
        isActive: false,
        paymentsAmount: 0,
        savingsAmount: 0,
        userId: "[test-user-id-for-handlers]"
    });
    await newPeriod.insert();
    const rootOp = new OperationRecord({
        amount: -50,
        isRepetitive: true,
        type: 1,
        category: 1,
        subcategory: 1,
        userId: newPeriod.userId,
        description: 'test-description-for-handler-testing',
        createdAt: '2023-01-01 12:00:00',
    });
    await rootOp.insert();

    await createNewOperationFromRepetitiveHandler(rootOp.id, newPeriod.userId, newPeriod);
    const found = await OperationRecord.findPeriodOperations(newPeriod.id, newPeriod.userId);
    expect(found.length).toBe(1);
    expect(found[0].periodId).toBe(newPeriod.id);
    expect(found[0].originId).toBe(rootOp.id);
    expect(found[0].createdAt).not.toBe(rootOp.createdAt);

    await newPeriod.delete();
    await rootOp.delete();
    await found[0].delete();

});