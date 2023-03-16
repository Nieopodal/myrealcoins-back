import {dirname, join, normalize, resolve} from "path";

export const safeJoinPhotoPath= (imgName: string, userId: string): string => {
    const PATH = `/uploads/${userId}`;
    const base = join(dirname(__dirname), PATH);
    const targetPath ='.' + normalize('/' + imgName);
    return resolve(base, targetPath);
};

