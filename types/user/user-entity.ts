export interface UserEntity {
    id: string;
    email: string;
    password: string;
    name: string;
    financialCushion: number;
    defaultBudgetAmount: number;
    localizationSource: LocalizationSource;
    addLocalizationByDefault: boolean;
}

export enum LocalizationSource {
    None,
    UserDevice,
    Receipt,
    Address,
}

