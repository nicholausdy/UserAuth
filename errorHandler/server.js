"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function serverError(e) {
    let error = { Status: '', Message: '' };
    error.Status = 'Failed';
    error.Code = 500;
    error.Message = 'Internal server error encountered';
    error.Detail = e;
    console.log(e);
    return error;
}
exports.serverError = serverError;
