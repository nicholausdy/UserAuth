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
const accountRedisInterface = __importStar(require("../redisInterface/account"));
const rabbitRequest_1 = require("./rabbitRequest");
const bcrypt = __importStar(require("bcrypt"));
const nodemailer = require('nodemailer');
const jwt = __importStar(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
require('dotenv').config();
const perf = require('execution-time')();
async function generateUUID() {
    // reference: https://gist.github.com/6174/6062387
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function hashPassword(password) {
    let resp = { Status: '', Message: '' };
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}
async function comparePassword(plainTextPassword, hashedPassword) {
    let resp = { Status: '', Message: '' };
    try {
        const isMatched = await bcrypt.compare(plainTextPassword, hashedPassword);
        resp.Status = 'Success';
        resp.Message = isMatched;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Hashing comparison failed';
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
async function registerUser(email, password, nama_lengkap) {
    perf.start();
    let resp = { Status: '', Message: '' };
    const [user_id, hashResult] = await Promise.all([generateUUID(), hashPassword(password)]);
    const checkEmail = await accountRedisInterface.getUserID(email);
    if (checkEmail.Status == 'Success') {
        resp.Status = 'Failed';
        resp.Message = 'Email has already been registered';
        resp.Code = 403;
    }
    else {
        resp = await accountRedisInterface.getAccount(user_id);
        if (resp.Status == 'Failed') {
            resp = await accountRedisInterface.registerAccount(user_id, email, hashResult, false, 0, nama_lengkap, false);
            if (resp.Status == 'Success') {
                let req = {};
                req.user_id = user_id;
                req.email = email;
                req.password = hashResult;
                req.nama_lengkap = nama_lengkap;
                req.action = 'registerAccount';
                resp = await rabbitRequest_1.requestHandler(req);
            }
            else {
                resp.Code = 500;
            }
        }
        else {
            resp.Status = 'Failed';
            resp.Message = 'Please re-register';
            resp.Code = 500;
        }
    }
    const result = perf.stop();
    console.log('Total time to write to Redis and send to queue', result.time);
    return resp;
}
exports.registerUser = registerUser;
async function commitAccounttoDB(data) {
    let resp = { Status: '', Message: '' };
    resp = await accountDBInterface.registerAccount(data.user_id, data.email, data.password, false, 0, data.nama_lengkap, false);
    if (resp.Status == 'Success') {
        const url = await getURL();
        //add token to url for added security
        const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
        const passphrase = process.env.JWT_PASSPHRASE;
        const token = jwt.sign({ user_id: data.user_id, email: data.email, type: 'verification_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: 1800 });
        resp = await mailerForVerification(data.email, url.concat('/account/verify', '/', data.user_id, '/', token));
        if (resp.Status == 'Success') {
            resp.Code = 200;
        }
        else {
            resp.Code = 500;
            resp.Email = data.email;
            resp.Action = 'resendVerification';
        }
    }
    else {
        resp.Code = 500;
        if (resp.Message == 'Primary key already exists') {
            resp.Email = data.email;
            resp.Message = 'Username already exists';
            resp.Action = 'existingUsernameFailure';
        }
    }
    return resp;
}
exports.commitAccounttoDB = commitAccounttoDB;
async function resendVerificationEmail(email) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchUserIDfromRedis = await accountRedisInterface.getUserID(email);
    if (fetchUserIDfromRedis.Status == 'Failed') {
        const fetchAccountfromDB = await accountDBInterface.readAccountByEmail(email);
        if (fetchAccountfromDB.Status == 'Failed') {
            resp = fetchAccountfromDB;
            resp.Code = 404;
            req = resp;
            req.email = email;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(fetchAccountfromDB.Message.user_id);
            const insertRedisResult = await accountRedisInterface.registerAccount(fetchAccountfromDB.Message.user_id, fetchAccountfromDB.Message.email, fetchAccountfromDB.Message.password, fetchAccountfromDB.Message.isverified, fetchAccountfromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchAccountfromDB.Message.isloggedin);
            if (insertRedisResult.Status == 'Failed') {
                resp = insertRedisResult;
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
            }
            else {
                let url = await getURL();
                const user_id = fetchAccountfromDB.Message.user_id;
                resp = insertRedisResult;
                resp.Message = 'Please wait for verification email';
                resp.Code = 200;
                const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
                const passphrase = process.env.JWT_PASSPHRASE;
                const token = jwt.sign({ user_id: user_id, email: email, type: 'verification_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: 1800 });
                url = url.concat('/account/verify', '/', user_id, '/', token);
                req = resp;
                req.email = email;
                req.url = url;
                req.action = 'resendVerificationEmail';
            }
        }
    }
    else {
        let url = await getURL();
        const user_id = fetchUserIDfromRedis.Message.user_id;
        resp = fetchUserIDfromRedis;
        resp.Message = 'Please wait for verification email';
        resp.Code = 200;
        const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
        const passphrase = process.env.JWT_PASSPHRASE;
        const token = jwt.sign({ user_id: user_id, email: email, type: 'verification_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: 1800 });
        url = url.concat('/account/verify', '/', user_id, '/', token);
        req = resp;
        req.email = email;
        req.url = url;
        req.action = 'resendVerificationEmail';
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.resendVerificationEmail = resendVerificationEmail;
async function mailerForVerification(email, url) {
    perf.start();
    let resp = { Status: '', Message: '' };
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Account',
            text: 'Thank you for registering your account for the first time.\nClick this link to verify your account (link will expire in 30 minutes): '.concat(url)
        };
        const mailerResult = await transporter.sendMail(mailOptions);
        resp.Status = 'Success';
        resp.Message = 'Verification email has been sent';
        resp.Detail = mailerResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Email failed to be sent, please re-register';
        resp.Detail = e;
    }
    const result = perf.stop();
    console.log('Time to send email', result.time);
    return resp;
}
exports.mailerForVerification = mailerForVerification;
async function getURL() {
    let resp = '';
    const hostURL = process.env.HOST_URL;
    if (typeof hostURL === 'undefined') {
        resp = 'Problems encountered. Please contact the administrator';
    }
    else {
        resp = hostURL.concat('/api/v1');
    }
    return resp;
}
exports.getURL = getURL;
//verify account
async function changeVerificationStatus(user_id, token) {
    let resp = { Status: '', Message: '' };
    let req;
    const token_check = await verifyJWT(token);
    if (token_check.Status == 'Failed') {
        resp = token_check;
        resp.Code = 403;
        req = resp;
        req.user_id = user_id;
        req.action = 'logError';
    }
    else {
        //check whether username in token = requested username
        if (token_check.Message.user_id == user_id) {
            const getResult = await accountRedisInterface.getAccount(user_id);
            if (getResult.Status == 'Failed') {
                //try to fetch from DB
                const getfromDB = await accountDBInterface.readAccount(user_id);
                if (getfromDB.Status == 'Failed') {
                    resp = getfromDB;
                    resp.Code = 404;
                    req = resp;
                    req.user_id = user_id;
                    req.action = 'logError';
                }
                else {
                    const getNamaLengkap = await accountDBInterface.readProfile(user_id);
                    const insertRedisResult = await accountRedisInterface.registerAccount(getfromDB.Message.user_id, getfromDB.Message.email, getfromDB.Message.password, getfromDB.Message.isverified, getfromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, getfromDB.Message.isloggedin);
                    if (insertRedisResult.Status == 'Failed') {
                        resp = insertRedisResult;
                        resp.Code = 500;
                        req = resp;
                        req.user_id = user_id;
                        req.action = 'logError';
                    }
                    else {
                        resp = await accountRedisInterface.updateVerificationField(user_id, true);
                        if (resp.Status == 'Success') {
                            resp.Message = 'Account has been verified';
                            resp.Code = 200;
                            req = resp;
                            req.user_id = user_id;
                            req.action = 'updateVerification';
                        }
                        else {
                            resp.Code = 500;
                            req = resp;
                            req.user_id = user_id;
                            req.action = 'logError';
                        }
                    }
                }
            }
            else {
                resp = await accountRedisInterface.updateVerificationField(user_id, true);
                resp.Message = 'Account has been verified';
                resp.Code = 200;
                req = resp;
                req.user_id = user_id;
                req.action = 'updateVerification';
            }
            //resp = await accountDBInterface.updateVerification(username,true)
            // if (resp.Status == 'Success'){
            //    resp.Code = 200
            //    resp.Message = 'Account has been verified'
            //}
            //else {
            //    resp.Code = 500
            // }
        }
        else {
            resp.Status = 'Failed';
            resp.Code = 403;
            resp.Message = 'Invalid token';
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.changeVerificationStatus = changeVerificationStatus;
//validate username and password
async function validateCredentials(email, password) {
    let resp = { Status: '', Message: '' };
    const emailFetchRedis = await accountRedisInterface.getUserID(email);
    if (emailFetchRedis.Status == 'Failed') {
        const passwordFetchDB = await accountDBInterface.readAccountByEmail(email);
        let req;
        if (passwordFetchDB.Status == 'Failed') {
            resp = passwordFetchDB;
            resp.Code = 404;
            req = resp;
            req.email = email;
            req.action = 'logError';
            const sendToQueue = await rabbitRequest_1.requestHandler(req);
        }
        else {
            const fetchNamaLengkap = await accountDBInterface.readProfile(passwordFetchDB.Message.user_id);
            const insertRedisResult = await accountRedisInterface.registerAccount(passwordFetchDB.Message.user_id, passwordFetchDB.Message.email, passwordFetchDB.Message.password, passwordFetchDB.Message.isverified, passwordFetchDB.Message.tempcode, fetchNamaLengkap.Message.nama_lengkap, passwordFetchDB.Message.isloggedin);
            if (insertRedisResult.Status == 'Failed') {
                resp = insertRedisResult;
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
            else {
                const getUserIDResult = await accountRedisInterface.getUserID(email);
                const getfromRedis = await accountRedisInterface.getAccount(getUserIDResult.Message.user_id);
                if (getfromRedis.Status == 'Failed') {
                    resp = getfromRedis;
                    resp.Code = 500;
                    req = resp;
                    req.email = email;
                    req.action = 'logError';
                    const sendToQueue = await rabbitRequest_1.requestHandler(req);
                }
                else {
                    resp = await comparePassword(password, getfromRedis.Message.password);
                    if (resp.Status == 'Failed') {
                        resp.Code = 500;
                    }
                    else {
                        resp.Code = 200;
                    }
                }
            }
        }
    }
    else {
        const getAccountResult = await accountRedisInterface.getAccount(emailFetchRedis.Message.user_id);
        resp = await comparePassword(password, getAccountResult.Message.password);
        //hashing function failed
        if (resp.Status == 'Failed') {
            resp.Code = 500;
        }
        else {
            resp.Code = 200;
        }
    }
    return resp;
}
//login -- check if username found, password right, and account has been verified / not
async function login(email, password) {
    let resp = { Status: '', Message: '' };
    let req;
    try {
        const isCredentialValid = await validateCredentials(email, password);
        //generate token only when username and password are validated + account is verified
        if ((isCredentialValid.Status == 'Success') && (isCredentialValid.Message)) {
            const emailFetchRedis = await accountRedisInterface.getUserID(email);
            const verification_result = await accountRedisInterface.getAccount(emailFetchRedis.Message.user_id);
            if (!(verification_result.Message.isverified)) {
                resp.Status = 'Failed';
                resp.Message = 'Account has not been verified';
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
            else {
                const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
                const passphrase = process.env.JWT_PASSPHRASE;
                const access_token = jwt.sign({ email: email, user_id: emailFetchRedis.Message.user_id, type: 'access_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: '24h' });
                const refresh_token = jwt.sign({ email: email, user_id: emailFetchRedis.Message.user_id, type: 'refresh_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: '5d' });
                resp.Status = 'Success';
                resp.Detail = { access_token: access_token, refresh_token: refresh_token };
                resp.User_id = emailFetchRedis.Message.user_id;
                resp.Message = 'User authentication successful';
                resp.Code = isCredentialValid.Code;
                req = resp;
                req.email = email;
                req.action = 'updateLoggedInStatus';
                const updateRedisLoggedInStatus = accountRedisInterface.updateLoggedInStatus(emailFetchRedis.Message.user_id, true);
                const sendToQueue = rabbitRequest_1.requestHandler(req);
                await Promise.all([updateRedisLoggedInStatus, sendToQueue]);
            }
        }
        else {
            if (isCredentialValid.Status == 'Failed') {
                resp.Status = 'Failed';
                resp.Message = isCredentialValid.Message;
                resp.Code = 401;
                req = resp;
                req.email = email;
                req.action = 'logError';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
            if (!(isCredentialValid.Message)) {
                resp.Status = 'Failed';
                resp.Message = 'Wrong password';
                resp.Code = 401;
                req = resp;
                req.email = email;
                req.action = 'logError';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
        }
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Code = 500;
        resp.Message = 'Internal server error';
        resp.Detail = e;
    }
    finally {
        return resp;
    }
}
exports.login = login;
//jwt verify
async function verifyJWT(token) {
    let resp = { Status: '', Message: '' };
    try {
        const publicKey = fs.readFileSync(__dirname.concat('/jwtRS256.key.pub'));
        const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
        resp.Status = 'Success';
        resp.Code = 200;
        resp.Message = decoded;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Code = 401;
        resp.Message = 'Invalid token';
    }
    finally {
        return resp;
    }
}
//validate function in the auth headers
async function verifyRequest(req) {
    let resp = { Status: 'Failed', Message: 'No token detected in header', Code: 403 };
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (typeof token === 'undefined') {
        resp.Status = 'Failed';
        resp.Code = 403;
        resp.Message = 'No auth header';
    }
    else {
        if (token.startsWith('Bearer ')) {
            //Remove Bearer from string
            token = token.slice(7, token.length);
        }
        if (token) {
            const verifyResult = await verifyJWT(token);
            if (verifyResult.Status == 'Success') {
                if (verifyResult.Message.type == 'access_token') {
                    if (verifyResult.Message.user_id != req.params.user_id) {
                        resp.Status = 'Failed';
                        resp.Code = 403;
                        resp.Message = 'User '.concat(req.params.user_id, ' attempted to access resources owned by other user');
                    }
                    else {
                        resp.Status = verifyResult.Status;
                        resp.Code = verifyResult.Code;
                        resp.Message = verifyResult.Message;
                    }
                }
                else {
                    resp.Status = 'Failed';
                    resp.Code = 403;
                    resp.Message = 'Wrong token type provided';
                }
            }
            else {
                resp.Status = verifyResult.Status;
                resp.Code = verifyResult.Code;
                resp.Message = verifyResult.Message;
            }
        }
    }
    return resp;
}
exports.verifyRequest = verifyRequest;
async function verifyRefreshToken(req) {
    let resp = { Status: '', Message: '' };
    const verifyResult = await verifyJWT(req.body.refresh_token);
    if (verifyResult.Status == 'Success') {
        if (verifyResult.Message.type == 'refresh_token') {
            if (verifyResult.Message.user_id != req.params.user_id) {
                resp.Status = 'Failed';
                resp.Code = 403;
                resp.Message = 'User '.concat(req.params.user_id, ' attempted to access resources owned by other user');
            }
            else {
                resp.Status = verifyResult.Status;
                resp.Code = verifyResult.Code;
                resp.Message = verifyResult.Message;
            }
        }
        else {
            resp.Status = 'Failed';
            resp.Code = 403;
            resp.Message = 'Wrong token type provided';
        }
    }
    else {
        resp.Status = verifyResult.Status;
        resp.Code = verifyResult.Code;
        resp.Message = verifyResult.Message;
    }
    return resp;
}
exports.verifyRefreshToken = verifyRefreshToken;
//create random 4 digit temp token
async function createTempCode() {
    let resp = { Status: '', Message: '' };
    try {
        let tempString = '';
        let i;
        for (i = 0; i <= 8; i++) {
            tempString = tempString.concat((await getRandomNumberBetween(1, 9)).toString());
        }
        resp.Status = 'Success';
        resp.Message = Number(tempString);
    }
    catch (e) {
        resp.Status = 'Success';
        resp.Message = 1111111111;
        resp.Detail = e;
    }
    return resp;
    async function getRandomNumberBetween(min, max) {
        try {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
        catch (e) {
            return 1;
        }
    }
}
exports.createTempCode = createTempCode;
async function insertTempCode(email) {
    let resp = { Status: '', Message: '' };
    let req;
    const tempcode_result = await createTempCode();
    const tempcode = tempcode_result.Message;
    const fetchUserIDFromRedis = await accountRedisInterface.getUserID(email);
    if (fetchUserIDFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readAccountByEmail(email);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            req = resp;
            req.email = email;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(fetchFromDB.Message.user_id);
            const insertRedis = await accountRedisInterface.registerAccount(fetchFromDB.Message.user_id, fetchFromDB.Message.email, fetchFromDB.Message.password, fetchFromDB.Message.isverified, fetchFromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchFromDB.Message.isloggedin);
            if (insertRedis.Status == 'Failed') {
                resp = insertRedis;
                req = resp;
                req.email = email;
                req.action = 'logError';
            }
            else {
                const tempcode_insert_result = await accountRedisInterface.updateTempCode(fetchFromDB.Message.user_id, tempcode);
                resp = tempcode_insert_result;
                req = resp;
                req.email = email;
                if (tempcode_insert_result.Status == 'Failed') {
                    req.action = 'logError';
                }
                else {
                    req.tempcode = tempcode;
                    req.action = 'insertTempCode';
                }
            }
        }
    }
    else {
        resp = await accountRedisInterface.updateTempCode(fetchUserIDFromRedis.Message.user_id, tempcode);
        req = resp;
        req.email = email;
        if (resp.Status == 'Failed') {
            req.action = 'logError';
        }
        else {
            req.tempcode = tempcode;
            req.action = 'insertTempCode';
        }
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
async function getTempCode(email) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchUserIDFromRedis = await accountRedisInterface.getUserID(email);
    if (fetchUserIDFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readAccountByEmail(email);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            req = resp;
            req.email = email;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(fetchFromDB.Message.user_id);
            const insertRedis = await accountRedisInterface.registerAccount(fetchFromDB.Message.user_id, fetchFromDB.Message.email, fetchFromDB.Message.password, fetchFromDB.Message.isverified, fetchFromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchFromDB.Message.isloggedin);
            if (insertRedis.Status == 'Failed') {
                resp = insertRedis;
                req = resp;
                req.email = email;
                req.action = 'logError';
            }
            else {
                const tempcode_query_result = await accountRedisInterface.getAccount(fetchFromDB.Message.user_id);
                if (tempcode_query_result.Status == 'Failed') {
                    resp = tempcode_query_result;
                    req = resp;
                    req.email = email;
                    req.action = 'logError';
                }
                else {
                    const tempcode = tempcode_query_result.Message.tempcode;
                    resp.Status = 'Success';
                    resp.Message = tempcode;
                    req = resp;
                    req.email = email;
                    req.action = 'standardLog';
                }
            }
        }
    }
    else {
        const fetchTempcodeFromRedis = await accountRedisInterface.getAccount(fetchUserIDFromRedis.Message.user_id);
        resp.Status = 'Success';
        resp.Message = fetchTempcodeFromRedis.Message.tempcode;
        req = resp;
        req.email = email;
        req.action = 'standardLog';
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
async function removeTempCode(email) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchUserIDFromRedis = await accountRedisInterface.getUserID(email);
    resp = await accountRedisInterface.updateTempCode(fetchUserIDFromRedis.Message.user_id, 0);
    req = resp;
    req.email = email;
    if (resp.Status == 'Failed') {
        req.action = 'logError';
    }
    else {
        req.action = 'deleteTempCode';
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
//change password mailer
async function mailerForChangingPassword(email, tempcode) {
    let resp = { Status: '', Message: '' };
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Change Your Account Password',
            text: 'Enter this passcode on our web to continue changing your password: '.concat(tempcode.toString())
        };
        const mailerResult = await transporter.sendMail(mailOptions);
        resp.Status = 'Success';
        resp.Message = 'Passcode email has been sent';
        resp.Detail = mailerResult;
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Message = 'Email failed to be sent, please make the request again';
        resp.Detail = e;
    }
    return resp;
}
exports.mailerForChangingPassword = mailerForChangingPassword;
//get token to change password handler
async function requestChangePassword(email) {
    let resp = { Status: '', Message: '' };
    const tempcode_insert_result = await insertTempCode(email);
    let req;
    if (tempcode_insert_result.Status == 'Success') {
        const tempcode_query_result = await getTempCode(email);
        const getUserIDFromRedis = await accountRedisInterface.getUserID(email);
        const account_information = await accountRedisInterface.getAccount(getUserIDFromRedis.Message.user_id);
        // get tempcode failed
        if (tempcode_query_result.Status == 'Failed') {
            resp = tempcode_query_result;
            resp.Code = 404;
        }
        else {
            const tempcode = tempcode_query_result.Message;
            // account has not been verified
            if (!(account_information.Message.isverified)) {
                const deleteResult = await removeTempCode(email);
                resp.Status = 'Failed';
                resp.Message = 'Account has not been verified. '.concat(deleteResult.Message);
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
            else {
                resp.Status = 'Success';
                resp.Message = 'Please wait for email to change password';
                resp.Code = 200;
                req = resp;
                req.email = email;
                req.tempcode = tempcode;
                req.action = 'requestChangePassword';
                const sendToQueue = await rabbitRequest_1.requestHandler(req);
            }
        }
    }
    else {
        resp = tempcode_insert_result;
        resp.Code = 500;
        req = resp;
        req.email = email;
        req.action = 'logError';
        const sendToQueue = await rabbitRequest_1.requestHandler(req);
    }
    return resp;
}
exports.requestChangePassword = requestChangePassword;
//change password handler using generated token
async function changePassword(email, tempcode, newpassword) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchUserIDFromRedis = await accountRedisInterface.getUserID(email);
    if (fetchUserIDFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readAccountByEmail(email);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            resp.Code = 404;
            req = resp;
            req.email = email;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(fetchFromDB.Message.user_id);
            const insertToRedis = await accountRedisInterface.registerAccount(fetchFromDB.Message.user_id, fetchFromDB.Message.email, fetchFromDB.Message.password, fetchFromDB.Message.isverified, fetchFromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchFromDB.Message.isloggedin);
            if (insertToRedis.Status == 'Failed') {
                resp = insertToRedis;
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
            }
        }
    }
    const tempcode_query_result = await getTempCode(email);
    // get tempcode failed
    if (tempcode_query_result.Status == 'Failed') {
        resp = tempcode_query_result;
        resp.Code = 403;
        req = resp;
        req.email = email;
        req.action = 'logError';
    }
    else {
        //check if inserted tempcode equals to stored tempcode or not.
        if (tempcode_query_result.Message != tempcode) {
            resp.Status = 'Failed';
            resp.Code = 403;
            resp.Message = 'Wrong code. Unable to change password';
            req = resp;
            req.email = email;
            req.action = 'logError';
        }
        else {
            const [getUserIDResult, hashedPasswordResult] = await Promise.all([accountRedisInterface.getUserID(email), hashPassword(newpassword)]);
            const change_password_result = await accountRedisInterface.updatePassword(getUserIDResult.Message.user_id, hashedPasswordResult);
            //update failed
            if (change_password_result.Status == 'Failed') {
                resp = change_password_result;
                resp.Code = 500;
                req = resp;
                req.email = email;
                req.action = 'logError';
            }
            else {
                resp = change_password_result;
                resp.Message = 'Password successfully changed';
                resp.Code = 200;
                req = resp;
                req.email = email;
                req.password = hashedPasswordResult;
                req.action = 'changePassword';
                const deleteResult = await removeTempCode(email);
            }
        }
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.changePassword = changePassword;
async function refreshToken(user_id) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchFromRedis = await accountRedisInterface.getAccount(user_id);
    if (fetchFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readAccount(user_id);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            resp.Code = 404;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(user_id);
            const insertRedisResult = await accountRedisInterface.registerAccount(user_id, fetchFromDB.Message.email, fetchFromDB.Message.password, fetchFromDB.Message.isverified, fetchFromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchFromDB.Message.isloggedin);
            if (!(fetchFromDB.Message.isloggedin)) {
                resp.Status = 'Failed';
                resp.Message = 'User is not logged in';
                resp.Code = 404;
                req = resp;
                req.user_id = user_id;
                req.action = 'logError';
            }
            else {
                const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
                const passphrase = process.env.JWT_PASSPHRASE;
                const access_token = jwt.sign({ email: fetchFromDB.Message.email, user_id: user_id, type: 'access_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: '24h' });
                resp.Status = 'Success';
                resp.Detail = { access_token: access_token };
                resp.Message = 'Token refreshed';
                resp.Code = 200;
                req = resp;
                req.user_id = user_id;
                req.action = 'standardLog';
            }
        }
    }
    else {
        if (!(fetchFromRedis.Message.isloggedin)) {
            resp.Status = 'Failed';
            resp.Message = 'User is not logged in';
            resp.Code = 404;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            const privateKey = fs.readFileSync(__dirname.concat('/jwtRS256.key'));
            const passphrase = process.env.JWT_PASSPHRASE;
            const access_token = jwt.sign({ email: fetchFromRedis.Message.email, user_id: user_id, type: 'access_token' }, { key: privateKey, passphrase: passphrase }, { algorithm: "RS256", expiresIn: '24h' });
            resp.Status = 'Success';
            resp.Message = 'Token refreshed';
            resp.Detail = { access_token: access_token };
            resp.Code = 200;
            req = resp;
            req.user_id = user_id;
            req.action = 'standardLog';
        }
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.refreshToken = refreshToken;
async function logout(user_id) {
    let resp = { Status: '', Message: '' };
    let req;
    const fetchFromRedis = await accountRedisInterface.getAccount(user_id);
    if (fetchFromRedis.Status == 'Failed') {
        const fetchFromDB = await accountDBInterface.readAccount(user_id);
        if (fetchFromDB.Status == 'Failed') {
            resp = fetchFromDB;
            resp.Code = 404;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            const getNamaLengkap = await accountDBInterface.readProfile(user_id);
            const insertRedisResult = await accountRedisInterface.registerAccount(user_id, fetchFromDB.Message.email, fetchFromDB.Message.password, fetchFromDB.Message.isverified, fetchFromDB.Message.tempcode, getNamaLengkap.Message.nama_lengkap, fetchFromDB.Message.isloggedin);
            if (insertRedisResult.Status == 'Failed') {
                resp = insertRedisResult;
                resp.Code = 500;
                req = resp;
                req.user_id = user_id;
                req.action = 'logError';
            }
            else {
                const updateResult = await accountRedisInterface.updateLoggedInStatus(user_id, false);
                if (updateResult.Status == 'Failed') {
                    resp = updateResult;
                    resp.Code = 500;
                    req = resp;
                    req.user_id = user_id;
                    req.action = 'logError';
                }
                else {
                    resp = updateResult;
                    resp.Message = 'Logout successful';
                    resp.Code = 200;
                    req = resp;
                    req.user_id = user_id;
                    req.action = 'logout';
                }
            }
        }
    }
    else {
        const updateResult = await accountRedisInterface.updateLoggedInStatus(user_id, false);
        if (updateResult.Status == 'Failed') {
            resp = updateResult;
            resp.Code = 500;
            req = resp;
            req.user_id = user_id;
            req.action = 'logError';
        }
        else {
            resp = updateResult;
            resp.Message = 'Logout successful';
            resp.Code = 200;
            req = resp;
            req.user_id = user_id;
            req.action = 'logout';
        }
    }
    const sendToQueue = await rabbitRequest_1.requestHandler(req);
    return resp;
}
exports.logout = logout;
