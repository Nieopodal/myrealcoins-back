import multer from "multer";
import {Request} from "express";
import {ValidationError} from "./error";

export const upload = multer({
    limits: {
        fileSize: 7000000,
    },
    fileFilter(req: Request, file: Express.Multer.File, cb: (error: ValidationError | null, isOk?: boolean) => void) {
        if (!file.originalname.match(/\.(jpg|jpeg)$/) || (file.mimetype !== 'image/jpeg')) {
            return cb(new ValidationError('Dodawany plik jest nieprawidłowy.'));
        }
        cb(null, true);
    }
});