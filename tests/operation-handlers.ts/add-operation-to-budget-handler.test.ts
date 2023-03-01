import {PeriodRecord} from "../../records/period.record";
import {BasicNeeds, OperationType, PaymentCategory,} from "../../types";
import {OperationRecord} from "../../records/operation.record";
import {AddOperationToBudgetHandler} from "../../utils/add-operation-to-budget-handler";
import {pool} from "../../utils/db";

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

beforeAll(async () => {
    await firstTestPeriod.insert();
    await defaultOperationRecord.insert();
});

afterAll(async () => {
    await firstTestPeriod.delete();
    await defaultOperationRecord.delete();
    await pool.end();
});

test(`AddOperationToBudgetHandler can modify actual user's period record and update the database.`, async () => {
    const actualPeriod = await PeriodRecord.getActual(firstTestPeriod.userId);
    const newOperation = new OperationRecord({
        ...defaultOperationRecord,
    });

    const actualPeriodToCompare = new PeriodRecord({
        ...actualPeriod,
    });

    await AddOperationToBudgetHandler(newOperation, actualPeriod);

    expect(actualPeriod.freeCashAmount).toBe(actualPeriodToCompare.freeCashAmount + defaultOperationRecord.amount);
    expect(actualPeriod.paymentsAmount).toBe(actualPeriodToCompare.paymentsAmount - defaultOperationRecord.amount);
});

test(`AddOperationToBudgetHandler can modify actual user's period record depending on operation's type and update the database.`, async () => {
    const actualPeriod = await PeriodRecord.getActual(firstTestPeriod.userId);
    const newOperation = new OperationRecord({
        ...defaultOperationRecord,
        type: OperationType.AddToSavings,
        amount: -50,
    });

    const actualPeriodToCompare = new PeriodRecord({
        ...actualPeriod,
    });

    await AddOperationToBudgetHandler(newOperation, actualPeriod);

    expect(actualPeriod.freeCashAmount).toBe(actualPeriodToCompare.freeCashAmount + newOperation.amount);
    expect(actualPeriod.savingsAmount).toBe(actualPeriodToCompare.savingsAmount - newOperation.amount);
});