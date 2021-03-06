import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import {IResponse} from "./interface/interfaceCollection"
import {serverError} from "./errorHandler/server"
import { registerUser,changeVerificationStatus,login,requestChangePassword, changePassword, verifyRequest, resendVerificationEmail, verifyRefreshToken, refreshToken, logout } from "./handler/account"
import { updateProfile, getProfile } from "./handler/profile"
const perf = require('execution-time')();


const app : any = express();
app.use(cors());
app.use(bodyParser.json({limit: '5mb'}))

//register user
app.post('/api/v1/account/register', async(req:any,res:any) => {
    try{
        perf.start();
        console.log(req.body.password)
        const registerResult : IResponse = await registerUser(req.body.email, req.body.password, req.body.nama_lengkap)
        res.status(registerResult.Code)
        res.json(registerResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time)
    }
})

app.post('/api/v1/account/resendVerification', async (req:any, res:any) => {
    try {
        perf.start();
        const sendResult : IResponse = await resendVerificationEmail(req.body.email)
        res.status(sendResult.Code)
        res.json(sendResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time)
    }
})

app.get('/api/v1/account/verify/:user_id/:token', async(req:any, res:any) => {
    try {
        perf.start();
        const verifyResult : IResponse = await changeVerificationStatus(req.params.user_id, req.params.token)
        res.status(verifyResult.Code)
        res.json(verifyResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time)
    }
})

app.post('/api/v1/account/login', async(req:any, res:any) => {
    try {
        perf.start();
        const loginResult : IResponse = await login(req.body.email,req.body.password)
        res.status(loginResult.Code)
        res.json(loginResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

app.post('/api/v1/account/requestPasswordChange', async(req:any, res:any)=> {
    try {
        perf.start();
        const requestResult : IResponse = await requestChangePassword(req.body.email)
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

app.put('/api/v1/account/changePassword', async(req:any, res: any) => {
    try {
        perf.start();
        const requestResult : IResponse = await changePassword(req.body.email, req.body.tempcode, req.body.password)
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

app.put('/api/v1/profile/updateProfile/:user_id', async(req:any, res:any) => {
    try {
        perf.start();
        let requestResult : IResponse = await verifyRequest(req)
        if (requestResult.Status == 'Success'){
            requestResult  = await updateProfile(req.params.user_id, req.body.nama_lengkap, req.body.idkaryawan, req.body.no_hp, req.body.email_2)
        }
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

app.get('/api/v1/profile/getProfile/:user_id', async(req:any, res:any) => {
    try {
        perf.start();
        let requestResult : IResponse = await verifyRequest(req)
        if (requestResult.Status == 'Success'){
            requestResult  = await getProfile(req.params.user_id)
        }
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

// body: {refresh_token : }
app.post('/api/v1/account/refreshToken/:user_id', async (req:any, res:any) => {
    try {
        perf.start();
        let requestResult : IResponse = await verifyRefreshToken(req)
        if (requestResult.Status == 'Success'){
            requestResult  = await refreshToken(req.params.user_id)
        }
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})

app.get('/api/v1/account/logout/:user_id', async(req:any, res:any) => {
    try {
        perf.start();
        let requestResult : IResponse = await verifyRequest(req)
        if (requestResult.Status == 'Success'){
            requestResult  = await logout(req.params.user_id)
        }
        res.status(requestResult.Code)
        res.json(requestResult)
    }
    catch (e) {
        const errorResult : IResponse = await serverError(e)
        res.status(errorResult.Code)
        res.json(errorResult)
    }
    finally {
        const result : any = perf.stop()
        console.log('Server to client API exec time:',result.time) 
    }
})
app.listen(3000, () => {
    console.log('Maid cafe serving at port 3000')
})