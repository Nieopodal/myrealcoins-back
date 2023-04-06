import {Request} from "express";
import * as jwt from "jsonwebtoken";

export interface UserRequest extends Request {
    userId: string;
}

export interface DecodedExtended extends jwt.JwtPayload {
    id?: string;
}