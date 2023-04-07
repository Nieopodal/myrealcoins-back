import {Request} from "express";
import jwt from "jsonwebtoken";

export interface UserRequest extends Request {
    userId: string;
}

export interface DecodedExtended extends jwt.JwtPayload {
    id?: string;
}

export enum UserStatus {
    Pending,
    Active,
}