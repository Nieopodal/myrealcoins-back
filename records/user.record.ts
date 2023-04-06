import {v4 as uuid} from 'uuid';
import {pool} from "../utils/db";
import {LocalizationSource, NewUserEntity, UserEntity} from "../types";
import {FieldPacket, ResultSetHeader} from "mysql2";
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
        this.financialCushion = Number(obj.financialCushion) ?? 0;
        this.defaultBudgetAmount = Number(obj.defaultBudgetAmount) ?? 0;
        this.localizationSource = obj.localizationSource ?? LocalizationSource.None;
        this.addLocalizationByDefault = Boolean(obj.addLocalizationByDefault) ?? false;
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
        if (obj.financialCushion && (isNaN(Number(obj.financialCushion)) || obj.financialCushion < 0 || obj.financialCushion > 999999999.99)) {
            throw new ValidationError('FinancialCushion must be a number be a number between 0 and 999 999 999.99');
        }
        if (obj.defaultBudgetAmount && (isNaN(Number(obj.defaultBudgetAmount)) || obj.defaultBudgetAmount < 0 || obj.defaultBudgetAmount > 999999.99)) {
            throw new ValidationError('DefaultBudgetAmount must be a number between 0 and 999 999.99.');
        }
        if (obj.localizationSource && !([0,1,2].includes(obj.localizationSource))) {
            throw new Error('Given localizationSource is invalid.');
        }
    };

    static async getOneByName(name: string): Promise<null | UserRecord> {
        const [results] = await pool.execute("SELECT * FROM `users` WHERE `name` = :name", {
            name,
        }) as UserRecordResults;

        if (results.length > 1) {
            throw new Error('Found more than one user.');
        }

        return results.length === 0 ? null : new UserRecord(results[0]);
    };

    static async getOneByEmail(email: string): Promise<null | UserRecord> {
        const [results] = await pool.execute("SELECT * FROM `users` WHERE `email` = :email", {
            email,
        }) as UserRecordResults;

        if (results.length > 1) {
            throw new Error('Found more than one user.');
        }

        return results.length === 0 ? null : new UserRecord(results[0]);
    };

    static async getOneById(id: string) {
        const [results] = await pool.execute("SELECT * FROM `users` WHERE `id` = :id", {
            id,
        }) as UserRecordResults;

        if (results.length > 1) {
            throw new Error('Found more than one user.');
        }

        return results.length === 0 ? null : new UserRecord(results[0]);
    };

    async insert(): Promise<string> {
        await pool.execute("INSERT INTO `users` (`id`, `email`, `password`, `name`, `financialCushion`, `defaultBudgetAmount`, `localizationSource`, `addLocalizationByDefault`) VALUES(:id, :email, :password, :name, :financialCushion, :defaultBudgetAmount, :localizationSource, :addLocalizationByDefault)", this);

        return this.id;
    };

    async delete(): Promise<boolean> {
        if (!this.id) {
            throw new Error('Error while deleting: given user has no ID!');
        }

        const result = await pool.execute("DELETE FROM `users` WHERE `id` = :id", {
            id: this.id,
        });

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while deleting, number of affected rows is 0.');
        }

        return true;
    };

    async update(): Promise<string> {
        if (!this.id) {
            throw new Error('Error while updating: given user has no ID!');
        }

        const result = await pool.execute("UPDATE `users` SET `financialCushion` = :financialCushion, `defaultBudgetAmount` = :defaultBudgetAmount, `localizationSource` = :localizationSource, `addLocalizationByDefault` = :addLocalizationByDefault WHERE `id` = :id", this);

        if ((result[0] as ResultSetHeader).affectedRows === 0) {
            throw new Error('Error while updating, number of affected rows is 0.');
        }

        return this.id;
    };
}