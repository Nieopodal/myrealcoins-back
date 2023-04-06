import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import {handleError} from "./utils/error";
import {config} from "./config/config";
import {operationRouter} from "./routers/operation.router";
import {periodRouter} from "./routers/period.router";
import cookieSession from "cookie-session";
import {userRouter} from "./routers/user.router";

const app = express();

app
    .use(cors({
        origin: config.corsOrigin,

        credentials: true,
    }))
    .use(express.json())
    .use(cookieSession({
            name: "session",
            secret: config.cookieSecret, // @TODO should use as secret environment variable or better secret
            httpOnly: true,
            // domain: config.corsOrigin,
            // secure: true,
        })
    );

app
    .use('/operation', operationRouter)
    .use('/period', periodRouter)
    .use('/user', userRouter);

app.use(handleError);

app.listen(3001, 'localhost', () => {
    console.log('Listening on http://localhost:3001');
});
