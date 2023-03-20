import fs, {mkdir} from "fs/promises";

export const userDirectoryHandler = async (path: string): Promise<boolean> => {
        try {
            if  ((await fs.stat(path)).isDirectory()) {
                return true;
            }
            else {
                await mkdir(path);
                return true;
            }
        } catch(e) {
            if (e.code === 'ENOENT') {
                await mkdir(path);
                return true;
            } else
                return false;
        }
};

export const checkIfImageExists = async (path: string): Promise<boolean> => {
    try {
        if (!(await fs.stat(path)).isFile()) {
            throw new Error('Image could not be found.');
        } else {
            return true;
        }
    } catch(e) {
        throw new Error('Image could not be found.');
    }
};