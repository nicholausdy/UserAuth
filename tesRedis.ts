import * as accountRedisInterface from "./redisInterface/account"
import { IResponse } from "./interface/interfaceCollection"
import * as bcrypt from "bcrypt"

async function main(){
    const username : string = 'nicholausdy'
    const password : string = 'nicholausdy'
    const plainText : string = 'JackDullBoy1999'
    const hash : string = '$2b$10$.dWff8fpTeyM3Uk7Us.z5OYFdXbzBth7HsQaz4tZlm5lrWShF2WB2'
    const email : string = 'nicdanyos@gmail.com'
    const isverified : boolean = false
    const tempcode : number = 0
    //const result1 : IResponse = await accountRedisInterface.insertAccount(username, password, email, isverified, tempcode) 
    //const result2 : IResponse = await accountRedisInterface.getAccount(username)
    //console.log(result1)
    //console.log(result2)
    const compareResult = await bcrypt.compare(plainText,hash)
    console.log(compareResult)
}

main()