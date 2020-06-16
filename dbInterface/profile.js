"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig_1 = require("./dbConfig");
const database_1 = require("../errorHandler/database");
async function updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2) {
    let resp = { Status: '', Message: '' };
    try {
        const text = 'UPDATE profile SET nama_lengkap=$2, idkaryawan=$3, no_hp=$4, email_2=$5 WHERE user_id=$1';
        const values = [user_id, nama_lengkap, idkaryawan, no_hp, email_2];
        const query_result = await dbConfig_1.db.query(text, values);
        if (query_result.rowCount != 0) {
            resp.Status = 'Success';
            resp.Message = 'Profile successfully updated';
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
exports.updateProfile = updateProfile;
