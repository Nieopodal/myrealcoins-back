import {NextFunction, Request, Response} from "express";
import {UserRecord} from "../../records/user.record";
import {ValidationError} from "../error";

export const checkDuplicateUsernameOrEmail = async (req: Request, res: Response, next: NextFunction) => {

    let user = await UserRecord.getOneByName(req.body.name);
    if (user) {
        throw new ValidationError('Login lub adres email znajdują się w bazie.');
    }

    user = await UserRecord.getOneByEmail(req.body.email)
    if (user) {
        throw new ValidationError('Login lub adres email znajdują się w bazie.');
    }

    next();
};