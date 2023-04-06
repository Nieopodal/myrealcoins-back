import {NextFunction, Request, Response} from "express";
import * as jwt from 'jsonwebtoken';
import {config} from "../../config/config";
import {ValidationError} from "../error";
import {sendSuccessJsonHandler} from "../json-response-handlers";

export interface UserRequest extends Request {
    userId: string;
}

interface DecodedExtended extends jwt.JwtPayload {
    id?: string;
}

export const verifyToken = (req: UserRequest, res: Response, next: NextFunction) => {
    let token = req.session.token;

    if (!token) {
        sendSuccessJsonHandler(res, 'No token provided.');
        return;
    }

    jwt.verify(token, config.jwtSecret, {}, (err, decoded: DecodedExtended) => {
        if (err) {
            throw new ValidationError('Unauthorized!');
        }
        if (!decoded) {
            throw new ValidationError('Invalid JWT token!');
        }
        req.userId = decoded.id;
        next();
    });
};
