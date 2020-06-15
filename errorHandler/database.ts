export async function databaseError(e:any) : Promise<string>{
    if (e.code == '23505'){
        const message:string = 'Primary key already exists'
        return message
    }
    //else if (e.code == '23503'){
    //    const message:string = 'Kelas belum terdaftar'
    //    return message
    //}
    else if (e.code == 'ECONNREFUSED'){
        const message:string = 'Database connection error'
        return message
    }
    else {
        const message:string = 'Unknown error encountered'
        return message
    }
}