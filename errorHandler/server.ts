import { IResponse } from "../interface/interfaceCollection"


export async function serverError(e:any) : Promise<IResponse> {
    let error : IResponse = {Status:'',Message:''}
    error.Status = 'Failed'
    error.Code = 500
    error.Message = 'Internal server error encountered'
    error.Detail = e
    console.log(e)
    return error
}