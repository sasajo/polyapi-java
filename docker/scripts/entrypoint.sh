#!/bin/bash
yarn prisma migrate deploy

# Function to handle the SIGTERM signal
handle_sigterm() 
{
    echo "Received SIGTERM, shutting down gracefully"
    kill -TERM "$child_pid";
}



# Run the application server and store its process ID
nohup yarn run start:prod &
child_pid=$!

echo $child_pid

# Set up signal trapping
trap 'handle_sigterm' 15

# Wait for the child process to exit
wait "$child_pid"

cd science
nohup uwsgi --ini ./uwsgi.ini