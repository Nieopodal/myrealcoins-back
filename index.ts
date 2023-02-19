import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import {handleError} from "./utils/error";
import {config} from "./config/config";

const app = express();

app
    .use(cors({
        origin: config.corsOrigin,
    }))
    .use(express.json());

app
    .get('/', async (req, res) => {

        res.json({
            status: 'ok',
        });
});

app.use(handleError);

app.listen(3001, 'localhost', () => {
    console.log('Listening on http://localhost:3001');
});
