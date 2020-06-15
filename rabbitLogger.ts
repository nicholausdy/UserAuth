import  {resultHandler} from "./handler/rabbitResult"

async function logger() {
    await resultHandler()
}

logger();