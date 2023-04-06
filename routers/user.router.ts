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
import {UserRequest, UserStatus} from "../types/_auth/_auth";
import {sendConfirmationEmail} from "../config/nodemailer.config";

export const userRouter = Router()

    .post('/signup', checkDuplicateUsernameOrEmail, async (req, res) => {

        if (req.body.password !== req.body.confirmPassword) {
            throw new ValidationError('Podane hasła nie są jednakowe.');
        }

        const pwd = req.body.password;

        if (!pwd.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/)) {
            throw new ValidationError('Hasło powinno składać się z 7-15 znaków, w tym przynajmniej z 1 cyfry oraz znaku specjalnego.');
        }

        const emailToken = jwt.sign({email: req.body.email}, config.jwtSecret);

        const newUser = new UserRecord({
            id: null,
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            addLocalizationByDefault: false,
            defaultBudgetAmount: 0,
            financialCushion: 0,
            localizationSource: LocalizationSource.None,
            confirmationCode: emailToken,
            status: UserStatus.Pending,
            resetPwdCode: null,
        });

        await newUser.insert();

        sendConfirmationEmail(newUser.email,
            "Please confirm your account",
            "Email Confirmation",
            "Welcome to MyRealCoins",
            "Thank you for being with us. Please confirm your email by clicking on the following link:",
            `confirm/${emailToken}`
        );

        sendSuccessJsonHandler(res, 'Link aktywacyjny został wysłany na podany adres email. Uwaga: email mógł trafić do spamu.');
    })

    .post('/reset', async (req, res) => {

        const foundUser = await UserRecord.getOneByEmail(req.body.email);

        sendSuccessJsonHandler(res, 'Jeśli podany email istnieje w bazie, to został wysłany link do zmiany hasła, Będzie on aktywny przez 3 godziny.');

        if (foundUser) {
            const emailToken = jwt.sign({email: req.body.email}, config.jwtSecret, {
                expiresIn: 10800,
            });

            foundUser.resetPwdCode = emailToken;
            await foundUser.changePasswordOrResetToken();

            sendConfirmationEmail(foundUser.email,
                "Password reset",
                "Email Confirmation",
                "Hello!",
                "Thank you for being with us. To reset your password, please click on the link below. Link is valid for three hours.",
                `reset/${foundUser.id}/${emailToken}`,
            );
        }
    })

    .post('/reset/:userId/:confirmationCode', async (req, res) => {

        const foundUser = await UserRecord.getOneByConfirmationCode(req.params.confirmationCode, true);

        if (!foundUser || foundUser.id !== req.params.userId) {
            throw new ValidationError('Podano nieprawidłowy token.');
        }

        if (req.body.password !== req.body.confirmPassword) {
            throw new ValidationError('Podane hasła nie są jednakowe.');
        }

        const pwd = req.body.password;

        if (!pwd.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/)) {
            throw new ValidationError('Hasło powinno składać się z 7-15 znaków, w tym przynajmniej z 1 cyfry oraz znaku specjalnego.');
        }

        foundUser.password = bcrypt.hashSync(req.body.password, 10);
        foundUser.resetPwdCode = null;
        await foundUser.changePasswordOrResetToken();

        sendConfirmationEmail(foundUser.email,
            "Your password has been changed",
            "Your password has been changed",
            "Hello!",
            "Thank you for being with us. Your password has been changed successfully. If this is a mistake, please contact us.",
        );

        sendSuccessJsonHandler(res, 'Hasło zostało zmienione. Zaloguj się.');
    })

    .get('/confirm/:confirmationCode', async (req, res) => {
        const foundUser = await UserRecord.getOneByConfirmationCode(req.params.confirmationCode, false);

        if (!foundUser) {
            throw new ValidationError('Podano nieprawidłowy kod aktywacyjny.');
        }
        if (foundUser.status === UserStatus.Active) {
            throw new ValidationError('Konto zostało już aktywowane.');
        }
        foundUser.status = UserStatus.Active;
        await foundUser.activateUser();

        sendSuccessJsonHandler(res, 'Konto zostało aktywowane. Zaloguj się.');
    })

    .put('/', verifyToken, async (req: UserRequest, res) => {
        const user = await UserRecord.getOneById(req.userId);

        if (!user) {
            throw new Error('User not found!');
        }

        if (req.body.defaultBudgetAmount > 999999.99) {
            throw new ValidationError('Domyślna kwota miesięcznego budżetu nie może przekraczać 999 999.99 PLN.');
        }

        if (req.body.defaultBudgetAmount > 999999999.99) {
            throw new ValidationError('Kwota aktualnej poduszki finansowej nie może przekraczać 999 999 999.99 PLN.')
        }

        user.financialCushion = req.body.financialCushion;
        user.defaultBudgetAmount = req.body.defaultBudgetAmount;
        user.addLocalizationByDefault = req.body.addLocalizationByDefault;

        const updatedUser = await user.update();

        sendSuccessJsonHandler(res, updatedUser);
    })

    .post('/session', async (req, res) => {
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

    .delete('/session', verifyToken, async (req, res) => {
        req.session = null;

        sendSuccessJsonHandler(res, "Wylogowano użytkownika.");
    });