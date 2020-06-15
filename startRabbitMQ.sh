#!/bin/bash
node runRabbitSetup.js

forever start -l processor_log.log --append -o processor_out.log --append -e processor_err.log --append rabbitProcessor.js

forever start -l logger_log.log --append -o logger_out.log --append -e logger_err.log --append rabbitLogger.js

