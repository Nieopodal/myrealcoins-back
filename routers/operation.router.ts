import {Response, Router} from "express";
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
import {verifyToken} from "../utils/user/auth-jwt";
import {UserRequest} from "../types/_auth/_auth";

export const operationRouter = Router()

    .get('/search/description?', verifyToken, async (req: UserRequest, res: Response) => {
        const operationList = await OperationRecord.getAll(req.params.description ?? '', req.userId);
        sendSuccessJsonHandler(res, operationList);
    })

    .get('/get-period-operations/:periodId', verifyToken, async (req: UserRequest, res: Response) => {
        const operationList = await OperationRecord.findPeriodOperations(req.params.periodId, req.userId);
        sendSuccessJsonHandler(res, operationList);
    })

    .get('/:id', verifyToken, async (req: UserRequest, res: Response) => {
        const operation = await OperationRecord.getOne(req.params.id, req.userId);
        sendSuccessJsonHandler(res, operation);
    })

    .post('/', verifyToken, upload.single('image'), async (req: UserRequest, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        const imageUrl = await uploadImageHandler(req, res);
        const newOperation = new OperationRecord({
            ...getProperValueTypesFromReqHandler(req.body),
            userId: req.userId,
            periodId: actualPeriod.id,
            imgUrl: imageUrl ?? null,
        } as NewOperationEntity);
        await AddOperationToBudgetHandler(newOperation, actualPeriod);
        const newOperationId = await newOperation.insert();
        sendSuccessJsonHandler(res, newOperationId);
    })

    .post('/repetitive-operation', verifyToken, upload.single('image'), async (req: UserRequest, res) => {
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        const newRootOperation = new OperationRecord({
            ...getProperValueTypesFromReqHandler(req.body),
            imgUrl: null,
            periodId: null,
            isRepetitive: true,
            userId: req.userId,
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
        console.log({newActualOperation, newRootOperation})
        sendSuccessJsonHandler(res, newOperationId);
    })

    .put('/:id', verifyToken, async (req: UserRequest, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        const foundOperation = await OperationRecord.getOne(req.params.id, req.userId);

        if (foundOperation.periodId && foundOperation.periodId !== actualPeriod.id) {
            throw new ValidationError('Operacja nie należy do obecnego okresu.');
        }

        new OperationRecord({
            ...foundOperation,
            id: foundOperation.id,
            userId: req.userId,
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

    .delete('/:id/:childId?', verifyToken, async (req: UserRequest, res: Response) => {
        const actualPeriod = await PeriodRecord.getActual(req.userId);
        const foundOperation = await OperationRecord.getOne(req.params.id, req.userId);

        if (foundOperation.periodId && foundOperation.periodId !== actualPeriod.id) {
            throw new ValidationError('Operacja nie należy do obecnego okresu.');
        }

        if (!foundOperation.periodId) {
            const childOperation = await OperationRecord.getOne(req.params.childId, req.userId);
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
            const safeImgPath = safeJoinPhotoPath(foundOperation.imgUrl, req.userId);
            await checkIfImageExists(safeImgPath);
            await deletingImgHandler(safeImgPath);
        }
        const isRemoved = await foundOperation.delete();
        sendSuccessJsonHandler(res, isRemoved);
    })

    .get('/image/:id', verifyToken, async (req: UserRequest, res) => {
        const foundOperation = await OperationRecord.getOne(req.params.id, req.userId);
        if (!foundOperation) {
            throw new Error('Searching operation does not exist.');
        }
        if (!foundOperation.imgUrl) {
            throw new Error(`This operation does not have an image.`);
        }
        const safeImgPath = safeJoinPhotoPath(foundOperation.imgUrl, req.userId);
        await checkIfImageExists(safeImgPath);

        res.sendFile(safeImgPath);
    });


