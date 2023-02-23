export interface PeriodEntity {
    id: string;
    userId: string;
    operationIds: string[];
    title: string;
    starts: string;
    ends: string;
    isActive: boolean;
    budgetAmount: number;
    paymentsAmount: number;
    savingsAmount: number;
    freeCashAmount: number;
}