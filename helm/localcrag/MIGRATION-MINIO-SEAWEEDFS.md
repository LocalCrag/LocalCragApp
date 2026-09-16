# Migrate Helm releases from MinIO to SeaweedFS

MinIO is discontinued. Chart **0.2.0** still **always deploys MinIO** (same Service/PVC names as before: `{release}-s3`) and adds SeaweedFS beside it (`{release}-seaweedfs`). Copy your objects, then point the app at SeaweedFS with `s3.backend`.

A **future chart release** will remove MinIO from LocalCrag entirely (including its PVC). Finish this copy-and-switch **before** you upgrade to that release.

## Prerequisites

- Recommended: A current backup (chart CronJob or equivalent).
- The existing Secret still contains `rootUser` / `rootPassword`.
- `kubectl` access to the release namespace.

## Step 1 — Upgrade: keep serving from MinIO, add SeaweedFS

Defaults already keep MinIO as the active backend. Upgrade with your existing values file:

```bash
helm upgrade localcrag ./helm/localcrag \
  -f my-values.yaml \
  -n <namespace>
```

After this upgrade:

- The app still uses MinIO at `{release}-s3:9000`.
- SeaweedFS is running at `{release}-seaweedfs:8333` (empty bucket).
- The MinIO PVC is unchanged.

## Step 2 — Copy objects

Scale the LocalCrag server to zero so no uploads can land in MinIO during the copy:

```bash
kubectl -n <namespace> scale deployment/localcrag-server --replicas=0
```

Then enable the copy Job:

```yaml
s3:
  backend: minio
  migration:
    enabled: true
```

```bash
helm upgrade localcrag ./helm/localcrag \
  -f my-values.yaml \
  -f migrate-values.yaml \
  -n <namespace>
```

`helm upgrade` writes `replicas: 1` back onto the server Deployment. Scale to zero again as soon as that apply happens (a second terminal is fine) so the copy Job does not race with new uploads:

```bash
kubectl -n <namespace> scale deployment/localcrag-server --replicas=0
```

Watch the hook Job:

```bash
kubectl -n <namespace> logs job/localcrag-s3-migrate --follow
```

Wait until it completes successfully. The Job uses the AWS CLI (`aws s3 sync`) to copy the MinIO bucket (`appS3.bucket`, default `localcrag`) to SeaweedFS using the same `rootUser` / `rootPassword`.

Keep the server scaled down until step 3 so the two stores cannot diverge.

## Step 3 — Serve from SeaweedFS

After the copy looks complete (Job logs; spot-check an object in SeaweedFS if you want):

```yaml
s3:
  backend: seaweedfs
  migration:
    enabled: false
```

```bash
helm upgrade localcrag ./helm/localcrag \
  -f my-values.yaml \
  -f migrate-values.yaml \
  -n <namespace>
```

This flips `S3_ENDPOINT`, backups, and the S3 Ingress to SeaweedFS (`:8333`) and restores the server to one replica from the chart. MinIO stays installed so you can roll back with `s3.backend: minio`.

If the server is still at zero replicas after the upgrade:

```bash
kubectl -n <namespace> scale deployment/localcrag-server --replicas=1
```

The storage console Ingress keeps pointing at the MinIO console, which requires a login. SeaweedFS's filer UI is never exposed through the Ingress: it has no authentication at all, so anyone knowing the URL could upload and delete objects. To browse SeaweedFS, forward the port to your machine for as long as you need it:

```bash
kubectl -n <namespace> port-forward deployment/localcrag-seaweedfs 8888:8888
```

Leave MinIO running until a future chart version drops it.

## New installs

This chart version still installs MinIO and uses it by default (`s3.backend: minio`), same as previous charts. SeaweedFS is also deployed so you can switch when ready:

```yaml
s3:
  backend: seaweedfs
```

Empty new installs can switch without the copy Job.

## Rollback

While this chart version is installed:

```yaml
s3:
  backend: minio
```

Then `helm upgrade` again. MinIO data remains on its PVC.
