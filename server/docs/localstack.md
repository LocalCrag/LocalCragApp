# Configuring localstack

LocalCrag is built to use s3 like object storage instead of filesystem for storing data like images. Currently we host 
our instances on the digitalocean app platform and use the spaces object storage in production. 

For local development a local replacement is needed if you don't want to interact with the cloud. We opted for 
localstack. Here are our notes on how to install and run it:

1. Install aws cli first
2. `pip3 install localstack`
3. `localstack start -d` Start localstack in Docker
4. `localstack status services` See what services are running
5. `aws configure --profile default`
   - Access and secret key: test
   - region: eu-central-1
   - Remaining values: default or blank
6. `aws configure list` Check the configuration
7. `aws s3 mb s3://lc-test-bucket --endpoint-url http://0.0.0.0:4566`
8. `localstack status services` should now show s3 as running
9. Fill the flask config vars with the values you just configured and you are ready to go.

**Notes:**

- `localhost` as endpoint wasn't working for me so I had to use `0.0.0.0`
- The endpoint for downloading files from localstack differs from digitalocean. On DO it's the same as for the upload. 
- On localstack I had to use `http://s3.localhost:4566` as `SPACES_ACCESS_ENDPOINT`. Leave this variable `None` if you 
find a way to match the two endpoints.
- s3 files are lost when shutting down the localstack Docker container. For local development this doesn't matter, but keep it in mind.