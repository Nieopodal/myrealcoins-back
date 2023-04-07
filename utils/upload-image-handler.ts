import {Response} from "express";
import {v4 as uuid} from "uuid";
import {dirname, join} from "path";
import {userDirectoryHandler} from "./user-directory-handler";
import sharp from "sharp";
import {OperationType} from "../types";
import {UserRequest} from "../types/_auth/_auth";

export const uploadImageHandler = async (req: UserRequest, res: Response) => {

    if (req.file && Number(req.body.type) === OperationType.Payment) {
        const name = uuid() + '.jpg';
        const imageDirname = join(dirname(__dirname), `/uploads/${req.userId}`);
        const folderExists = await userDirectoryHandler(imageDirname);

        if (folderExists) {
            await sharp(req.file.buffer)
                .rotate()
                .resize({
                    height: 800,
                    fit: "contain",
                })
                .jpeg()
                .toFile(`${imageDirname}/${name}`)
            res.status(201);
            return name;
        } else throw new Error('Error while uploading new file.');

    } else return null;
};