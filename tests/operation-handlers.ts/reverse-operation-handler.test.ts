import {PeriodRecord} from "../../records/period.record";
import {OperationRecord} from "../../records/operation.record";
import {ReverseOperationHandler} from "../../utils/reverse-operation-handler";
import {BasicNeeds, OperationType, PaymentCategory} from "../../types";

import {pool} from "../../utils/db";

const defaultOperationRecord = new OperationRecord({
    userId: "test-user-id",
    periodId: "test-period-id",
    category: PaymentCategory.BasicNeeds,
    subcategory: BasicNeeds.Supermarket,
    description: "user-description",
    type: OperationType.Payment,
    amount: -20,
    imgUrl: "/test.jpg",
    isRepetitive: false,
    lat: 49.34342,
    lon: 49.34342,
});

const firstTestPeriod = new PeriodRecord({
    id: "[TEST]",
    userId: "testUserId",
    isActive: true,
    starts: "2023-02-01 00:00:00",
    ends: "2023-02-28 23:59:59",
    budgetAmount: 6000,
    paymentsAmount: 3000,
    savingsAmount: 2000,
    freeCashAmount: 1000,
    createdAt: "2023-02-27 12:48:32",
});

beforeAll(async () => {
    await firstTestPeriod.insert();
    await defaultOperationRecord.insert();
});

afterAll(async () => {
    await firstTestPeriod.delete();
    await defaultOperationRecord.delete();
    await pool.end();
});

test('ReverseOperationHandler can reverse operations.', async () => {

    const actualPeriod = await PeriodRecord.getActual(firstTestPeriod.userId);
    const foundOperation = await OperationRecord.getOne(defaultOperationRecord.id, defaultOperationRecord.userId);

    const foundOperationAmount = foundOperation.amount;
    const {freeCashAmount, paymentsAmount} = actualPeriod;

    await ReverseOperationHandler(foundOperation, actualPeriod);
    const modifiedActualPeriod = await PeriodRecord.getActual(firstTestPeriod.userId);

    expect(freeCashAmount).toBe(modifiedActualPeriod.freeCashAmount + foundOperationAmount);
    expect(paymentsAmount).toBe(modifiedActualPeriod.paymentsAmount - foundOperationAmount);

});