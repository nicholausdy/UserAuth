"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
async function main() {
    const username = 'nicholausdy';
    const password = 'nicholausdy';
    const plainText = 'JackDullBoy1999';
    const hash = '$2b$10$.dWff8fpTeyM3Uk7Us.z5OYFdXbzBth7HsQaz4tZlm5lrWShF2WB2';
    const email = 'nicdanyos@gmail.com';
    const isverified = false;
    const tempcode = 0;
    //const result1 : IResponse = await accountRedisInterface.insertAccount(username, password, email, isverified, tempcode) 
    //const result2 : IResponse = await accountRedisInterface.getAccount(username)
    //console.log(result1)
    //console.log(result2)
    const compareResult = await bcrypt.compare(plainText, hash);
    console.log(compareResult);
}
main();
