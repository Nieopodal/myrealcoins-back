import {v4 as uuid} from 'uuid';
import {
    NewOperationEntity,
    OperationEntity,
    OperationType,
    PaymentCategory,
    PaymentSubcategory
} from "../types";
import {ValidationError} from "../utils/error";

export class OperationRecord implements OperationEntity {
    id: string;
    userId: string;
    periodId?: string;
    type: OperationType;
    isRepetitive: boolean;
    amount: number;
    category?: PaymentCategory;
    subcategory?: PaymentSubcategory;
    description?: string;
    imgUrl?: string;
    lat?: number;
    lon?: number;

    constructor(obj: NewOperationEntity) {

        this.validateEveryNewOperation(obj);

        if (obj.type === OperationType.Payment) {
            this.ValidateNewPaymentOperation(obj);
        }

        this.id = obj.id ?? uuid();
        this.userId =  obj.userId;
        this.periodId =  obj.periodId;
        this.type =  obj.type;
        this.isRepetitive = obj.isRepetitive;
        this.amount =  obj.amount;
        this.category =  obj.category;
        this.subcategory =  obj.subcategory;
        this.description =  obj.description;
        this.imgUrl =  obj.imgUrl;
        this.lat =  obj.lat;
        this.lon =  obj.lon;
    }

    validateEveryNewOperation(obj: NewOperationEntity) {
        if (!obj.userId || typeof obj.userId !== 'string') {
            throw new Error('User ID is required.');
        }
        if (obj.periodId && typeof obj.periodId !== 'string') {
            throw new Error('periodId should be type of string.');
        }
        if (typeof obj.isRepetitive !== 'boolean') {
            throw new Error('isRepetitive should be boolean and it is required.');
        }
        if (!obj.amount || typeof obj.amount !== 'number' || obj.amount < -999999999.99 || obj.amount > 999999999.99) {
            throw new ValidationError('Kwota operacji powinna zawierać się w przedziale od -999 999 999,99 do 999 999 999,99.');
        }
        if (!obj.type || typeof obj.type !== 'number') {
            throw new ValidationError('Wybrano błędny typ kategorii operacji.');
        }
        if (obj.description && typeof obj.description !== 'string') {
            throw new ValidationError('Opis powinien być tekstem o maksymalnej długości 50 znaków.');
        }
        if (obj.description && obj.description.length > 50) {
            throw new ValidationError('Opis powinien być tekstem o maksymalnej długości 50 znaków.');
        }
    };

    ValidateNewPaymentOperation(obj: NewOperationEntity) {
        if (obj.category < 0 || typeof obj.category !== 'number') {
            throw new ValidationError('Dla każdej płatności jej kategoria jest wymagana.');
        }
        if (obj.subcategory < 0 || typeof obj.subcategory !== 'number') {
            throw new ValidationError('Dla każdej płatności jej podkategoria jest wymagana.');
        }
        if (obj.imgUrl && typeof obj.imgUrl !== 'string') {
            throw new ValidationError('Adres URL zdjęcia powinien być tekstem o długości maksymalnie 100 znaków.');
        }
        if (obj.imgUrl && obj.imgUrl.length > 100) {
            throw  new ValidationError('Adres URL zdjęcia powinien być tekstem o długości maksymalnie 100 znaków.');
        }
        if (obj.lat && typeof obj.lat !=='number') {
            throw new ValidationError('Nie można ustalić lokalizacji.');
        }
        if (obj.lon && typeof obj.lon !=='number') {
            throw new ValidationError('Nie można ustalić lokalizacji.');
        }
    }
}
