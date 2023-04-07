import {rm} from "fs/promises";

export const deletingImgHandler = async (fullPathOfImg: string) => {

    try {
        await rm(fullPathOfImg, {
            recursive: false,
        });
    } catch (e) {
        throw new Error(
            e.code === `ENOENT` ?
                `Unable to delete image: ${fullPathOfImg} does not exist.` :
                `Unable to delete image: Unknown error. ${e}`
        );
    }
};