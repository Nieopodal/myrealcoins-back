import express, {Router} from 'express';
import cors from 'cors';
import 'express-async-errors';
import {handleError} from "./utils/error";
import {config} from "./config/config";
import {operationRouter} from "./routers/operation.router";
import {periodRouter} from "./routers/period.router";
import cookieSession from "cookie-session";
import {userRouter} from "./routers/user.router";
import {sessionRouter} from "./routers/session.router";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();

app
    .use(cors({
        origin: config.corsOrigin,
        credentials: true,
    }))

    .use(rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 150,
    }))

    .use(express.json())
    .use(cookieSession({
            name: "session",
            secret: config.cookieSecret,
            httpOnly: true,
        })
    )
    .use(helmet());

const prefixRouter = Router();

prefixRouter
    .use('/operation', operationRouter)
    .use('/period', periodRouter)
    .use('/user', userRouter)
    .use('/session', sessionRouter);

app.use('/api', prefixRouter);

app.use(handleError);

app.listen(3001, 'localhost', () => {
    console.log('Listening on http://localhost:3001');
});
