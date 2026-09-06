export const sendResponse = (res, responseData) => {
    const { httpStatusCode, success, message, meta, data } = responseData;
    res.status(httpStatusCode).json({
        success,
        message,
        meta: meta || undefined,
        data,
    });
};
