# Metrics Server

This project is a simple metrics server built with Node.js and Prometheus client. It tracks the usage of various features and app downloads.

## Prerequisites

- Docker installed on your machine

## Building the Docker Image

To build the Docker image, run the following command:

```bash
docker-compose build

docker-compose up -d


Endpoints
Metrics Endpoint
You can access the Prometheus metrics at:


GET /metrics
Feature Usage Endpoint
To record the usage of a feature, send a POST request to:


POST /use-feature
With the following JSON body:

json
{
    "feature": "feature_name"
}
App Download Endpoint
To record the download of an app, send a POST request to:


POST /download-app
With the following JSON body:

json

{
    "app": "app_name"
}
Clear Database Endpoint
To clear the database, send a POST request to:

arduino

POST /clear-database
Example
To record a feature usage:


curl -X POST -H "Content-Type: application/json" -d '{"feature": "feature_name"}' http://192.168.26.112:3001/use-feature
To record an app download:


curl -X POST -H "Content-Type: application/json" -d '{"app": "app_name"}' http://192.168.26.112:3001/download-app
To clear the database:

curl -X POST http://192.168.26.112:3001/clear-database
Testing
To test the endpoints:

Record an App Download
bash
Copy code
curl -X POST -H "Content-Type: application/json" -d '{"app": "example_app"}' http://192.168.26.112:3001/download-app
Check Prometheus Metrics
Visit the /metrics endpoint in your browser or use curl to see if app_download_count is being reported:

bash
Copy code
curl http://192.168.26.112:3001/metrics
Example /metrics Output
You should see something like this in the output:

bash
Copy code
# HELP app_download_count Count of app downloads
# TYPE app_download_count counter
app_download_count{app="example_app"} 1
# HELP feature_usage_count Count of feature usage
# TYPE feature_usage_count counter
feature_usage_count{feature="some_feature"} 2
Stopping the Container
To stop the running container:

bash
Copy code
docker stop metrics-server
Removing the Container
To remove the container:

bash
Copy code
docker rm metrics-server
Viewing Logs
To view the logs of the running container:

bash
Copy code
docker logs metrics-server
