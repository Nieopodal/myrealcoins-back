import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import {Router} from "express";
import {UserRecord} from "../records/user.record";
import {sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {ValidationError} from "../utils/error";
import {config} from "../config/config";
import {checkDuplicateUsernameOrEmail} from "../utils/user/verify-sign-up";
import {verifyToken} from "../utils/user/auth-jwt";
import {LocalizationSource} from "../types";
import {PeriodRecord} from "../records/period.record";
import {UserRequest} from "../types/_auth/_auth";

export const userRouter = Router()
    .post('/signup', checkDuplicateUsernameOrEmail, async (req, res) => {

        if (req.body.password !== req.body.confirmPassword) {
            throw new ValidationError('Podane hasła nie są jednakowe.');
        }

        const pwd = req.body.password;
        if (!pwd.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
            throw new ValidationError('Hasło powinno składać się z 7-15 znaków, w tym przynajmniej z 1 cyfry oraz znaku specjalnego.');
        }

        const newUser = new UserRecord({
            id: null,
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            addLocalizationByDefault: false,
            defaultBudgetAmount: 0,
            financialCushion: 0,
            localizationSource: LocalizationSource.None,
        });

        const newUserId = await newUser.insert();

        const userToken = jwt.sign({id: newUserId}, config.jwtSecret, {
            expiresIn: 3600,
        });

        req.session.token = userToken;

        sendSuccessJsonHandler(res, {
            userToken,
            data: {
                ...newUser,
                password: '',
            }
        });
    })

    .put('/', verifyToken, async (req: UserRequest, res) => {
        const user = await UserRecord.getOneById(req.userId);

        if (!user) {
            throw new Error('User not found!');
        }

        user.financialCushion = req.body.financialCushion;
        user.defaultBudgetAmount = req.body.defaultBudgetAmount;
        user.addLocalizationByDefault = req.body.addLocalizationByDefault;

        await user.update();

        sendSuccessJsonHandler(res, true);
    })

    .post('/session', async (req, res) => {
        const user = await UserRecord.getOneByEmail(req.body.email);

        if (!user) {
            throw new ValidationError('Użytkownik lub hasło są nieprawidłowe.');
        }

        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            throw new ValidationError('Użytkownik lub hasło są nieprawidłowe.');
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
            },
            actualPeriod: actualPeriod ?? null,
        });
    })

    .delete('/session', verifyToken, async (req, res) => {
        req.session = null;

        sendSuccessJsonHandler(res, "Wylogowano użytkownika.");
    });