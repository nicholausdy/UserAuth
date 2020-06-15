"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const server_1 = require("./errorHandler/server");
const account_1 = require("./handler/account");
const perf = require('execution-time')();
const app = express_1.default();
app.use(cors_1.default());
app.use(body_parser_1.default.json({ limit: '5mb' }));
//register user
app.post('/api/v1/account/register', async (req, res) => {
    try {
        perf.start();
        console.log(req.body.password);
        const registerResult = await account_1.registerUser(req.body.email, req.body.password, req.body.nama_lengkap);
        res.status(registerResult.Code);
        res.json(registerResult);
    }
    catch (e) {
        const errorResult = await server_1.serverError(e);
        res.status(errorResult.Code);
        res.json(errorResult);
    }
    finally {
        const result = perf.stop();
        console.log('Server to client API exec time:', result.time);
    }
});
app.get('/api/v1/account/verify/:user_id/:token', async (req, res) => {
    try {
        perf.start();
        const verifyResult = await account_1.changeVerificationStatus(req.params.user_id, req.params.token);
        res.status(verifyResult.Code);
        res.json(verifyResult);
    }
    catch (e) {
        const errorResult = await server_1.serverError(e);
        res.status(errorResult.Code);
        res.json(errorResult);
    }
    finally {
        const result = perf.stop();
        console.log('Server to client API exec time:', result.time);
    }
});
app.post('/api/v1/account/login', async (req, res) => {
    try {
        perf.start();
        const loginResult = await account_1.login(req.body.email, req.body.password);
        res.status(loginResult.Code);
        res.json(loginResult);
    }
    catch (e) {
        const errorResult = await server_1.serverError(e);
        res.status(errorResult.Code);
        res.json(errorResult);
    }
    finally {
        const result = perf.stop();
        console.log('Server to client API exec time:', result.time);
    }
});
app.get('/api/v1/account/requestPasswordChange/:username', async (req, res) => {
    try {
        perf.start();
        const requestResult = await account_1.requestChangePassword(req.params.username);
        res.status(requestResult.Code);
        res.json(requestResult);
    }
    catch (e) {
        const errorResult = await server_1.serverError(e);
        res.status(errorResult.Code);
        res.json(errorResult);
    }
    finally {
        const result = perf.stop();
        console.log('Server to client API exec time:', result.time);
    }
});
app.post('/api/v1/account/changePassword/:username', async (req, res) => {
    try {
        perf.start();
        const requestResult = await account_1.changePassword(req.params.username, req.body.tempcode, req.body.password);
        res.status(requestResult.Code);
        res.json(requestResult);
    }
    catch (e) {
        const errorResult = await server_1.serverError(e);
        res.status(errorResult.Code);
        res.json(errorResult);
    }
    finally {
        const result = perf.stop();
        console.log('Server to client API exec time:', result.time);
    }
});
app.listen(3000, () => {
    console.log('Maid cafe serving at port 3000');
});
