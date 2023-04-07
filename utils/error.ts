import {NextFunction, Request, Response} from "express";
import {sendErrorJsonHandler} from "./json-response-handlers";

export class ValidationError extends Error {}

export const handleError = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    const message = err instanceof ValidationError ? err.message : 'Wystąpił błąd, prosimy spróbować później.';
    res.status(err instanceof ValidationError ? 400 : 500);
    sendErrorJsonHandler(res, message);
};