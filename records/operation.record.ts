import {v4 as uuid} from 'uuid';
import {
    NewOperationEntity,
    OperationEntity,
    OperationType,
    PaymentCategory,
    PaymentSubcategory
} from "../types";
import {ValidationError} from "../utils/error";
import {pool} from "../utils/db";
import {FieldPacket, ResultSetHeader} from "mysql2";

type OperationRecordResults = [OperationEntity[], FieldPacket[]];

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
        this.isRepetitive = Boolean(obj.isRepetitive);
        this.amount =  Number(obj.amount.toFixed(2));
        this.category =  obj.category;
        this.subcategory =  obj.subcategory;
        this.description =  obj.description;
        this.imgUrl =  obj.imgUrl;
        this.lat =  obj.lat;
        this.lon =  obj.lon;
    }

    private validateEveryNewOperation(obj: NewOperationEntity) {
        if (!obj.userId || typeof obj.userId !== 'string') {
            throw new Error('User ID is required.');
        }
        if (obj.periodId && typeof obj.periodId !== 'string') {
            throw new Error('periodId should be type of string.');
        }
        if (typeof obj.isRepetitive === 'undefined') {
            throw new Error('isRepetitive is required.');
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

    private ValidateNewPaymentOperation(obj: NewOperationEntity) {
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
    };

    static async getOne(id: string, userId: string): Promise<OperationEntity> {
        const [results] = await pool.execute("SELECT * FROM `operations` WHERE id = :id AND `userId` = :userId", {
            id,
            userId
        }) as OperationRecordResults;

        if (results.length > 1) {
            throw new Error('OperationRecord.getOne found more than 1 record.');
        }

        return results.length === 0 ? null : new OperationRecord(results[0]);
    };

    static async getAll(description: string, userId: string): Promise<OperationEntity[]> {
        const [results] = await pool.execute("SELECT * FROM `operations` WHERE `description` LIKE :search AND `userId` = :userId", {
            search: `%${description}%`,
            userId
        }) as OperationRecordResults;

        return results.map(obj => new OperationRecord(obj));
    };

    async insert(): Promise<string> {

        await pool.execute("INSERT INTO `operations` (`id`, `userId`, `periodId`, `type`, `category`, `subcategory`, `description`, `isRepetitive`, `amount`, `imgUrl`, `lat`, `lon`) VALUES (:id, :userId, :periodId, :type, :category, :subcategory, :description, :isRepetitive, :amount, :imgUrl, :lat, :lon)", this);


        return this.id;
    };

    async delete(): Promise<void> {
        if (!this.id) {
            throw new Error('Error while deleting: given record has no ID!');
        }

        const result = await pool.execute("DELETE FROM `operations` WHERE `id` = :id AND `userId` = :userId", {
            id: this.id,
            userId: this.userId,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while deleting, number of affected rows is 0.');
        }
    }

    async update(): Promise<string> {
        if (!this.id) {
            throw new Error('Error while updating: given record has no ID!');
        }

        const result = await pool.execute("UPDATE `operations` SET `type` = :type, `category` = :category, `subcategory` = :subcategory, `description` = :description, `isRepetitive` = :isRepetitive, `amount` = :amount, `imgUrl` = :imgUrl, `lat` = :lat, `lon` = :lon WHERE `id` = :id AND `userId` = :userId", {
            id: this.id,
            userId: this.userId,
            type: this.type,
            category: this.category,
            subcategory: this.subcategory,
            description: this.description,
            isRepetitive: this.isRepetitive,
            amount: this.amount,
            imgUrl: this.imgUrl,
            lat: this.lat,
            lon: this.lon,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }

        return this.id;
    }

}
