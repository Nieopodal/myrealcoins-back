export enum BasicNeeds {
    Supermarket,
    HousingFees,
    Health,
    Transport,
    Children,
    Animals,
    Telephone,
    Other,
}

export enum Additional {
    Shopping,
    Loan,
    Cosmetics,
    FurnitureAndWhiteGoods,
    Electronics,
    Taxis,
    Other,
}

export enum FreeTime {
    Movie,
    Music,
    Books,
    EatingOut,
    BarAndCoffee,
    Tourism,
    SpecificHobby,
    Other,
}

export enum Unexpected {
    BabySitter,
    Fixes,
    Other,

}

export enum PaymentCategory {
    BasicNeeds,
    Additional,
    FreeTime,
    Unexpected,
}

export type PaymentSubcategory = BasicNeeds | Additional | FreeTime | Unexpected;
