"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function databaseError(e) {
    if (e.code == '23505') {
        const message = 'Primary key already exists';
        return message;
    }
    else if (e.code == 'ECONNREFUSED') {
        const message = 'Database connection error';
        return message;
    }
    else {
        const message = 'Unknown error encountered';
        return message;
    }
}
exports.databaseError = databaseError;
