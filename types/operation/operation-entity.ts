import {OperationType} from "./operation-type";
import {PaymentCategory, PaymentSubcategory} from "./payment-category";

export interface NewOperationEntity extends Omit<OperationEntity, 'id' | 'createdAt'> {
    id?: string;
    createdAt?: string;
}


export interface OperationEntity {
    id: string;
    periodId?: string;
    userId: string;
    type: OperationType;
    description?: string;
    isRepetitive: boolean;
    amount: number;
    category?: PaymentCategory;
    subcategory?: PaymentSubcategory;
    imgUrl?: string;
    lat?: number;
    lon?: number;
    createdAt: string;
    originId?: string;
}

export interface NewPaymentEntity extends Omit<PaymentEntity, 'id' | 'createdAt'> {
    id?: string;
    createdAt?: string;
}

export interface PaymentEntity extends Omit<OperationEntity, 'category' | 'subcategory' > {
    category: PaymentCategory;
    subcategory: PaymentSubcategory;
}

export interface NotAPaymentEntity extends Omit<OperationEntity, 'category' | 'subcategory' | 'imgUrl' | 'lat' | 'lon'> {}

export interface NewNotAPaymentEntity extends Omit<NotAPaymentEntity, 'id' | 'createdAt'> {
    id?: string;
    createdAt?: string;
}