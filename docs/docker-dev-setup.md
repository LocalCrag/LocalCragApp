# Using the Docker development setup

**Step 1**: Copy `server/src/config/template.cfg` to `server/src/config/dev.cfg` and fill the `SUPERADMIN_*` variables

**Step 2**: Build application containers: `docker compose build`

**Step 3**: Start the setup `docker compose up`. The frontend takes a bit to be ready

You find the following web UIs available:
- Frontend at http://localhost:4200: Shows you the frontend (credentials sent via email)
- MailHog at http://localhost:8025: Shows you all the emails
- Adminer at http://localhost:8080: Database web interface
- MinIO Admin UI at http://localhost:9001: Shows you all objects in the S3 storage. Credentials: `localcrag:password` 

You probably won't need to access these directly:
- Backend at http://localhost:5000
- Object Storage at http://localhost:9000

**Step 4a**: Remove the deployment: `docker compose down`

**Step 4b**: Remove the deployment, database content and stored objects: `docker compose down -v`