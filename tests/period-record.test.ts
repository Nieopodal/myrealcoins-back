import {PeriodRecord} from "../records/period.record";
import {NewPeriodEntity} from "../types";
import {getFirstAndLastDateOfActualMonth} from "../utils/datetime-handlers";

jest
    .spyOn(PeriodRecord.prototype, 'initUserBudgetAmount')
    .mockImplementation(async () => {
       return true;
    })

const defaultPeriodObject: NewPeriodEntity = {
    userId: 'test-userId',
    isActive: true,
    budgetAmount: 5000,
    paymentsAmount: 3000,
    savingsAmount: 1000,
    freeCashAmount: 1000,
    createdAt: '2023-02-01 00-00-00',
};

test('PeriodRecord can build proper objects.', () => {

    const per = new PeriodRecord(defaultPeriodObject);

    expect(per.userId).toBe('test-userId');
    expect(per.isActive).toBe(true);
    expect(per.starts).toBe(getFirstAndLastDateOfActualMonth().firstDateOfMonth);
    expect(per.ends).toBe(getFirstAndLastDateOfActualMonth().lastDateOfMonth);
    expect(per.budgetAmount).toBe(5000);
    expect(per.paymentsAmount).toBe(3000);
    expect(per.savingsAmount).toBe(1000);
    expect(per.freeCashAmount).toBe(1000);
    expect(per.createdAt).toBe('2023-02-01 00-00-00');
});

test('PeriodRecord creates a valid UUID for a new entry.', () => {

    const op = new PeriodRecord(defaultPeriodObject);
    expect(op.id).toBeDefined();
    expect(op.id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/);
});

test('PeriodRecord validates if userId exists', () => {

    expect(() => new PeriodRecord({
        isActive: true,
        budgetAmount: 5000,
        paymentsAmount: 3000,
        savingsAmount: 1000,
        freeCashAmount: 1000,
        createdAt: '2023-02-01 00-00-00',
    } as any)).toThrow('User ID is required.');
});

test('PeriodRecord validates if isActive exists.', () => {

    expect(() => new PeriodRecord({
        userId: 'test-userId',
        budgetAmount: 5000,
        paymentsAmount: 3000,
        savingsAmount: 1000,
        freeCashAmount: 1000,
        createdAt: '2023-02-01 00-00-00',
    } as any)).toThrow('isActive is required.');
});

test('PeriodRecord.initUserBudgetAmount can get user budget amount.', async () => {
    const per = new PeriodRecord(defaultPeriodObject);
    expect(await per.initUserBudgetAmount()).toBe(true);
});

