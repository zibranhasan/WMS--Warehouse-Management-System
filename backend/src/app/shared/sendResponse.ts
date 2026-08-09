import { Response } from "express";

interface IResponseData<T> {
    httpStatusCode: number;
    success: boolean;
    message: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPage?: number;
        totalPages?: number;
    };
    data?: T;
}

export const sendResponse = <T>(
    res: Response,
    responseData: IResponseData<T>,
) => {
    const { httpStatusCode, success, message, meta, data } = responseData;

    res.status(httpStatusCode).json({
        success,
        message,
        meta: meta || undefined,
        data,
    });
};
