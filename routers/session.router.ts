import {Router} from "express";
import {UserRecord} from "../records/user.record";
import {ValidationError} from "../utils/error";
import {UserRequest, UserStatus} from "../types/_auth/_auth";
import bcrypt from "bcryptjs";
import {PeriodRecord} from "../records/period.record";
import jwt from "jsonwebtoken";
import {config} from "../config/config";
import {sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {verifyToken} from "../utils/user/auth-jwt";

export const sessionRouter = Router()
    .post('/', async (req, res) => {
        const user = await UserRecord.getOneByEmail(req.body.email);

        if (!user) {
            throw new ValidationError('Użytkownik lub hasło są nieprawidłowe.');
        }

        if (user.status === UserStatus.Pending) {
            throw new ValidationError('Konto oczekuje na aktywację poprzez link aktywacyjny wysłany na podany adres e-mail.');
        }

        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            throw new ValidationError('Email lub hasło są nieprawidłowe.');
        }

        const actualPeriod = await PeriodRecord.getActual(user.id);

        const userToken = jwt.sign({id: user.id}, config.jwtSecret, {
            expiresIn: 3600,
        });

        req.session.token = userToken;

        sendSuccessJsonHandler(res, {
            userToken,
            user: {
                ...user,
                password: '',
                confirmationCode: '',
                resetPwdCode: '',
            },
            actualPeriod: actualPeriod ?? null,
        });
    })

    .get('/check-user', verifyToken, async (req: UserRequest, res) => {
        const currentUser = await UserRecord.getOneById((req.userId));
        const actualPeriod = await PeriodRecord.getActual(currentUser.id);
        sendSuccessJsonHandler(res, {
            user: {
                ...currentUser,
                password: '',
                confirmationCode: '',
                resetPwdCode: '',
            },
            actualPeriod: actualPeriod ?? null,
        });
    })

    .delete('/', verifyToken, async (req, res) => {
        req.session = null;

        sendSuccessJsonHandler(res, "Wylogowano użytkownika.");
    });