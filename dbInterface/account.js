"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig_1 = require("./dbConfig");
const database_1 = require("../errorHandler/database");
const perf = require('execution-time')();
async function registerAccount(user_id, email, password, isverified, tempcode, nama_lengkap) {
    perf.start();
    let resp = { Status: '', Message: '' };
    try {
        const text1 = 'INSERT INTO account(user_id, email, password, isverified, tempcode) VALUES ($1,$2,$3,$4,$5)';
        const values1 = [user_id, email, password, isverified, tempcode];
        const text2 = 'INSERT INTO profile(user_id, nama_lengkap) VALUES ($1,$2)';
        const values2 = [user_id, nama_lengkap];
        const insertResult1 = await dbConfig_1.db.query(text1, values1);
        const insertResult2 = await dbConfig_1.db.query(text2, values2);
        resp.Status = 'Success';
        resp.Message = 'Record insert successful';
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        const result = perf.stop();
        console.log('Time to write to DB:', result.time);
        return resp;
    }
}
exports.registerAccount = registerAccount;
async function readAccount(user_id) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'SELECT * FROM account WHERE user_id = $1';
        const values = [user_id];
        const query_result = await dbConfig_1.db.query(text, values);
        if (typeof query_result.rows[0] === 'undefined') {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
        else {
            resp.Status = 'Success';
            resp.Message = query_result.rows[0];
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.readAccount = readAccount;
async function readAccountByEmail(email) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'SELECT * FROM account WHERE email = $1';
        const values = [email];
        const query_result = await dbConfig_1.db.query(text, values);
        if (typeof query_result.rows[0] === 'undefined') {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
        else {
            resp.Status = 'Success';
            resp.Message = query_result.rows[0];
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.readAccountByEmail = readAccountByEmail;
async function readProfile(user_id) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'SELECT * FROM profile WHERE user_id = $1';
        const values = [user_id];
        const query_result = await dbConfig_1.db.query(text, values);
        if (typeof query_result.rows[0] === 'undefined') {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
        else {
            resp.Status = 'Success';
            resp.Message = query_result.rows[0];
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.readProfile = readProfile;
//updatePassword
async function updatePassword(email, password) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'UPDATE account SET password=$2 WHERE email=$1';
        const values = [email, password];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Password successfully updated';
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.updatePassword = updatePassword;
//updateVerification
async function updateVerification(username, isverified) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'UPDATE account SET isverified=$2 WHERE user_id=$1';
        const values = [username, isverified];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Account verification status changed to '.concat(isverified.toString());
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.updateVerification = updateVerification;
//updateTempCode
async function updateTempCode(email, tempcode) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'UPDATE account SET tempcode=$2 WHERE email=$1';
        const values = [email, tempcode];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Tempcode successfully generated';
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.updateTempCode = updateTempCode;
//deleteTempCode
async function deleteTempCode(email) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'UPDATE account SET tempcode=0 WHERE email=$1';
        const values = [email];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Tempcode successfully deleted';
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.deleteTempCode = deleteTempCode;
async function deleteAccount(user_id) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'DELETE FROM account WHERE user_id=$1';
        const values = [user_id];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Account successfully deleted';
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.deleteAccount = deleteAccount;
//getTempCode
async function getTempCode(user_id) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'SELECT tempcode FROM account WHERE user_id=$1';
        const values = [user_id];
        const query_result = await dbConfig_1.db.query(text, values);
        if (typeof query_result.rows[0] === 'undefined') {
            resp.Status = 'Failed';
            resp.Message = 'Username not found';
        }
        else {
            if ((query_result.rows[0].tempcode == null) || (query_result.rows[0].tempcode == 0)) {
                resp.Status = 'Failed';
                resp.Message = 'Temp code is not available';
            }
            else {
                resp.Status = 'Success';
                resp.Message = query_result.rows[0];
            }
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = await database_1.databaseError(e);
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.getTempCode = getTempCode;
