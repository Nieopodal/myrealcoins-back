interface InputValues {
    type: string;
    description: string;
    isRepetitive: string;
    amount: string;
    category: string;
    subcategory: string;
    lat: string;
    lon: string;
}

interface OutputValues {
    type: number;
    description: string | null;
    isRepetitive: boolean;
    amount: number;
    category: number | null;
    subcategory: number | null;
    lat: number | null;
    lon: number | null;
}

export const getProperValueTypesFromReqHandler = (inputValues: InputValues): OutputValues => ({
    type: Number(inputValues.type),
    description: inputValues.description ?? null,
    isRepetitive: inputValues.isRepetitive === 'true',
    amount: Number(inputValues.amount),
    category: inputValues.category ? Number(inputValues.category) : null,
    subcategory: inputValues.subcategory ? Number(inputValues.subcategory) : null,
    lat: Number(inputValues.lat) ?? null,
    lon: Number(inputValues.lon) ?? null,
});

