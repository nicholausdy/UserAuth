# UserAuth
UserAuth System with Redis and RabbitMQ
<br> <br>
API Documentation : https://documenter.getpostman.com/view/9502025/SzzkdHdY?version=latest#e00b949a-b1b5-4341-b7d2-47fde346dda1
<br> <br>
How to use:
1. Activate WSL on Windows (if you are using Windows, otherwise skip to step 2). Tutorial on how to activate WSL: https://docs.microsoft.com/en-us/windows/wsl/install-win10
2. Install Node.js and NPM : https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
3. Install dependencies from package.json : <br>
```shell 
npm i 
```
4. Install RabbitMQ: https://www.rabbitmq.com/download.html
    1. Create new user with appropriate password
    2. Create new virtual host
    3. Adjust URL according to user, password, and virtual host on .env file
5. Install Redis: https://redis.io/download
    1. Start Redis server:
```shell 
sudo service redis-server start 
```
6. Change file permission for startRabbitMQ.sh, run-all.sh, and stop-all.sh :
```shell 
sudo chmod 744 <filename>
```
7.  Start the service (Rabbit workers + server): 
```shell 
./run-all.sh 
```
8. Stop the service when done:
```shell 
./stop-all.sh 
```
