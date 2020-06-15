#!/bin/bash

#generate private key
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key

#generate public key
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
