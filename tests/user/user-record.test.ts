import {UserRecord} from "../../records/user.record";
import {LocalizationSource, UserEntity} from "../../types";
import {UserStatus} from "../../types/_auth/_auth";

const defaultObj: UserEntity = {
    addLocalizationByDefault: true,
    defaultBudgetAmount: 5000,
    email: "test@example.com",
    financialCushion: 0,
    id: null,
    localizationSource: LocalizationSource.Receipt,
    name: "Test",
    password: "test-password",
    resetPwdCode: '',
    confirmationCode: '',
    status: UserStatus.Pending,
};

test('UserRecord can build a proper User Object.', () => {
    const newUser = new UserRecord(defaultObj);

    expect(newUser.id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/);
    expect(newUser.addLocalizationByDefault).toBe(true);
    expect(newUser.defaultBudgetAmount).toBe(5000);
    expect(newUser.email).toBe("test@example.com");
    expect(newUser.financialCushion).toBe(0);
    expect(newUser.localizationSource).toBe(LocalizationSource.Receipt);
    expect(newUser.name).toBe("Test");
    expect(newUser.password).toBe("test-password");
});

test('UserRecord validates if name exists and it`s length fits 3 - 15 characters.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        name: null,
    })).toThrow('Użytkownik musi posiadać imię.');

    expect(() => new UserRecord({
        ...defaultObj,
        name: 'a',
    })).toThrow('Imię powinno zawierać od 3 do 15 znaków.');

    expect(() => new UserRecord({
        ...defaultObj,
        name: 'qweqweqeqeqweqweqeqeqw54545r4eq',
    })).toThrow('Imię powinno zawierać od 3 do 15 znaków.');
});

test('UserRecord validates if password is given.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        password: null,
    })).toThrow('Użytkownik musi posiadać hasło.');
});

test('UserRecord validates if email exists and is correct.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        email: null,
    })).toThrow('Użytkownik musi posiadać adres email.');

    expect(() => new UserRecord({
        ...defaultObj,
        email: 'test',
    })).toThrow('Podano nieprawidłowy adres email.');

    expect(() => new UserRecord({
        ...defaultObj,
        email: 'test@',
    })).toThrow('Podano nieprawidłowy adres email.');

    expect(() => new UserRecord({
        ...defaultObj,
        email: 'test@example.',
    })).toThrow('Podano nieprawidłowy adres email.');
});

test('UserRecord validates if financialCushion is valid.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        financialCushion: '32wss',
    } as any)).toThrow('FinancialCushion must be a number be a number between 0 and 999 999 999.99');
    expect(() => new UserRecord({
        ...defaultObj,
        financialCushion: -1,
    })).toThrow('FinancialCushion must be a number be a number between 0 and 999 999 999.99');
    expect(() => new UserRecord({
        ...defaultObj,
        financialCushion: 99999999999.99,
    })).toThrow('FinancialCushion must be a number be a number between 0 and 999 999 999.99');
});

test('UserRecord validates if defaultBudgetAmount is valid.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        defaultBudgetAmount: 'red',
    } as any)).toThrow('DefaultBudgetAmount must be a number between 0 and 999 999.99.');

    expect(() => new UserRecord({
        ...defaultObj,
        defaultBudgetAmount: -1,
    })).toThrow('DefaultBudgetAmount must be a number between 0 and 999 999.99.');
    expect(() => new UserRecord({
        ...defaultObj,
        defaultBudgetAmount: 99999999999.99,
    })).toThrow('DefaultBudgetAmount must be a number between 0 and 999 999.99.');
});

test('UserRecord validates if given localizationSource is valid.', () => {
    expect(() => new UserRecord({
        ...defaultObj,
        localizationSource: 'red',
    } as any)).toThrow('Given localizationSource is invalid.');

    expect(() => new UserRecord({
        ...defaultObj,
        localizationSource: -1,
    })).toThrow('Given localizationSource is invalid.');

    expect(() => new UserRecord({
        ...defaultObj,
        localizationSource: -1,
    })).toThrow('Given localizationSource is invalid.');

    expect(() => new UserRecord({
        ...defaultObj,
        localizationSource: 1.5,
    })).toThrow('Given localizationSource is invalid.');
    expect(() => new UserRecord({
        ...defaultObj,
        localizationSource: 4343,
    })).toThrow('Given localizationSource is invalid.');
});