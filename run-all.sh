#!/bin/bash

#compile all
tsc

#start rabbit workers
bash startRabbitMQ.sh

#run express server 
forever start -l server_log.log --append -o server_out.log --append -e server_err.log --append server.js

