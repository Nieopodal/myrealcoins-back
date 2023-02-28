import {Additional, BasicNeeds, NewPaymentEntity, OperationType, PaymentCategory} from "../types";
import {OperationRecord} from "../records/operation.record";
import {pool} from "../utils/db";

const defaultPaymentObj: NewPaymentEntity = {
    userId: "test-user-id",
    periodId: "test-period-id",
    category: PaymentCategory.BasicNeeds,
    subcategory: BasicNeeds.Supermarket,
    description: "user-description",
    type: OperationType.Payment,
    amount: -42.62,
    imgUrl: "/test.jpg",
    isRepetitive: false,
    lat: 49.34342,
    lon: 49.34342,
};

const defaultOperationEntity = new OperationRecord({
    id: '[TEST]',
    userId: "testUserId",
    type: 2,
    description: 'test description',
    isRepetitive: false,
    amount: 99,
});

beforeAll(async () => {
    await defaultOperationEntity.insert();
});

afterAll(async () => {
    await defaultOperationEntity.delete();
    await pool.end();
});

test('OperationRecord returns data from database for one entry.', async () => {
    const op = await OperationRecord.getOne('[TEST]', 'testUserId');

    expect(op).toBeDefined();
    expect(op.id).toBe('[TEST]');
    expect(op.userId).toBe('testUserId');
    expect(op.type).toBe(2);
    expect(op.isRepetitive).toBe(false);
    expect(op.amount).toBe(99.00);
});

test('OperationRecord returns null for non-existing entry.', async () => {
    const op = await OperationRecord.getOne('[non-existing-entry]', 'testUserId');
    expect(op).toBeNull();
});

test('OperationRecord returns null when operation ID is valid, but userID is wrong.', async () => {
    const op = await OperationRecord.getOne('[TEST]', 'wrong-user-id');
    expect(op).toBeNull();
});

test('OperationRecord.getAll returns an array of found entries.', async () => {

    const opArray = await OperationRecord.getAll('', 'testUserId');

    expect(opArray).not.toEqual([]);
    expect(opArray[0].id).toBeDefined();
});

test('OperationRecord.getAll returns an array of found entries when searching for "e".', async () => {

    const opArray = await OperationRecord.getAll('e', 'testUserId');

    expect(opArray).not.toEqual([]);
    expect(opArray[0].id).toBeDefined();
});

test('OperationRecord.getAll returns empty array of found entries when userId is wrong.', async () => {

    const opArray = await OperationRecord.getAll('e', 'non-existing-userId');

    expect(opArray).toEqual([]);
});

test('OperationRecord.getAll returns empty array of found entries when searching that does not exist.', async () => {

    const opArray = await OperationRecord.getAll('non-existing-description', 'testUserId');

    expect(opArray).toEqual([]);
});

test('OperationRecord.insert returns new UUID and inserts data into database. OperationRecord.delete can remove this entry from database.', async () => {

    const op = new OperationRecord(defaultPaymentObj);
    const newOpId = await op.insert();

    expect(op).toBeDefined();
    expect(op.id).toBeDefined();
    expect(op.id).toBe(newOpId);
    expect(op.id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/);

    await op.delete();

    const notFoundOp = await OperationRecord.getOne(op.id, 'test-user-id');
    expect(notFoundOp).toBeNull();

});

test('OperationRecord.update changes data in database.', async () => {
    const op = new OperationRecord(defaultPaymentObj);
    await op.insert();

    expect(op.description).toBe("user-description");

    op.category = PaymentCategory.Additional;
    op.subcategory = Additional.Taxis;
    op.description = 'New description';
    op.type = OperationType.Payment;
    op.amount = -45453.34;
    op.imgUrl = 'https://newImgUrl.com';
    op.isRepetitive = true;
    op.lat = 54.34342;
    op.lon = 34.34234;

    const opId = await op.update();
    expect(opId).toBe(op.id);
    expect(op.category).toBe(1);
    expect(op.subcategory).toBe(5);
    expect(op.description).toBe('New description');
    expect(op.type).toBe(1);
    expect(op.amount).toBe(-45453.34);
    expect(op.imgUrl).toBe('https://newImgUrl.com');
    expect(op.isRepetitive).toBe(true);
    expect(op.lat).toBe(54.34342);
    expect(op.lon).toBe(34.34234);

    await op.delete();
});





