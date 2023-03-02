import {v4 as uuid} from 'uuid';
import {FieldPacket, ResultSetHeader} from "mysql2";
import {isAfter} from "date-fns";
import {NewPeriodEntity, PeriodEntity} from "../types";
import {getFirstAndLastDateOfActualMonth, getStandardFormattedDateTime} from "../utils/datetime-handlers";
import {pool} from "../utils/db";
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
        const [results] = await pool.execute("SELECT * FROM `periods` WHERE `userId` = :userId ORDER BY `createdAt` DESC", {
            userId,
        }) as PeriodRecordResults;

        return results.map(obj => new PeriodRecord(obj));
    };

    private async update(): Promise<void> {
        const result = await pool.execute("UPDATE `periods` SET `isActive` = :isActive, `budgetAmount` = :budgetAmount, `paymentsAmount` = :paymentsAmount, `savingsAmount` = :savingsAmount, `freeCashAmount` = :freeCashAmount WHERE `id` = :id AND `userId` = :userId", this);

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }
    };

    async addPaymentOperation(amount: number): Promise<void> {

        if (amount >= 0) {
            throw new Error('Given amount should be smaller than 0.');
        }
        if (this.freeCashAmount < amount * -1) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }

        this.freeCashAmount += Number(amount.toFixed(2));
        this.paymentsAmount += Number((amount * -1).toFixed(2));

        await this.update();
    };

    async reversePaymentOperation(amount: number): Promise<void> {
        if (amount >= 0) {
            throw new Error('Given amount should be smaller than 0.');
        }
        if (this.paymentsAmount < amount * -1) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }

        this.freeCashAmount += Number((amount * -1).toFixed(2));
        this.paymentsAmount += Number(amount.toFixed(2));

        await this.update();
    }

    async addToSavingsOperation(amount: number): Promise<void> {
        if (amount > 0) {
            throw new Error('Given amount should be smaller than 0.');
        }
        if (this.freeCashAmount < amount * -1) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }
        this.freeCashAmount += Number(amount.toFixed(2));
        this.savingsAmount += Number((amount * -1).toFixed(2));

        await this.update();
    };

    async addFromSavingsOperation(amount: number): Promise<void> {
        if (amount < 0) {
            throw new Error('Given amount should be greater than 0.');
        }
        if (this.savingsAmount < amount) {
            throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
        }

        this.savingsAmount += Number((amount * -1).toFixed(2));
        this.freeCashAmount += Number(amount.toFixed(2));

        await this.update();
    };

    async changeBudgetOperation(amount: number): Promise<void> {
        if (amount < 0) {
            if (this.freeCashAmount < amount * -1 || this.budgetAmount < amount * -1) {
                throw new ValidationError('Kwota operacji przewyższa sumę dostępnych środków.');
            }

        } else if (amount > 0) {
            if ((this.budgetAmount + amount) > 999999999.99) {
                throw new ValidationError('Przekroczono maksymalną kwotę budżetu wynoszącą 999 999 999.99');
            }

        } else {
            throw new ValidationError('Kwota operacji nie może wynosić 0.00.');
        }

        this.freeCashAmount += Number(amount.toFixed(2));
        this.budgetAmount += Number(amount.toFixed(2));

        await this.update();
    };

    async addToCushionOperation() {
    } //@TODO make this working, amount should be -

    async addFromCushionOperation() {
    } //@TODO make this working, amount should be +

    async closePeriod(): Promise<void> {
        if (this.isActive === false) {
            throw new Error('Trying to close period which is already closed.');
        } else if (this.isActive === true) {
            this.isActive = false;
            await this.update();
        } else {
            throw new Error('isActive should be a boolean value.');
        }
    };

    checkIfActualPeriodShouldEnd(): boolean {
        const now = new Date(getStandardFormattedDateTime());
        const datetimeWhenPeriodShouldEnd = new Date(this.ends);

        return isAfter(now, datetimeWhenPeriodShouldEnd);
    };

    async insert(): Promise<string> {
        const checkIfUserHasNoActivePeriods = await PeriodRecord.getActual(this.userId);
        if (checkIfUserHasNoActivePeriods !== null) {
            throw new Error('User already has an active period. You need to close it before inserting a new one.');
        }

        await pool.execute("INSERT INTO `periods` (`id`, `userId`, `isActive`, `starts`, `ends`, `budgetAmount`, `paymentsAmount`, `savingsAmount`, `freeCashAmount`, `createdAt`) VALUES (:id, :userId, :isActive, :starts, :ends, :budgetAmount, :paymentsAmount, :savingsAmount, :freeCashAmount, :createdAt)", this);

        return this.id;
    };

    async delete(): Promise<void> {
        if (!this.id) {
            throw new Error('Error while deleting: given record has no ID!');
        }

        const result = await pool.execute("DELETE FROM `periods` WHERE `id` = :id AND `userId` = :userId", this);

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while deleting, number of affected rows is 0.');
        }
    };

}