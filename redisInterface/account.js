"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
async function registerAccount(user_id, email, password, isverified, tempcode, nama_lengkap) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default(); //default port 6379
    try {
        const key = "account:".concat(user_id);
        const insertResult1 = redisClient.hset(key, "email", email); // "key","subkey","value"
        const insertResult2 = redisClient.hset(key, "password", password);
        const insertResult3 = redisClient.hset(key, "isverified", isverified.toString());
        const insertResult4 = redisClient.hset(key, "tempcode", tempcode);
        //insert to profile
        const key2 = "profile:".concat(user_id);
        const insertResult5 = redisClient.hset(key2, "nama_lengkap", nama_lengkap);
        //mapping user_id -> email
        const key3 = "account_mapping:".concat(email);
        const insertResult6 = redisClient.hset(key3, "user_id", user_id);
        await Promise.all([insertResult1, insertResult2, insertResult3, insertResult4, insertResult5, insertResult6]);
        await Promise.all([redisClient.expire(key, 86400), redisClient.expire(key2, 86400), redisClient.expire(key3, 86400)]); // expiry : 1 day -> 86400 seconds
        resp.Status = 'Success';
        resp.Message = 'Redis insert successful';
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Redis insert failed';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.registerAccount = registerAccount;
async function getUserID(email) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account_mapping:".concat(email);
        let getResult = await redisClient.hgetall(key);
        if (Object.keys(getResult).length === 0) {
            resp.Status = 'Failed';
            resp.Message = 'Email not found';
        }
        else {
            resp.Status = 'Success';
            resp.Message = getResult;
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Failed to fetch record';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.getUserID = getUserID;
async function getAccount(user_id) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account:".concat(user_id);
        let getResult = await redisClient.hgetall(key);
        if (Object.keys(getResult).length === 0) {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
        else {
            getResult.tempcode = Number(getResult.tempcode);
            getResult.isverified = await convertToBool(getResult.isverified);
            resp.Status = 'Success';
            resp.Message = getResult;
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Failed to fetch record';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.getAccount = getAccount;
async function deleteAccount(user_id) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account:".concat(user_id);
        const deleteResult = await redisClient.del(key);
        resp.Status = 'Success';
        resp.Message = deleteResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Failed to delete record';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.deleteAccount = deleteAccount;
async function deleteProfile(user_id) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "profile:".concat(user_id);
        const deleteResult = await redisClient.del(key);
        resp.Status = 'Success';
        resp.Message = deleteResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Failed to delete record';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.deleteProfile = deleteProfile;
async function deleteAccountMapping(email) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "profile:".concat(email);
        const deleteResult = await redisClient.del(key);
        resp.Status = 'Success';
        resp.Message = deleteResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Failed to delete record';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.deleteAccountMapping = deleteAccountMapping;
async function updateVerificationField(user_id, isverified) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account:".concat(user_id);
        const updateResult = await redisClient.hset(key, "isverified", isverified.toString());
        resp.Status = 'Success';
        resp.Message = updateResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Redis update failed';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.updateVerificationField = updateVerificationField;
async function updateTempCode(username, tempcode) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account:".concat(username);
        const updateResult = await redisClient.hset(key, "tempcode", tempcode.toString());
        resp.Status = 'Success';
        resp.Message = updateResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Redis update failed';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.updateTempCode = updateTempCode;
async function updatePassword(username, password) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "account:".concat(username);
        const updateResult = await redisClient.hset(key, "password", password);
        resp.Status = 'Success';
        resp.Message = updateResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Redis update password failed';
        resp.Detail = e;
    }
    finally {
        redisClient.quit();
        return resp;
    }
}
exports.updatePassword = updatePassword;
async function convertToBool(text) {
    if (text == 'true') {
        return true;
    }
    else if (text == 'false') {
        return false;
    }
    else {
        return undefined;
    }
}
