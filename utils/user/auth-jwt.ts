import {NextFunction, Response} from "express";
import jwt from 'jsonwebtoken';
import {config} from "../../config/config";
import {ValidationError} from "../error";
import {sendSuccessJsonHandler} from "../json-response-handlers";
import {DecodedExtended, UserRequest} from "../../types/_auth/_auth";

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
