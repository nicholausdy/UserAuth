import * as accountDBInterface from "../dbInterface/account"
import * as profileRedisInterface from "../redisInterface/profile"
import { requestHandler } from "./rabbitRequest"
import { IResponse } from "../interface/interfaceCollection"

export async function updateProfile(user_id : string, nama_lengkap : string, idkaryawan : string, no_hp : string, email_2:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    let req : any
    const fetchFromRedis : IResponse = await profileRedisInterface.readProfile(user_id)
    if (fetchFromRedis.Status == 'Failed'){
        const fetchFromDB : IResponse = await accountDBInterface.readProfile(user_id)
        if (fetchFromDB.Status == 'Failed'){
            resp = fetchFromDB
            resp.Code = 404
            req = resp
            req.user_id = user_id
            req.action = 'logError'
            const sendToQueue = await requestHandler(req)
        }
        else {
            const insertRedisResult : IResponse = await profileRedisInterface.updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2)
            if (insertRedisResult.Status == 'Failed'){
                resp = insertRedisResult
                resp.Code = 500
                req = resp
                req.user_id = user_id
                req.action = 'logError' 
            }
            else {
                resp = insertRedisResult
                resp.Message = 'Profile successfully updated'
                resp.Code = 200
                req = resp
                req.user_id = user_id
                req.nama_lengkap = nama_lengkap
                req.idkaryawan = idkaryawan
                req.no_hp = no_hp
                req.email_2 = email_2
                req.action = 'updateProfile'
            }
            const sendToQueue = await requestHandler(req)
        }
    }
    else {
        resp = await profileRedisInterface.updateProfile(user_id, nama_lengkap, idkaryawan, no_hp, email_2)
        if (resp.Status == 'Failed'){
            resp.Code = 500
            req = resp
            req.user_id = user_id
            req.action = 'logError'
        }
        else {
            resp.Message = 'Profile successfully updated'
            resp.Code = 200
            req = resp
            req.user_id = user_id
            req.nama_lengkap = nama_lengkap
            req.idkaryawan = idkaryawan
            req.no_hp = no_hp
            req.email_2 = email_2
            req.action = 'updateProfile'
        }
        const sendToQueue = await requestHandler(req)
    }
    return resp
}

export async function getProfile(user_id : string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    let req : any
    const fetchFromRedis : IResponse = await profileRedisInterface.readProfile(user_id)
    if (fetchFromRedis.Status == 'Failed'){
        const fetchFromDB : IResponse = await accountDBInterface.readProfile(user_id)
        if (fetchFromDB.Status == 'Failed'){
            resp = fetchFromDB
            resp.Code = 404
            req = resp
            req.user_id = user_id
            req.action = 'logError'
        }
        else {
            const insertRedisResult : IResponse = await profileRedisInterface.updateProfile(user_id, fetchFromDB.Message.nama_lengkap, fetchFromDB.Message.idkaryawan, fetchFromDB.Message.no_hp, fetchFromDB.Message.email_2)
            if (insertRedisResult.Status == 'Failed'){
                resp = insertRedisResult
                resp.Code = 500
                req = resp
                req.user_id = user_id
                req.action = 'logError' 
            }
            else {
                resp = await profileRedisInterface.readProfile(user_id)
                resp.Code = 200
                req = resp
                req.user_id = user_id
                req.action = 'standardLog'
            }
        }
    }
    else {       
        resp = await profileRedisInterface.readProfile(user_id)
        if (typeof resp.Message.id_karyawan === 'undefined'){
            const fetchFromDB : IResponse = await accountDBInterface.readProfile(user_id)
            const insertRedisResult : IResponse = await profileRedisInterface.updateProfile(user_id, fetchFromDB.Message.nama_lengkap, fetchFromDB.Message.idkaryawan, fetchFromDB.Message.no_hp, fetchFromDB.Message.email_2)
            resp = await profileRedisInterface.readProfile(user_id)
        }
        resp.Code = 200
        req = resp
        req.user_id = user_id
        req.action = 'standardLog'
    }
    const sendToQueue = await requestHandler(req)
    return resp
}

