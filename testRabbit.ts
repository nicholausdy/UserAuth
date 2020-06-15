
import  {requestHandler} from "./handler/rabbitRequest"
import  {resultHandler} from "./handler/rabbitResult"
import  {processorHandler} from "./handler/rabbitProcessor"

async function main() {
    const req : any = {body:{username:"nicdanyos",password:"nicdanyos",email:"nicdanyos@gmail.com"}}
    //await requestHandler(req)
    //await processorHandler()
    await resultHandler()
}
 

main();