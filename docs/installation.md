# Installation

For deploying a LocalCrag instance, we provide a Docker Compose setup that includes all necessary services. This setup is designed to be easy to use and requires minimal configuration.

## Clone the Repository

To get started, clone the LocalCrag repository:

```bash
git clone https://github.com/LocalCrag/LocalCragApp.git localcrag
cd localcrag
```
## Configuration

Create an environment file by copying the example file:

```bash
cp .env.example .env
```

Set the environment variables in the `.env` file according to your needs. 

You can also create a `docker-compose.override.yml` file to override specific settings without modifying the original `docker-compose.yml` file.

A full list of available environment variables can be found [here](./environment-variables.md). Setting variables that are not included in the `.env.example` file has to be done in the `docker-compose.override.yml` file.

### Automated updates

The default configuration uses [Watchtower](https://containrrr.dev/watchtower/) to automatically update the LocalCrag application daily at 4AM. 

It is recommended to set up watchtower [notifications](https://containrrr.dev/watchtower/notifications) to keep informed about updates and eventual failures during the automated update process. For this, set the `WATCHTOWER_NOTIFICATION_URL` in the `.env` file. You can also choose to only receive notifications if new versions are detected. Use the `WATCHTOWER_MONITOR_ONLY` variable for this.

To disable watchtower completely, you can e.g. simply override the `watchtower` service in your `docker-compose.override.yml` file to a noop command:

```yaml
  watchtower:
    command: [""]
```

## Start the containers

Once you have configured the environment variables, you can start the LocalCrag application using Docker Compose:

```bash 
docker compose up -d
```

On first startup, your initial admin user will be created based on the `SUPERADMIN_FIRSTNAME`, `SUPERADMIN_LASTNAME`, and `SUPERADMIN_EMAIL` variables you set in the `docker-compose.override.yml` file.
You will get an E-Mail with the initial password for this user.

## Post-Installation Steps

For production use in a server environment you should follow up with e.g. setting up nginx as a reverse proxy and securing your instance with HTTPS. You can find more information on how to do this in the [Nginx documentation](https://nginx.org/en/docs/). Below we also provide a step-by-step guide for a simple example deployment on an Ubuntu server.

### Example Deployment on Ubuntu Server

Make sure all services are running on your server:

```bash
curl localhost:4200/api/health
```

This command should return a JSON response indicating that the server and all services are healthy.

#### Install Nginx

```bash
sudo apt update
sudo apt install nginx
``` 

#### Configure Nginx

Create a new Nginx configuration file for LocalCrag:

```bash 
sudo nano /etc/nginx/sites-available/localcrag
```

Add the following configuration to the file:

```nginx
server {
    listen 80;
    server_name your-domain.com  www.your-domain.com;
    
    client_max_body_size 50M; # Adjust as needed for your application

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name s3.your-domain.com;
    
    client_max_body_size 50M; # Adjust as needed for your S3 storage

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Also make sure that there are no other Nginx configuration files that conflict with this setup.


#### Enable the Nginx Configuration

```bash
sudo ln -s /etc/nginx/sites-available/localcrag /etc/nginx/sites-enabled/
```

#### Test the Nginx Configuration

```bash
sudo nginx -t
```

If the test is successful, you will see a message indicating that the configuration is OK.  

#### Restart Nginx

```bash
sudo systemctl restart nginx
```

#### Secure Nginx with Let's Encrypt

To secure your Nginx server with HTTPS, you can use Let's Encrypt. First, install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

Then, run the following command to obtain and install a certificate:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

This command will automatically configure Nginx to use the obtained certificate.

Do the same for the s3 endpoint:

```bash
sudo certbot --nginx -d s3.your-domain.com
```

#### Verify HTTPS Configuration

After obtaining the certificate, you can verify that your Nginx server is serving LocalCrag over HTTPS by visiting `https://your-domain.com` in your web browser.

#### Backup Configuration

For production deployments, it is recommended to set up regular backups of your LocalCrag instance. You can use the LocalCrag backup tool for this purpose: https://github.com/LocalCrag/LocalCragBackup

#### Final Steps

After completing the above steps, your LocalCrag instance should be up and running, accessible via your domain name with HTTPS enabled. You can now start using LocalCrag to manage your climbing routes and share them with the community.

The login credentials for the initial admin user will be sent to the email address you configured in the `docker-compose.override.yml` file. You can log in to the LocalCrag web interface using these credentials.
