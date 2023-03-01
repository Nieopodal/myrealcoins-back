import {add} from "date-fns";
import {pool} from "../../utils/db";
import {PeriodRecord} from "../../records/period.record";
import {NewPeriodEntity} from "../../types";
import {getStandardFormattedDateTime} from "../../utils/datetime-handlers";

const firstTestPeriod = new PeriodRecord({
    id: "[TEST]",
    userId: "testUserId",
    isActive: false,
    starts: "2023-02-01 00:00:00",
    ends: "2023-02-28 23:59:59",
    budgetAmount: 6000,
    paymentsAmount: 3000,
    savingsAmount: 2000,
    freeCashAmount: 1000,
    createdAt: "2023-02-27 12:48:32",
});

const secondTestPeriod = new PeriodRecord({
    id: "[TEST]2",
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

const defaultFourthPeriodObj: NewPeriodEntity = {
    userId: "[TEST]4",
    budgetAmount: 500,
    freeCashAmount: 100,
    isActive: false,
    paymentsAmount: 100,
    savingsAmount: 100
};

beforeAll(async () => {
    await firstTestPeriod.insert();
    await secondTestPeriod.insert();
});

afterAll(async () => {
    await firstTestPeriod.delete();
    await secondTestPeriod.delete();

    const thirdPeriodObj = await PeriodRecord.getOne('[TEST]3', '[TEST]3');
    await thirdPeriodObj.delete();

    const fourthPeriodObj = await PeriodRecord.getOne('[TEST]4', '[TEST]4');
    await fourthPeriodObj.delete();

    await pool.end();
});

test('PeriodRecord.getOne returns data from database for one entry.', async () => {
    const per = await PeriodRecord.getOne('[TEST]', 'testUserId');

    expect(per).toBeDefined();
    expect(per.id).toBe('[TEST]');
    expect(per.userId).toBe('testUserId');
    expect(per.isActive).toBe(false);
    expect(per.starts).toBe('2023-02-01 00:00:00');
    expect(per.ends).toBe('2023-02-28 23:59:59');
    expect(per.budgetAmount).toBe(6000.00);
    expect(per.paymentsAmount).toBe(3000.00);
    expect(per.savingsAmount).toBe(2000.00);
    expect(per.freeCashAmount).toBe(1000.00);
});

test('PeriodRecord.getOne returns null for non-existing entry.', async () => {
    const op = await PeriodRecord.getOne('[non-existing-entry]', 'testUserId');
    expect(op).toBeNull();
});

test('PeriodRecord.getOne returns null when operation ID is valid, but userID is wrong.', async () => {
    const op = await PeriodRecord.getOne('[TEST]2', '[non-existing-userId]');
    expect(op).toBeNull();
});

test('PeriodRecord.getAll returns an array of found entries.', async () => {

    const opArray = await PeriodRecord.getAll('testUserId');
    expect(opArray).not.toEqual([]);
    expect(opArray[0].id).toBeDefined();
});

test('PeriodRecord.getAll returns empty array of found entries when userId is wrong.', async () => {

    const opArray = await PeriodRecord.getAll('[non-existing-userId]');
    expect(opArray).toEqual([]);
});

test('PeriodRecord.changeBudgetOperation increases budgetAmount and freeCashAmount when amount is greater than 0 and updates the database.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    const predictedBudgetAmount = per.budgetAmount + 200;
    const predictedFreeCashAmount = per.freeCashAmount + 200;
    await per.changeBudgetOperation(200);
    const updatedPer = await PeriodRecord.getOne('[TEST]2', 'testUserId');

    expect(updatedPer.budgetAmount).toBe(predictedBudgetAmount);
    expect(updatedPer.freeCashAmount).toBe(predictedFreeCashAmount);
});

test('PeriodRecord.changeBudgetOperation reduces budgetAmount and freeCashAmount when amount is smaller than 0 and updates the database.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    const predictedBudgetAmount = per.budgetAmount - 1;
    const predictedFreeCashAmount = per.freeCashAmount - 1;
    await per.changeBudgetOperation(-1);

    const updatedPer = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    expect(updatedPer.budgetAmount).toBe(predictedBudgetAmount);
    expect(updatedPer.freeCashAmount).toBe(predictedFreeCashAmount);
});

test('PeriodRecord.changeBudgetOperation throws when given amount is greater than 999999999.99, when amount is greater than freeCashAmount when reducing and when amount = 0.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    await expect(async () => await per.changeBudgetOperation(9999999999999999999)).rejects.toThrow('Przekroczono maksymalną kwotę budżetu wynoszącą 999 999 999.99');

    await expect(async () => await per.changeBudgetOperation(-99999999999)).rejects.toThrow('Kwota operacji przewyższa sumę dostępnych środków.');
    await expect(async () => await per.changeBudgetOperation(0)).rejects.toThrow('Kwota operacji nie może wynosić 0.00.');
});

test('PeriodRecord.addPaymentOperation reduces freeCashAmount and increases paymentsAmount.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');

    const predictedFreeCashAmount = per.freeCashAmount - 1;
    const predictedPaymentsAmount = per.paymentsAmount + 1;
    await per.addPaymentOperation(-1);
    const updatedPer = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    expect(updatedPer.freeCashAmount).toBe(predictedFreeCashAmount);
    expect(updatedPer.paymentsAmount).toBe(predictedPaymentsAmount);
});

test('PeriodRecord.addPaymentOperation throws when given amount is greater than freeCashAmount or is incorrect.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    await expect(async () => await per.addPaymentOperation(1)).rejects.toThrow('Given amount should be smaller than 0.');

    await expect(async () => await per.addPaymentOperation(-99999999999)).rejects.toThrow('Kwota operacji przewyższa sumę dostępnych środków.');
});

test('PeriodRecord.addToSavingsOperation reduces freeCashAmount and increases savingsAmount.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');

    const predictedFreeCashAmount = per.freeCashAmount - 1;
    const predictedSavingsAmount = per.savingsAmount + 1;
    await per.addToSavingsOperation(-1);
    const updatedPer = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    expect(updatedPer.freeCashAmount).toBe(predictedFreeCashAmount);
    expect(updatedPer.savingsAmount).toBe(predictedSavingsAmount);
});

test('PeriodRecord.addToSavingsOperation throws when given amount is greater than freeCashAmount or is incorrect.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    await expect(async () => await per.addToSavingsOperation(1)).rejects.toThrow('Given amount should be smaller than 0.');

    await expect(async () => await per.addToSavingsOperation(-99999999999)).rejects.toThrow('Kwota operacji przewyższa sumę dostępnych środków.');
});

test('PeriodRecord.addFromSavingsOperation reduces savingsAmount and increases freeCashAmount.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');

    const predictedFreeCashAmount = per.freeCashAmount + 1;
    const predictedSavingsAmount = per.savingsAmount - 1;
    await per.addFromSavingsOperation(1);
    const updatedPer = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    expect(updatedPer.freeCashAmount).toBe(predictedFreeCashAmount);
    expect(updatedPer.savingsAmount).toBe(predictedSavingsAmount);
});

test('PeriodRecord.addFromSavingsOperation throws when given amount is greater than freeCashAmount or is incorrect.', async () => {
    const per = await PeriodRecord.getOne('[TEST]2', 'testUserId');
    await expect(async () => await per.addFromSavingsOperation(-1)).rejects.toThrow('Given amount should be greater than 0.');

    await expect(async () => await per.addFromSavingsOperation(99999999999)).rejects.toThrow('Kwota operacji przewyższa sumę dostępnych środków.');
});

test(`PeriodRecord.getActual returns user's active period.`, async () => {

    const actualPer = await PeriodRecord.getActual('testUserId');

    expect(actualPer).toBeDefined();
    expect(actualPer.id).toBe('[TEST]2');
    expect(actualPer.userId).toBe('testUserId');
    expect(actualPer.isActive).toBe(true);
    expect(actualPer.starts).toBe('2023-02-01 00:00:00');
    expect(actualPer.ends).toBe('2023-02-28 23:59:59');
});

test(`PeriodRecord.getActual returns null when found 0 records in database.`, async () => {
    const per = await PeriodRecord.getActual('[non-existing-userId]');
    expect(per).toBeNull();
});

test('PeriodRecord.checkIfActualPeriodShouldEnd returns true when period should end.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        ends: '2023-01-31 23:59:59',
    });
    const checkIfPerShouldEnd = per.checkIfActualPeriodShouldEnd();
    expect(checkIfPerShouldEnd).toBe(true);
});

test('PeriodRecord.checkIfActualPeriodShouldEnd returns false when period.ends is later than now.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        ends: getStandardFormattedDateTime(add(new Date(), {
                days: 1,
            }),
        ),
    });
    const checkIfPerShouldEnd = per.checkIfActualPeriodShouldEnd();

    expect(checkIfPerShouldEnd).toBe(false);
});

test('PeriodRecord.insert inserts into database and returns an ID.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        userId: '[TEST]3',
        id: '[TEST]3',
        isActive: true,
    });

    const perId = await per.insert();
    expect(perId).toBe(per.id);

    const foundedPer = await PeriodRecord.getOne(per.id, per.userId);
    expect(foundedPer).toBeDefined();
});

test('PeriodRecord.insert throws if user has an active period.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        userId: '[TEST]3',
        isActive: true,
    });

    await expect(async () => await per.insert()).rejects.toThrow('User already has an active period. You need to close it before inserting a new one.');
});

test('PeriodRecord.closePeriod changes isActive to false and updates the database.', async () => {

    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        id: '[TEST]4',
        isActive: true,
    });
    await per.insert();

    expect(per.isActive).toBe(true);

    await per.closePeriod();
    expect(per.isActive).toBe(false);

    const updatedPer = await PeriodRecord.getOne(per.id, per.userId);
    expect(updatedPer.isActive).toBe(false);
});

test('PeriodRecord.delete removes record from database.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        userId: '[TEST]4'
    });

    await per.insert();
    const found = await PeriodRecord.getOne(per.id, per.userId);
    expect(found).toBeDefined();

    await per.delete();
    const foundAfterDelete = await PeriodRecord.getOne(per.id, per.userId);
    expect(foundAfterDelete).toBeNull();
});

test('PeriodRecord.reversePaymentOperation can reverse effects of given operation.', async () => {
    const per = new PeriodRecord({
        ...defaultFourthPeriodObj,
        userId: '[TEST]5'
    });

    const perToCompare = new PeriodRecord({
        ...per,
    });

    const paymentAmount = -1;

    await per.insert();
    await per.addPaymentOperation(paymentAmount);

    const perAfterPayment = await PeriodRecord.getOne(per.id, per.userId);

    expect(perAfterPayment.freeCashAmount).toBe(perToCompare.freeCashAmount + paymentAmount);
    expect(perAfterPayment.paymentsAmount).toBe(perToCompare.paymentsAmount - paymentAmount);

    await perAfterPayment.reversePaymentOperation(paymentAmount);

    const reversedPer = await PeriodRecord.getOne(perAfterPayment.id, perAfterPayment.userId);
    expect(reversedPer.freeCashAmount).toBe(perToCompare.freeCashAmount);
    expect(reversedPer.paymentsAmount).toBe(perToCompare.paymentsAmount);

    await reversedPer.delete();
});



