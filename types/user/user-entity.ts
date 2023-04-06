import {UserStatus} from "../_auth/_auth";

export interface UserEntity {
    id: string;
    email: string;
    password: string;
    name: string;
    financialCushion: number;
    defaultBudgetAmount: number;
    localizationSource: LocalizationSource;
    addLocalizationByDefault: boolean;
    status: UserStatus;
    confirmationCode: string;
    resetPwdCode: string;
}

export interface NewUserEntity extends Omit<UserEntity, 'id'> {
    id?: string;
}

export enum LocalizationSource {
    None,
    UserDevice,
    Receipt,
}

