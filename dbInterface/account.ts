import { db } from "./dbConfig"
import { databaseError } from "../errorHandler/database"
import { IResponse } from "../interface/interfaceCollection"
const perf = require('execution-time')();


export async function registerAccount(user_id : string, email : string, password : string, isverified : boolean, tempcode : number, nama_lengkap : string) : Promise<IResponse>{
    perf.start();
    let resp : IResponse = {Status:'',Message:''}
    try {
        const text1:string = 'INSERT INTO account(user_id, email, password, isverified, tempcode) VALUES ($1,$2,$3,$4,$5)'
        const values1:any = [user_id, email, password, isverified, tempcode]
        const text2 : string = 'INSERT INTO profile(user_id, nama_lengkap) VALUES ($1,$2)'
        const values2:any = [user_id, nama_lengkap]
        const insertResult1 : any = await db.query(text1,values1)
        const insertResult2 : any = await db.query(text2, values2)
        resp.Status = 'Success'
        resp.Message = 'Record insert successful'
    }   
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e 
    }
    finally {
        const result : any = perf.stop();
        console.log('Time to write to DB:',result.time)
        return resp
    }
}

export async function readAccount(user_id:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    try {
        const text:string = 'SELECT * FROM account WHERE user_id = $1'
        const values:any = [user_id]
        const query_result:any = await db.query(text,values)
        if (typeof query_result.rows[0] === 'undefined'){
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        else {
            resp.Status = 'Success'
            resp.Message = query_result.rows[0]
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}

export async function readAccountByEmail(email:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    try {
        const text:string = 'SELECT * FROM account WHERE email = $1'
        const values:any = [email]
        const query_result:any = await db.query(text,values)
        if (typeof query_result.rows[0] === 'undefined'){
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        else {
            resp.Status = 'Success'
            resp.Message = query_result.rows[0]
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}

export async function readProfile(user_id:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    try {
        const text:string = 'SELECT * FROM profile WHERE user_id = $1'
        const values:any = [user_id]
        const query_result:any = await db.query(text,values)
        if (typeof query_result.rows[0] === 'undefined'){
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        else {
            resp.Status = 'Success'
            resp.Message = query_result.rows[0]
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}
//updatePassword
export async function updatePassword(username: string, password: string) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text: string = 'UPDATE account SET password=$2 WHERE username=$1'
        const values: any = [username,password]
        const query_result: any = await db.query(text,values)
        if (query_result.rowCount != 0){
            resp.Status = 'Success'
            resp.Message = 'Password successfully updated'
        }
        else {
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }  
}
//updateVerification
export async function updateVerification(username:string, isverified: boolean) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    try {
        const text:string = 'UPDATE account SET isverified=$2 WHERE user_id=$1'
        const values:any = [username,isverified]
        const query_result:any = await db.query(text,values)
        if (query_result.rowCount != 0) {
            resp.Status = 'Success'
            resp.Message = 'Account verification status changed to '.concat(isverified.toString())
        }
        else {
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}

//updateTempCode
export async function updateTempCode(username:string, tempcode:number) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text:string = 'UPDATE account SET tempcode=$2 WHERE username=$1'
        const values:any = [username,tempcode]
        const query_result = await db.query(text,values)
        if (query_result.rowCount != 0) {
            resp.Status = 'Success'
            resp.Message = 'Tempcode successfully generated'
        }
        else {
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}

//deleteTempCode
export async function deleteTempCode(username:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text:string = 'UPDATE account SET tempcode=0 WHERE username=$1'
        const values:any = [username]
        const query_result = await db.query(text,values)
        if (query_result.rowCount != 0) {
            resp.Status = 'Success'
            resp.Message = 'Tempcode successfully deleted'
        }
        else {
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}

export async function deleteAccount(username:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text:string = 'DELETE FROM account WHERE username=$1'
        const values:any = [username]
        const query_result = await db.query(text,values)
        if (query_result.rowCount != 0) {
            resp.Status = 'Success'
            resp.Message = 'Account successfully deleted'
        }
        else {
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}
//getTempCode
export async function getTempCode(username:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text:string = 'SELECT tempcode FROM account WHERE username=$1'
        const values:any = [username]
        const query_result = await db.query(text,values)
        if (typeof query_result.rows[0] === 'undefined'){
            resp.Status = 'Failed'
            resp.Message = 'Username not found'
        }
        else {
            if ((query_result.rows[0].tempcode == null) || (query_result.rows[0].tempcode == 0)){
                resp.Status = 'Failed'
                resp.Message = 'Temp code is not available'
            }
            else {
                resp.Status = 'Success'
                resp.Message = query_result.rows[0]
            }
        }
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = await databaseError(e)
        resp.Detail = e
    }
    finally {
        return resp
    }
}
