import {OperationType} from "./operation-type";
import {PaymentCategory, PaymentSubcategory} from "./payment-category";

export interface NewOperationEntity extends Omit<OperationEntity, 'id'> {
    id?: string;
}

export interface OperationEntity {
    id: string;
    periodId?: string;
    userId: string;
    type: OperationType;
    description: string;
    isRepetitive: boolean;
    amount: number;
}

export interface PaymentEntity extends OperationEntity {
    category: PaymentCategory;
    subcategory: PaymentSubcategory;
    imgUrl?: string;
    lat?: number;
    lon?: number;
}

