import {LocalizationSource, NewUserEntity} from "../../types";
import {UserRecord} from "../../records/user.record";
import {pool} from "../../utils/db";

afterAll(async () => {
    await pool.end();
});

const defaultObj: NewUserEntity = {
    addLocalizationByDefault: true,
    defaultBudgetAmount: 5000,
    email: "test@example.com",
    financialCushion: 1000,
    localizationSource: LocalizationSource.Receipt,
    name: "Test",
    password: "test-password",
};

test('UserRecord.insert inserts record into database. GetOneById can find this.', async () => {
    const newUser = new UserRecord(defaultObj);
    const insertedId = await newUser.insert();
    const found = await UserRecord.getOneById(insertedId);

    expect(insertedId).toBe(newUser.id);
    expect(found).toBeDefined();
});

test('UserRecord.update updates record in the database.', async () => {

    const foundByMail = await UserRecord.getOneByEmail(defaultObj.email);
    foundByMail.financialCushion = 2000;

    await foundByMail.update();
    const foundModified = await UserRecord.getOneByEmail(defaultObj.email);

    expect(foundModified.financialCushion).toBe(foundByMail.financialCushion);
});

test('UserRecord.delete removes user from database.', async () => {
    const foundByMail = await UserRecord.getOneByEmail(defaultObj.email);
    const isRemoved = await foundByMail.delete();

    const founded = await UserRecord.getOneByEmail(defaultObj.email);

    expect(isRemoved).toBe(true);
    expect(founded).toBe(null);
});