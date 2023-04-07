import {ErrorResponse, SuccessResponse} from "../types";
import {Response} from "express";

export const sendSuccessJsonHandler = <T>(res: Response, payload: T): void => {
    res.json({
        success: true,
        payload: payload,
    } as SuccessResponse<T>);
};

export const sendErrorJsonHandler = (res: Response, message: string): void => {
    res.json({
        success: false,
        error: message,
    } as ErrorResponse);
};