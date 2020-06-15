import {Pool} from "pg";
require('dotenv').config();

export const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    max: Number(process.env.DB_MAXPOOL),
    idleTimeoutMillis: Number(process.env.DB_IDLETIMEOUT),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTIONTIMEOUT)
});