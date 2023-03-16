import {Request, Response, Router} from "express";
import {v4 as uuid} from 'uuid';
import multer from "multer";
import sharp from "sharp";
import {OperationRecord} from "../records/operation.record";
import {NewOperationEntity} from "../types";
import {PeriodRecord} from "../records/period.record";
import {AddOperationToBudgetHandler} from "../utils/add-operation-to-budget-handler";
import {ReverseOperationHandler} from "../utils/reverse-operation-handler";
import {sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {ValidationError} from "../utils/error";
import {dirname, join} from "path";
import {checkIfImageExists, userDirectoryHandler} from "../utils/user-directory-handler";
import {safeJoinPhotoPath} from "../utils/safe-join-path";
import {deletingImgHandler} from "../utils/deleting-img-handler";

export const user = {
    id: '[test-user-id]',
};  // @TODO remember to remove this mock when UserRecord is ready.

const upload = multer({
    limits: {
        fileSize: 7000000,
    },
    fileFilter(req: Request, file: Express.Multer.File, cb: (error: ValidationError | null, isOk?: boolean) => void) {
        if (!file.originalname.match(/\.(jpg|jpeg)$/) || (file.mimetype !== 'image/jpeg')) {
            return cb(new ValidationError('Dodawany plik jest nieprawidłowy.'));
        }
        cb(null, true);
    }
})

export const operationRouter = Router()

    .get('/search/description?', async (req: Request, res: Response) => {
        const operationList = await OperationRecord.getAll(req.params.description ?? '', user.id);
        sendSuccessJsonHandler(res, operationList);
    })

    .get('/get-period-operations/:periodId', async (req: Request, res: Response) => {
        const operationList = await OperationRecord.findPeriodOperations(req.params.periodId, user.id);
        sendSuccessJsonHandler(res, operationList);
    })

    .get('/:id', async (req: Request, res: Response) => {
        const operation = await OperationRecord.getOne(req.params.id, user.id);
        sendSuccessJsonHandler(res, operation);
    })

    .post('/', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const newOperation = new OperationRecord({
            ...req.body,
            userId: user.id,
            periodId: actualPeriod.id,
        } as NewOperationEntity);
        await AddOperationToBudgetHandler(newOperation, actualPeriod);
        const newOperationId = await newOperation.insert();
        sendSuccessJsonHandler(res, newOperationId);
    })

    .post('/repetitive-operation', async (req, res) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const newRootOperation = new OperationRecord({
            ...req.body,
            periodId: null,
            isRepetitive: true,
            userId: user.id,
        } as NewOperationEntity);

        const newActualOperation = new OperationRecord({
            ...newRootOperation,
            id: null,
            periodId: actualPeriod.id,
            originId: newRootOperation.id,
        });
        await AddOperationToBudgetHandler(newActualOperation, actualPeriod);
        await newRootOperation.insert();
        const newOperationId = await newActualOperation.insert();
        sendSuccessJsonHandler(res, newOperationId);
    })

    .put('/:id', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

        await ReverseOperationHandler(foundOperation, actualPeriod);
        const editedOperation = new OperationRecord({
            ...req.body,
            id: foundOperation.id,
            userId: user.id,
        } as NewOperationEntity);
        const modifiedId = await editedOperation.update();
        sendSuccessJsonHandler(res, modifiedId);
    })

    .delete('/:id/:childId?', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

        if (!foundOperation.periodId) {
            const childOperation = await OperationRecord.getOne(req.params.childId, user.id);
            if (!childOperation) {
                throw new Error(`Could not find child of operation schema.`);
            }
            childOperation.originId = null;
            childOperation.isRepetitive = false;
            await childOperation.update();
        } else {
            await ReverseOperationHandler(foundOperation, actualPeriod);
        }
        if (foundOperation.imgUrl) {
            const safeImgPath = safeJoinPhotoPath(foundOperation.imgUrl, user.id);
            await checkIfImageExists(safeImgPath);
            await deletingImgHandler(safeImgPath);
        }
        const isRemoved = await foundOperation.delete();
        sendSuccessJsonHandler(res, isRemoved);
    })

    .post('/image', upload.single('upload'), async (req, res) => {

        const name = uuid();

        const imageDirname = join(dirname(__dirname), `/uploads/${user.id}`);
        const folderExists = await userDirectoryHandler(imageDirname);

        if (folderExists) {
            await sharp(req.file.buffer)
                .rotate()
                .resize({
                    height: 1200,
                    fit: "contain",
                })
                .jpeg()
                .toFile(`${imageDirname}/${name}.jpg`)
            res.status(201)
            sendSuccessJsonHandler(res, true);
        } else throw new Error('Error while uploading new file.');
    })
    .get('/image/:id',async(req,res)=>{
        const foundOperation = await OperationRecord.getOne(req.params.id, user.id);
        if (!foundOperation) {
            throw new Error('Searching operation does not exist.');
        }
        if (!foundOperation.imgUrl) {
            throw new Error(`This operation does not have an image.`);
        }
        const safeImgPath = safeJoinPhotoPath(foundOperation.imgUrl, user.id);
        await checkIfImageExists(safeImgPath);

        res.sendFile(safeImgPath);
})


