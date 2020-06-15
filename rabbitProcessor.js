"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitProcessor_1 = require("./handler/rabbitProcessor");
const perf = require('execution-time')();
async function processor() {
    await rabbitProcessor_1.processorHandler();
}
processor();
