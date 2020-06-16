"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const accountDBInterface = __importStar(require("../dbInterface/account"));
const profileRedisInterface = __importStar(require("../redisInterface/profile"));
const rabbitRequest_1 = require("./rabbitRequest");
async function updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchFromRedis = await profileRedisInterface.readProfile(user_id);
    if (fetchFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readProfile(user_id);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            resp.Code = 404;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
            const sendToQueue = await rabbitRequest_1.requestHandler(req);
        }
        else {
            const insertRedisResult = await profileRedisInterface.updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2);
            if (insertRedisResult.Status == 'Failed') {
                resp = insertRedisResult;
                resp.Code = 500;
                req = resp;
                req.user_id = user_id;
                req.action = 'logError';
            }
            else {
                resp = insertRedisResult;
                resp.Message = 'Profile successfully updated';
                resp.Code = 200;
                req = resp;
                req.user_id = user_id;
                req.nama_lengkap = nama_lengkap;
                req.idkaryawan = idkaryawan;
                req.no_hp = no_hp;
                req.email_2 = email_2;
                req.action = 'updateProfile';
            }
            const sendToQueue = await rabbitRequest_1.requestHandler(req);
        }
    }
    else {
        resp = await profileRedisInterface.updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2);
        if (resp.Status == 'Failed') {
            resp.Code = 500;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            resp.Message = 'Profile successfully updated';
            resp.Code = 200;
            req = resp;
            req.user_id = user_id;
            req.nama_lengkap = nama_lengkap;
            req.idkaryawan = idkaryawan;
            req.no_hp = no_hp;
            req.email_2 = email_2;
            req.action = 'updateProfile';
        }
        const sendToQueue = await rabbitRequest_1.requestHandler(req);
    }
    return resp;
}
exports.updateProfile = updateProfile;
async function getProfile(user_id) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchFromRedis = await profileRedisInterface.readProfile(user_id);
    if (fetchFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readProfile(user_id);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            resp.Code = 404;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            const insertRedisResult = await profileRedisInterface.updateProfile(user_id, fetchFromDB.Message.nama_lengkap, fetchFromDB.Message.idkaryawan, fetchFromDB.Message.no_hp, fetchFromDB.Message.email_2);
            if (insertRedisResult.Status == 'Failed') {
                resp = insertRedisResult;
                resp.Code = 500;
                req = resp;
                req.user_id = user_id;
                req.action = 'logError';
            }
            else {
                resp = await profileRedisInterface.readProfile(user_id);
                resp.Code = 200;
                req = resp;
                req.user_id = user_id;
                req.action = 'standardLog';
            }
        }
    }
    else {
        resp = await profileRedisInterface.readProfile(user_id);
        if (typeof resp.Message.id_karyawan === 'undefined') {
            const fetchFromDB = await accountDBInterface.readProfile(user_id);
            const insertRedisResult = await profileRedisInterface.updateProfile(user_id, fetchFromDB.Message.nama_lengkap, fetchFromDB.Message.idkaryawan, fetchFromDB.Message.no_hp, fetchFromDB.Message.email_2);
            resp = await profileRedisInterface.readProfile(user_id);
        }
        resp.Code = 200;
        req = resp;
        req.user_id = user_id;
        req.action = 'standardLog';
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.getProfile = getProfile;
