import  {processorHandler} from "./handler/rabbitProcessor"
const perf = require('execution-time')();

async function processor() {
    await processorHandler()
}
 
processor();