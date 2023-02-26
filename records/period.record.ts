import {v4 as uuid} from 'uuid';
import {NewPeriodEntity, PeriodEntity} from "../types";
import {getFirstAndLastDateOfActualMonth, getStandardFormattedDateTime} from "../utils/datetime-handlers";

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
        this.isActive = obj.isActive;
        this.starts = obj.starts ?? getFirstAndLastDateOfActualMonth().firstDateOfMonth;
        this.ends = obj.ends ?? getFirstAndLastDateOfActualMonth().lastDateOfMonth;
        this.budgetAmount = obj.budgetAmount ?? 0;
        this.paymentsAmount = obj.paymentsAmount ?? 0;
        this.savingsAmount = obj.savingsAmount ?? 0;
        this.freeCashAmount = obj.freeCashAmount ?? 0;
        this.createdAt = obj.createdAt ?? getStandardFormattedDateTime();
    }
    validateNewPeriodEntity(obj: NewPeriodEntity) {
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
    }

}