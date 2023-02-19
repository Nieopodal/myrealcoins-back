import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import {handleError} from "./utils/error";

const app = express();

app
    .use(cors({
        origin: 'http://localhost:3000',
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
