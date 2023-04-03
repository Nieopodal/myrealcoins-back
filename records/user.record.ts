import {v4 as uuid} from 'uuid';
import {pool} from "../utils/db";
import {LocalizationSource, NewUserEntity, UserEntity} from "../types";
import {FieldPacket} from "mysql2";
import {ValidationError} from "../utils/error";

type UserRecordResults = [UserEntity[], FieldPacket[]];

export class UserRecord implements UserEntity {

    id: string;
    email: string;
    password: string;
    name: string;
    financialCushion: number;
    defaultBudgetAmount: number;
    localizationSource: LocalizationSource;
    addLocalizationByDefault: boolean;

    constructor(obj: NewUserEntity) {

        this.validateNewUserEntity(obj);

        this.id = obj.id ?? uuid();
        this.email = obj.email;
        this.password = obj.password;
        this.name = obj.name;
        this.financialCushion = Number(obj.financialCushion.toFixed(2)) ?? 0;
        this.defaultBudgetAmount = Number(obj.defaultBudgetAmount.toFixed(2)) ?? 0;
        this.localizationSource = obj.localizationSource ?? LocalizationSource.None;
        this.addLocalizationByDefault = obj.addLocalizationByDefault ?? false;
    }

    private validateNewUserEntity(obj: NewUserEntity): void {
        if (!obj.password || typeof obj.password !== 'string') {
            throw new ValidationError('Użytkownik musi posiadać hasło.');
        }
        if (!obj.email || typeof obj.email !== 'string') {
            throw new ValidationError('Użytkownik musi posiadać adres email.');
        }
        if (!obj.name || typeof obj.name !== `string`) {
            throw new ValidationError('Użytkownik musi posiadać imię.');
        }
        if (obj.name.length < 3 || obj.name.length > 15) {
            throw new ValidationError('Imię powinno zawierać od 3 do 15 znaków.');
        }
        if (!obj.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
            throw new ValidationError('Podano nieprawidłowy adres email.');
        }
    };

    static async getOneByName(name: string): Promise<null | UserRecord> {
        const [results] = await pool.execute("SELECT * FROM `users` WHERE `name` = :name", {
            name,
        }) as UserRecordResults;

        return results.length === 0 ? null : new UserRecord(results[0]);
    };

    static async getOneById(id: string) {
        const [results] = await pool.execute("SELECT * FROM `users` WHERE `id` = :id", {
            id,
        }) as UserRecordResults;

        return results.length === 0 ? null : new UserRecord(results[0]);
    };
}