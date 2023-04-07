import {UserEntity} from "../user";

export interface SuccessResponse<T> {
    success: true;
    payload: T;
}

export interface ErrorResponse {
    success: false;
    error: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type UserResponse = ApiResponse<{
    token: string;
    data: UserEntity;
}>

export type FileTransferResponse = Blob;

