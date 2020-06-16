"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
async function updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default(); //default port 6379
    try {
        const key = "profile:".concat(user_id);
        const insertResult1 = redisClient.hset(key, "nama_lengkap", nama_lengkap); // "key","subkey","value"
        const insertResult2 = redisClient.hset(key, "idkaryawan", idkaryawan);
        const insertResult3 = redisClient.hset(key, "no_hp", no_hp);
        const insertResult4 = redisClient.hset(key, "email_2", email_2);
        await Promise.all([insertResult1, insertResult2, insertResult3, insertResult4]);
        await redisClient.expire(key, 86400); // expiry : 1 day -> 86400 seconds
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
exports.updateProfile = updateProfile;
async function readProfile(user_id) {
    let resp = { Status: '', Message: '' };
    const redisClient = new ioredis_1.default();
    try {
        const key = "profile:".concat(user_id);
        let getResult = await redisClient.hgetall(key);
        if (Object.keys(getResult).length === 0) {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
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
exports.readProfile = readProfile;
