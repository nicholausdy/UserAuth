import Redis from "ioredis"
import { IResponse } from "../interface/interfaceCollection"

export async function registerAccount(user_id : string, email : string, password : string, isverified : boolean, tempcode : number, nama_lengkap : string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''} 
    const redisClient : any = new Redis() //default port 6379
    try {
        const key : string = "account:".concat(user_id)
        const insertResult1 = redisClient.hset(key,"email",email) // "key","subkey","value"
        const insertResult2 = redisClient.hset(key,"password",password)
        const insertResult3 = redisClient.hset(key,"isverified", isverified.toString())
        const insertResult4 = redisClient.hset(key,"tempcode",tempcode)
        //insert to profile
        const key2 : string = "profile:".concat(user_id)
        const insertResult5 = redisClient.hset(key2,"nama_lengkap",nama_lengkap)
        //mapping user_id -> email
        const key3 : string = "account_mapping:".concat(email)
        const insertResult6 = redisClient.hset(key3,"user_id", user_id)
        await Promise.all([insertResult1, insertResult2, insertResult3, insertResult4, insertResult5, insertResult6])
        await Promise.all([redisClient.expire(key, 86400), redisClient.expire(key2, 86400), redisClient.expire(key3, 86400)]) // expiry : 1 day -> 86400 seconds
        resp.Status = 'Success'
        resp.Message = 'Redis insert successful'
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Redis insert failed'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function getUserID(email:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "account_mapping:".concat(email)
        let getResult : any = await redisClient.hgetall(key)
        if (Object.keys(getResult).length === 0) { //check empty object
            resp.Status = 'Failed'
            resp.Message = 'Email not found'
        }
        else {
            resp.Status = 'Success'
            resp.Message = getResult
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Failed to fetch record'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function getAccount(user_id:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "account:".concat(user_id)
        let getResult : any = await redisClient.hgetall(key)
        if (Object.keys(getResult).length === 0) { //check empty object
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        else {
            getResult.tempcode = Number(getResult.tempcode)
            getResult.isverified = await convertToBool(getResult.isverified)
            resp.Status = 'Success'
            resp.Message = getResult
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Failed to fetch record'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function deleteAccount(user_id:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "account:".concat(user_id)
        const deleteResult : any = await redisClient.del(key)
        resp.Status = 'Success'
        resp.Message = deleteResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Failed to delete record'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function deleteProfile(user_id:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "profile:".concat(user_id)
        const deleteResult : any = await redisClient.del(key)
        resp.Status = 'Success'
        resp.Message = deleteResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Failed to delete record'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function deleteAccountMapping(email:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "profile:".concat(email)
        const deleteResult : any = await redisClient.del(key)
        resp.Status = 'Success'
        resp.Message = deleteResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Failed to delete record'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function updateVerificationField(user_id:string, isverified:boolean) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis();
    try {
        const key : string = "account:".concat(user_id)
        const updateResult : any = await redisClient.hset(key,"isverified",isverified.toString()) 
        resp.Status = 'Success'
        resp.Message = updateResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Redis update failed'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function updateTempCode(user_id:string, tempcode:number) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "account:".concat(user_id)
        const updateResult : any = await redisClient.hset(key,"tempcode",tempcode.toString())
        resp.Status = 'Success'
        resp.Message = updateResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Redis update failed'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

export async function updatePassword(user_id:string, password:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "account:".concat(user_id)
        const updateResult : any = await redisClient.hset(key,"password",password)
        resp.Status = 'Success'
        resp.Message = updateResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Redis update password failed'
        resp.Detail = e
    }
    finally {
        redisClient.quit()
        return resp
    }
}

async function convertToBool(text:string) : Promise<boolean | undefined> {
    if (text == 'true'){
        return true
    }
    else if (text == 'false'){
        return false
    }
    else {
        return undefined
    }
}

