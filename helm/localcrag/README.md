# LocalCrag Helm chart

## Installation

### 1. Create your values file

The default `values.yaml` contains environment-agnostic defaults with **empty strings for required values**. You must create your own values file to override these.

Create a file (e.g., `my-values.yaml`) with at minimum the following required configuration:

```yaml
# REQUIRED: SMTP configuration for sending emails
smtp:
  host: "smtp.gmail.com"       # Your SMTP server hostname
  port: "587"                  # SMTP port (587 for STARTTLS, 465 for SSL)
  type: "starttls"             # Connection type: "starttls", "ssl", or "plain"

# REQUIRED: Email address used as sender for system emails
systemEmail: "noreply@example.com"

# REQUIRED: Public URL of your frontend application (with trailing slash)
server:
  frontendHost: "https://localcrag.example.com/"

# REQUIRED: S3 / MinIO configuration
s3:
  # Public URL for accessing S3 objects
  accessEndpoint: "https://s3.example.com"
  
  # Public hostnames for the S3 endpoints exposed via Ingress
  ingress:
    s3Host: "s3.example.com"           # Public hostname for S3 API
    consoleHost: "minio.example.com"   # Public hostname for MinIO console

# REQUIRED: Ingress configuration
client:
  ingress:
    host: "localcrag.example.com"        # Public hostname for your application
    clusterIssuer: "letsencrypt-prod"    # cert-manager ClusterIssuer name
```

**Note:** These are the minimal required values. You can override any other value from `values.yaml` in your custom file.

### 2. Create the Secret (required)

This chart **does not create Secrets**. You must create a Kubernetes Secret and reference it via `existingSecret.name` in your values file.

The Secret must include the following keys:

- `POSTGRES_PASSWORD`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SUPERADMIN_FIRSTNAME`
- `SUPERADMIN_LASTNAME`
- `SUPERADMIN_EMAIL`
- `rootUser` (S3/MinIO credentials)
- `rootPassword` (S3/MinIO credentials)

Create a file (e.g., `localcrag-secrets.yaml`):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: localcrag-secrets
type: Opaque
stringData:
  # Postgres
  POSTGRES_PASSWORD: "changeme"

  # LocalCrag server
  SECRET_KEY: "changeme"
  JWT_SECRET_KEY: "changeme"

  # S3 / MinIO credentials (single source of truth)
  rootUser: "localcrag"
  rootPassword: "changeme"

  # SMTP auth
  SMTP_USER: "noreply@example.com"
  SMTP_PASSWORD: "changeme"

  # First user created by the server
  SUPERADMIN_FIRSTNAME: "Admin"
  SUPERADMIN_LASTNAME: "User"
  SUPERADMIN_EMAIL: "admin@example.com"
```

Apply the secret:

```bash
kubectl apply -f localcrag-secrets.yaml -n <my-namespace>
```

**Note:** The chart maps MinIO's `rootUser`/`rootPassword` to LocalCrag's expected `S3_USER`/`S3_PASSWORD` environment variables.

### 3. Install the chart

```bash
helm install localcrag ./helm/localcrag \
  -f my-values.yaml \
  -n <my-namespace>
```

Or upgrade an existing installation:

```bash
helm upgrade localcrag ./helm/localcrag \
  -f my-values.yaml \
  -n <my-namespace>
```

## Backups (optional)

This chart can create a **CronJob** that backs up both:

- Postgres (logical dump via `pg_dump`)
- MinIO objects (bucket mirror via `mc mirror`)

The backup job bundles both database and files into a single snapshot per run.

### Enable backups

To enable backups, set `backups.enabled=true` in your values file:

```yaml
backups:
  enabled: true
```

### Provide S3(-compatible) credentials

The backup CronJob reads destination credentials from the **same Secret as the app** (`existingSecret.name`).

Required keys in that Secret when backups are enabled:

- `BACKUP_S3_BUCKET` (required)
- `BACKUP_S3_ACCESS_KEY` (required)
- `BACKUP_S3_SECRET_KEY` (required)

Optional keys:

- `BACKUP_S3_ENDPOINT` (for S3-compatible providers; defaults to AWS S3 if omitted)
- `BACKUP_S3_REGION` (AWS region)
- `BACKUP_S3_PREFIX` (path prefix within the bucket)

You can change those key names via `backups.target.secretKeys.*`.

Example (add these keys to your existing `localcrag-secrets` Secret):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: localcrag-secrets
  namespace: localcrag
type: Opaque
stringData:
  # ...existing keys...

  BACKUP_S3_ENDPOINT: "https://<your-s3-endpoint>"   # optional for AWS
  BACKUP_S3_BUCKET: "localcrag-backups"
  BACKUP_S3_REGION: "us-east-1"
  BACKUP_S3_PREFIX: "localcrag"
  BACKUP_S3_ACCESS_KEY: "..."
  BACKUP_S3_SECRET_KEY: "..."
```

### Schedule

The backup CronJob runs on a single schedule (default: `0 2 * * *` - daily at 2 AM UTC):

```yaml
backups:
  schedule: "0 2 * * *"
```

Each run creates a timestamped snapshot containing both the Postgres dump and MinIO files.

### Where backups land

All backups for a single run are stored together in a timestamped snapshot directory:

- `s3://<bucket>/<prefix>/<timestamp>/`

Retention is applied at the snapshot level.

## Monitoring backups with Prometheus (recommended)

When backups are enabled, it's **highly recommended** to deploy alerting rules to monitor backup job failures.

### Deploy backup monitoring alerts

If you're using the Prometheus Operator (kube-prometheus-stack), create the following `PrometheusRule` resource:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: localcrag-backup-alerts
  namespace: monitoring
  labels:
    release: monitoring
spec:
  groups:
    - name: localcrag.backup
      interval: 60s
      rules:
        - alert: CronJobStatusFailed
          expr: |
            (
              max by(cronjob, namespace) (
                label_replace(
                  kube_job_created{job_name=~".*backup.*"}
                    * on(job_name, namespace) group_left()
                    (kube_job_status_failed{job_name=~".*backup.*"} > 0),
                  "cronjob", "$1", "job_name", "^(.+)-[0-9]+$"
                )
              )
              >
              max by(cronjob, namespace) (
                label_replace(
                  kube_job_created{job_name=~".*backup.*"}
                    * on(job_name, namespace) group_left()
                    (kube_job_status_succeeded{job_name=~".*backup.*"} > 0),
                  "cronjob", "$1", "job_name", "^(.+)-[0-9]+$"
                )
              )
            )
            or
            (
              max by(cronjob, namespace) (
                label_replace(
                  kube_job_created{job_name=~".*backup.*"}
                    * on(job_name, namespace) group_left()
                    (kube_job_status_failed{job_name=~".*backup.*"} > 0),
                  "cronjob", "$1", "job_name", "^(.+)-[0-9]+$"
                )
              )
              unless
              max by(cronjob, namespace) (
                label_replace(
                  kube_job_created{job_name=~".*backup.*"}
                    * on(job_name, namespace) group_left()
                    (kube_job_status_succeeded{job_name=~".*backup.*"} > 0),
                  "cronjob", "$1", "job_name", "^(.+)-[0-9]+$"
                )
              )
            )
          labels:
            component: backup
          for: 1m
          annotations:
            description: 'Backup CronJob {{ $labels.job_name }} in namespace {{ $labels.namespace }} has failed.'
```

**Note**: Adjust the `namespace` and `labels.release` to match your Prometheus Operator installation. The alert triggers when any backup job (matching the pattern `.*-backup-.*`) fails and remains in a failed state for more than 1 minute. Make sure to also configure your alertmanager to notify you of such critical alerts.

