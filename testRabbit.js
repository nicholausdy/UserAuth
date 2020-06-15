"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitResult_1 = require("./handler/rabbitResult");
async function main() {
    const req = { body: { username: "nicdanyos", password: "nicdanyos", email: "nicdanyos@gmail.com" } };
    //await requestHandler(req)
    //await processorHandler()
    await rabbitResult_1.resultHandler();
}
main();
