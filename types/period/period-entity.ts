export interface NewPeriodEntity extends Omit<PeriodEntity, 'id' | 'starts' | 'ends'> {
    id?: string;
    starts?: string;
    ends?: string;
}

export interface PeriodEntity {
    id: string;
    userId: string;
    isActive: boolean;
    starts: string;
    ends: string;
    budgetAmount: number;
    paymentsAmount: number;
    savingsAmount: number;
    freeCashAmount: number;
    createdAt?: string;
}