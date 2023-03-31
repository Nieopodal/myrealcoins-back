import {Request, Response, Router} from "express";
import {OperationRecord} from "../records/operation.record";
import {NewOperationEntity} from "../types";
import {PeriodRecord} from "../records/period.record";
import {AddOperationToBudgetHandler} from "../utils/add-operation-to-budget-handler";
import {ReverseOperationHandler} from "../utils/reverse-operation-handler";
import {sendSuccessJsonHandler} from "../utils/json-response-handlers";
import {checkIfImageExists} from "../utils/user-directory-handler";
import {safeJoinPhotoPath} from "../utils/safe-join-path";
import {deletingImgHandler} from "../utils/deleting-img-handler";
import {getProperValueTypesFromReqHandler} from "../utils/get-proper-value-types-from-req-handler";
import {uploadImageHandler} from "../utils/upload-image-handler";
import {upload} from "../utils/upload";
import {ValidationError} from "../utils/error";

export const user = {
    id: '[test-user-id]',
};  // @TODO remember to remove this mock when UserRecord is ready.

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

    .post('/', upload.single('image'), async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const imageUrl = await uploadImageHandler(req, res);
        const newOperation = new OperationRecord({
            ...getProperValueTypesFromReqHandler(req.body),
            userId: user.id,
            periodId: actualPeriod.id,
            imgUrl: imageUrl ?? null,
        } as NewOperationEntity);
        await AddOperationToBudgetHandler(newOperation, actualPeriod);
        const newOperationId = await newOperation.insert();
        sendSuccessJsonHandler(res, newOperationId);
    })

    .post('/repetitive-operation', upload.single('image'), async (req, res) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const newRootOperation = new OperationRecord({
            ...getProperValueTypesFromReqHandler(req.body),
            lat: null,
            lon: null,
            imgUrl: null,
            periodId: null,
            isRepetitive: true,
            userId: user.id,
        } as NewOperationEntity);

        const imageUrl = await uploadImageHandler(req, res);

        const newActualOperation = new OperationRecord({
            ...newRootOperation,
            lat: Number(req.body.lat),
            lon: Number(req.body.lon),
            id: null,
            periodId: actualPeriod.id,
            originId: newRootOperation.id,
            imgUrl: imageUrl ?? null,
        });
        await AddOperationToBudgetHandler(newActualOperation, actualPeriod);
        await newRootOperation.insert();
        const newOperationId = await newActualOperation.insert();
        sendSuccessJsonHandler(res, newOperationId);
    })

    .put('/:id', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

        if  (foundOperation.periodId && foundOperation.periodId !== actualPeriod.id) {
            throw new ValidationError('Operacja nie należy do obecnego okresu.');
        }

        new OperationRecord({
            ...foundOperation,
            id: foundOperation.id,
            userId: user.id,
            category: req.body.category,
            subcategory: req.body.subcategory,
            amount: req.body.amount,
            description: req.body.description,
        } as NewOperationEntity);

        if (foundOperation.periodId) {
            await ReverseOperationHandler(foundOperation, actualPeriod);
        }
        foundOperation.category = req.body.category;
        foundOperation.subcategory = req.body.subcategory;
        foundOperation.amount = req.body.amount;
        foundOperation.description = req.body.description;

        if (foundOperation.periodId) {
            console.log(foundOperation.periodId, 'period')
            await AddOperationToBudgetHandler(foundOperation, actualPeriod);
        }
        const modifiedId = await foundOperation.update();
        sendSuccessJsonHandler(res, modifiedId);
    })

    .delete('/:id/:childId?', async (req: Request, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(user.id);
        const foundOperation = await OperationRecord.getOne(req.params.id, user.id);

        if  (foundOperation.periodId && foundOperation.periodId !== actualPeriod.id) {
            throw new ValidationError('Operacja nie należy do obecnego okresu.');
        }

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

    .get('/image/:id', async (req, res) => {
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


