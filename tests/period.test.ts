import {pool} from "../utils/db";
import {PeriodRecord} from "../records/period.record";

afterAll(async () => {
    await pool.end();
});

test('PeriodRecord.getOne returns data from database for one entry.', async () => {
    const per = await PeriodRecord.getOne('[TEST]', 'testUserId');

    expect(per).toBeDefined();
    expect(per.id).toBe('[TEST]');
    expect(per.userId).toBe('testUserId');
    expect(per.isActive).toBe(true);
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
    const op = await PeriodRecord.getOne('[TEST]2', 'wrong-user-id');
    expect(op).toBeNull();
});

test('PeriodRecord.getAll returns an array of found entries.', async () => {

    const opArray = await PeriodRecord.getAll('testUserId');

    expect(opArray).not.toEqual([]);
    expect(opArray[0].id).toBeDefined();
});

test('PeriodRecord.getAll returns empty array of found entries when userId is wrong.', async () => {

    const opArray = await PeriodRecord.getAll('non-existing-userId');

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

test(`PeriodRecord.getActual returns user's active period or null when nothing found in database.`, async () => {

    const actualPer = await PeriodRecord.getActual('testUserId');

    expect(actualPer).toBeDefined();
    expect(actualPer.id).toBe('[TEST]');
    expect(actualPer.userId).toBe('testUserId');
    expect(actualPer.isActive).toBe(true);
    expect(actualPer.starts).toBe('2023-02-01 00:00:00');
    expect(actualPer.ends).toBe('2023-02-28 23:59:59');
    expect(actualPer.budgetAmount).toBe(6000.00);
    expect(actualPer.paymentsAmount).toBe(3000.00);
    expect(actualPer.savingsAmount).toBe(2000.00);
    expect(actualPer.freeCashAmount).toBe(1000.00);
});

test(`PeriodRecord.getActual returns null when found 0 records in database.`, async () => {

    const per = await PeriodRecord.getActual('[non-existing-user]');

    expect(per).toBeNull();

});


//@TODO make insert method first
// test(`PeriodRecord.getActual throws when found more than 1 active period in database.`, async () => {
//
// });


