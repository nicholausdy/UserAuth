import { db } from "./dbConfig"
import { databaseError } from "../errorHandler/database"
import { IResponse } from "../interface/interfaceCollection"

export async function updateProfile(user_id : string, nama_lengkap : string, idkaryawan : string, no_hp : string, email_2 : string) : Promise<IResponse> {
    let resp : IResponse = {Status:'', Message:''}
    try {
        const text: string = 'UPDATE profile SET nama_lengkap=$2, idkaryawan=$3, no_hp=$4, email_2=$5 WHERE user_id=$1'
        const values: any = [user_id, nama_lengkap, idkaryawan, no_hp, email_2]
        const query_result: any = await db.query(text,values)
        if (query_result.rowCount != 0){
            resp.Status = 'Success'
            resp.Message = 'Profile successfully updated'
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