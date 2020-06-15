"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitResult_1 = require("./handler/rabbitResult");
async function logger() {
    await rabbitResult_1.resultHandler();
}
logger();
