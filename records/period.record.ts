import {v4 as uuid} from 'uuid';
import {NewPeriodEntity, PeriodEntity} from "../types";
import {getFirstAndLastDateOfActualMonth, getStandardFormattedDateTime} from "../utils/datetime-handlers";
import {pool} from "../utils/db";
import {FieldPacket, ResultSetHeader} from "mysql2";
import {ValidationError} from "../utils/error";

type PeriodRecordResults = [PeriodEntity[], FieldPacket[]];

export class PeriodRecord implements PeriodEntity {
    budgetAmount: number;
    createdAt: string;
    ends: string;
    freeCashAmount: number;
    id: string;
    isActive: boolean;
    paymentsAmount: number;
    savingsAmount: number;
    starts: string;
    userId: string;

    constructor(obj: NewPeriodEntity) {

        this.validateNewPeriodEntity(obj);

        this.id = obj.id ?? uuid();
        this.userId = obj.userId;
        this.isActive = Boolean(obj.isActive);
        this.starts = obj.starts ? getStandardFormattedDateTime(new Date(obj.starts)) : getFirstAndLastDateOfActualMonth().firstDateOfMonth;
        this.ends = obj.ends ? getStandardFormattedDateTime(new Date(obj.ends)) : getFirstAndLastDateOfActualMonth().lastDateOfMonth;
        this.budgetAmount = Number((obj.budgetAmount ?? 0).toFixed(2));
        this.paymentsAmount = Number((obj.paymentsAmount ?? 0).toFixed(2));
        this.savingsAmount = Number((obj.savingsAmount ?? 0).toFixed(2));
        this.freeCashAmount = Number((obj.freeCashAmount ?? 0).toFixed(2));
        this.createdAt = obj.createdAt ? getStandardFormattedDateTime(new Date(obj.createdAt)) : getStandardFormattedDateTime();
    }

    private validateNewPeriodEntity(obj: NewPeriodEntity) {
        if (!obj.userId || typeof obj.userId !== `string`) {
            throw new Error('User ID is required.');
        }
        if (typeof obj.isActive === 'undefined') {
            throw new Error('isActive is required.');
        }
    };

    async initUserBudgetAmount(): Promise<boolean> {
        //     @TODO finish when UserRecord is ready
        this.budgetAmount = 5000;
        return true;
    };

    static async getActual(userId: string): Promise<PeriodRecord | null> {
        const [results] = await pool.execute("SELECT * FROM `periods` WHERE `isActive` = 1 AND `userId` = :userId", {
            userId
        }) as PeriodRecordResults;

        if (results.length > 1) {
            throw new Error('User has active more than 1 period.');
        }

        return results.length === 0 ? null : new PeriodRecord(results[0]);
    };

    static async getOne(id: string, userId: string): Promise<PeriodRecord | null> {
        const [results] = await pool.execute("SELECT * FROM `periods` WHERE id = :id AND `userId` = :userId", {
            id,
            userId
        }) as PeriodRecordResults;

        if (results.length > 1) {
            throw new Error('OperationRecord.getOne found more than 1 record.');
        }

        return results.length === 0 ? null : new PeriodRecord(results[0]);
    };

    static async getAll(userId: string): Promise<PeriodRecord[]> {
        const [results] = await pool.execute("SELECT * FROM `periods` WHERE `userId` = :userId", {
            userId,
        }) as PeriodRecordResults;

        return results.map(obj => new PeriodRecord(obj));
    };

    async addPaymentOperation(amount: number): Promise<void> {

        if(amount > 0) {
            throw new Error('Given amount should be smaller than 0.');
        }
        if (this.freeCashAmount < amount * -1) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }

        this.freeCashAmount += Number(amount.toFixed(2));
        this.paymentsAmount += Number((amount*-1).toFixed(2));

        const result = await pool.execute("UPDATE `periods` SET `freeCashAmount` = :freeCashAmount, `paymentsAmount` = :paymentsAmount WHERE `id` = :id AND `userId` = :userId", {
            freeCashAmount: this.freeCashAmount,
            paymentsAmount: this.paymentsAmount,
            id: this.id,
            userId: this.userId,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }
    };

    async addToSavingsOperation(amount: number): Promise<void> {
        if(amount > 0) {
            throw new Error('Given amount should be smaller than 0.');
        }
        if (this.freeCashAmount < amount * -1) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }
        this.freeCashAmount += Number(amount.toFixed(2));
        this.savingsAmount += Number((amount*-1).toFixed(2));

        const result = await pool.execute("UPDATE `periods` SET `freeCashAmount` = :freeCashAmount, `savingsAmount` = :savingsAmount WHERE `id` = :id AND `userId` = :userId", {
            freeCashAmount: this.freeCashAmount,
            savingsAmount: this.savingsAmount,
            id: this.id,
            userId: this.userId,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }
    };

    async addFromSavingsOperation(amount: number): Promise<void> {
        if (amount < 0) {
            throw new Error('Given amount should be greater than 0.');
        }
        if (this.savingsAmount < amount) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }

        this.savingsAmount += Number((amount*-1).toFixed(2));
        this.freeCashAmount += Number(amount.toFixed(2));


        const result = await pool.execute("UPDATE `periods` SET `freeCashAmount` = :freeCashAmount, `savingsAmount` = :savingsAmount WHERE `id` = :id AND `userId` = :userId", {
            freeCashAmount: this.freeCashAmount,
            savingsAmount: this.savingsAmount,
            id: this.id,
            userId: this.userId,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }
    };

    async changeBudgetOperation(amount: number): Promise<void> {
        if(amount < 0) {
            if (this.freeCashAmount < amount * -1 || this.budgetAmount < amount * -1) {
                throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
            }

        } else if (amount > 0) {
            if((this.budgetAmount + amount) > 999999999.99) {
                throw new ValidationError('Przekroczono maksymalną kwotę budżetu wynoszącą 999 999 999.99');
            }

        } else {
            throw new ValidationError('Kwota operacji nie może wynosić 0.00.');
        }

        this.freeCashAmount += Number(amount.toFixed(2));
        this.budgetAmount += Number(amount.toFixed(2));
        const result = await pool.execute("UPDATE `periods` SET `freeCashAmount` = :freeCashAmount, `budgetAmount` = :budgetAmount WHERE `id` = :id AND `userId` = :userId", {
            freeCashAmount: this.freeCashAmount,
            budgetAmount: this.budgetAmount,
            id: this.id,
            userId: this.userId,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }
    };

    async addToCushionOperation() {} //@TODO make this working, amount should be -

    async addFromCushionOperation() {} //@TODO make this working, amount should be +

    async createNewPeriod() {} //@TODO make this working

    private async closeOldPeriod() {} //@TODO make this working

}