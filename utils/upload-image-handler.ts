import {Request, Response} from "express";
import {v4 as uuid} from "uuid";
import {dirname, join} from "path";
import {userDirectoryHandler} from "./user-directory-handler";
import sharp from "sharp";
import {user} from "../routers/operation.router";
import {OperationType} from "../types";

export const uploadImageHandler = async (req: Request, res: Response) => {

    if (req.file && Number(req.body.type) === OperationType.Payment) {
        const name = uuid() + '.jpg';
        const imageDirname = join(dirname(__dirname), `/uploads/${user.id}`);
        const folderExists = await userDirectoryHandler(imageDirname);

        if (folderExists) {
            await sharp(req.file.buffer)
                .rotate()
                .resize({
                    height: 1000,
                    fit: "contain",
                })
                .jpeg()
                .toFile(`${imageDirname}/${name}`)
            res.status(201);
            return name;
        } else throw new Error('Error while uploading new file.');

    } else return null;
};