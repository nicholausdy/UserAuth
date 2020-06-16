import Redis from "ioredis"
import { IResponse } from "../interface/interfaceCollection"

export async function updateProfile(user_id : string, nama_lengkap : string, idkaryawan : string, no_hp : string, email_2 : string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''} 
    const redisClient : any = new Redis() //default port 6379
    try {
        const key : string = "profile:".concat(user_id)
        const insertResult1 = redisClient.hset(key,"nama_lengkap",nama_lengkap) // "key","subkey","value"
        const insertResult2 = redisClient.hset(key,"idkaryawan",idkaryawan)
        const insertResult3 = redisClient.hset(key,"no_hp", no_hp)
        const insertResult4 = redisClient.hset(key,"email_2",email_2)
        await Promise.all([insertResult1, insertResult2, insertResult3, insertResult4])
        await redisClient.expire(key, 86400) // expiry : 1 day -> 86400 seconds
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

export async function readProfile(user_id : string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    const redisClient : any = new Redis()
    try {
        const key : string = "profile:".concat(user_id)
        let getResult : any = await redisClient.hgetall(key)
        if (Object.keys(getResult).length === 0) { //check empty object
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
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