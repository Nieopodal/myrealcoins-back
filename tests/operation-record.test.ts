import {BasicNeeds, NewNotAPaymentEntity, NewPaymentEntity, OperationType, PaymentCategory} from "../types";
import {OperationRecord} from "../records/operation.record";

const defaultNotAPaymentObj: NewNotAPaymentEntity = {
    userId: 'test-user-id',
    periodId: 'test-period-id',
    isRepetitive: false,
    amount: -45.96,
    type: OperationType.AddToSavings,
    description: 'user-description',
};

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

test('OperationEntity can build proper not-a-payment objects.', () => {

    const op = new OperationRecord(defaultNotAPaymentObj);
    expect(op.userId).toBe('test-user-id');
    expect(op.periodId).toBe('test-period-id');
    expect(op.isRepetitive).toBe(false);
    expect(op.amount).toBe(-45.96);
    expect(op.type).toBe(OperationType.AddToSavings);
    expect(op.description).toBe('user-description');
});

test('OperationEntity can build proper payment objects.', () => {

    const op = new OperationRecord(defaultPaymentObj);
    expect(op.userId).toBe('test-user-id');
    expect(op.periodId).toBe('test-period-id');
    expect(op.category).toBe(PaymentCategory.BasicNeeds);
    expect(op.subcategory).toBe(BasicNeeds.Supermarket);
    expect(op.description).toBe('user-description');
    expect(op.amount).toBe(-42.62);
    expect(op.imgUrl).toBe('/test.jpg');
    expect(op.isRepetitive).toBe(false);
    expect(op.lat).toBe(49.34342);
    expect(op.lon).toBe(49.34342);
    expect(op.type).toBe(OperationType.Payment);
});

test('OperationRecord creates a valid UUID for a new entry.', () => {

    const op = new OperationRecord(defaultPaymentObj);
    expect(op.id).toBeDefined();
    expect(op.id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/);
});

test('OperationRecord validates if userId exists', () => {

    expect(() => new OperationRecord({
        periodId: 'test-period-id',
        userId: '',
        isRepetitive: false,
        amount: -45.96,
        type: OperationType.AddToSavings,
        description: 'user-description',
    } as any)).toThrow('User ID is required.');
});

test('OperationRecord validates operation type.', () => {
    expect(() => new OperationRecord({
        userId: 'test-user-id',
        periodId: 'test-period-id',
        isRepetitive: false,
        amount: -45.96,
        description: 'user-description',
    } as any)).toThrow('Wybrano błędny typ kategorii operacji.');

    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        type: 'test' as any,
    })).toThrow('Wybrano błędny typ kategorii operacji.');
});

test('OperationRecord validates if isRepetitive exists.', () => {
    expect(() => new OperationRecord({
        userId: 'test-user-id',
        periodId: 'test-period-id',
        amount: -45.96,
        type: OperationType.AddToSavings,
        description: 'user-description',
    } as any)).toThrow('isRepetitive is required.');
});

test('OperationRecord validates periodId type.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        periodId: 123 as any,
    })).toThrow('periodId should be type of string.');
});

test('OperationRecord validates if amount exists.', () => {
    expect(() => new OperationRecord({
        userId: 'test-user-id',
        isRepetitive: true,
        periodId: 'test',
        type: OperationType.AddToSavings,
        description: 'user-description',
    } as any)).toThrow('Kwota operacji powinna zawierać się w przedziale od -999 999 999,99 do 999 999 999,99.');

    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        amount: true as any,
    })).toThrow('Kwota operacji powinna zawierać się w przedziale od -999 999 999,99 do 999 999 999,99.');
});

test('OperationRecord validates amount range.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        amount: 9999999999999999999999,
    })).toThrow('Kwota operacji powinna zawierać się w przedziale od -999 999 999,99 do 999 999 999,99.');

    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        amount: -9999999999999999999999,
    })).toThrow('Kwota operacji powinna zawierać się w przedziale od -999 999 999,99 do 999 999 999,99.');
});

test('OperationRecord validates description.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        description: true as any,
    })).toThrow('Opis powinien być tekstem o maksymalnej długości 50 znaków.');

    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        description: '..................................................................................................................................................................................................................................................................................................................................',
    })).toThrow('Opis powinien być tekstem o maksymalnej długości 50 znaków.');
});

test('OperationRecord validates payment category.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        category: true as any,
    })).toThrow('Dla każdej płatności jej kategoria jest wymagana.');

    expect(() => new OperationRecord({
        userId: "test-user-id",
        periodId: "test-period-id",
        subcategory: BasicNeeds.Supermarket,
        description: "user-description",
        amount: -42.62,
        imgUrl: "/test.jpg",
        isRepetitive: false,
        lat: 49.34342,
        lon: 49.34342,
        type: OperationType.Payment,
    })).toThrow('Dla każdej płatności jej kategoria jest wymagana.');
});

test('OperationRecord validates payment subcategory.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        subcategory: true as any,
    })).toThrow('Dla każdej płatności jej podkategoria jest wymagana.');

    expect(() => new OperationRecord({
        userId: "test-user-id",
        periodId: "test-period-id",
        category: PaymentCategory.BasicNeeds,
        description: "user-description",
        amount: -42.62,
        imgUrl: "/test.jpg",
        isRepetitive: false,
        lat: 49.34342,
        lon: 49.34342,
        type: OperationType.Payment,
    })).toThrow('Dla każdej płatności jej podkategoria jest wymagana.');
});

test('OperationRecord validates payment imgUrl.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        imgUrl: true as any,
    })).toThrow('Adres URL zdjęcia powinien być tekstem o długości maksymalnie 100 znaków.');
});
test('OperationRecord validates payment imgUrl.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        imgUrl: '...................................................................................................................................................................................................................................................................................................................................................................................',
    })).toThrow('Adres URL zdjęcia powinien być tekstem o długości maksymalnie 100 znaków.');
});

test('OperationRecord validates payment coordinates.', () => {
    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        lat: true as any,
    })).toThrow('Nie można ustalić lokalizacji.');

    expect(() => new OperationRecord({
        ...defaultPaymentObj,
        lon: true as any,
    })).toThrow('Nie można ustalić lokalizacji.');
});



