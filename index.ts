import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import {handleError} from "./utils/error";
import {config} from "./config/config";
import {operationRouter} from "./routers/operation.router";
import {periodRouter} from "./routers/period.router";
import cookieSession from "cookie-session";

const app = express();

app
    .use(cors({
        origin: config.corsOrigin,
    }))
    .use(express.json())
    .use(cookieSession({
            name: "bezkoder-session",
            secret: config.cookieSecret, // @TODO should use as secret environment variable or better secret
            httpOnly: true,
        })
    );

app
    .use('/operation', operationRouter)
    .use('/period', periodRouter)

app.use(handleError);

app.listen(3001, 'localhost', () => {
    console.log('Listening on http://localhost:3001');
});
