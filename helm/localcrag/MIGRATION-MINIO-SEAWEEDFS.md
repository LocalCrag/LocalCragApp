# Migrate Helm releases from MinIO to SeaweedFS

MinIO is discontinued. Chart **0.3.0** still deploys MinIO by default (same Service/PVC names as before: `{release}-s3`) and adds SeaweedFS beside it (`{release}-seaweedfs`). Copy your objects, then point the app at SeaweedFS with `s3.backend`.

Removing MinIO is a separate, opt-in step (`s3.minioEnabled: false`, step 5) so that nothing is deleted until you decide it should be. A **future chart release** will remove MinIO entirely regardless. Finish this copy-and-switch **before** you upgrade to that release.

## Prerequisites

- The existing Secret still contains `rootUser` / `rootPassword`.
- `kubectl` access to the release namespace.

Do not treat an older backup as your restore point. Backups taken by earlier chart versions no longer work, so the backup you rely on has to be taken **after** the upgrade in step 1 — see step 2.

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

## Step 2 — Take a backup, and let it succeed

Backups from earlier chart versions stopped working: they drove the backup with the MinIO client `mc`, which the MinIO image no longer ships. Chart 0.2.0 replaces `mc` with the AWS CLI, so the first backup that can actually succeed is the one you take *after* the upgrade above. Whatever the last run before the upgrade reported, do not rely on it.

Trigger one by hand instead of waiting for the nightly schedule:

```bash
kubectl -n <namespace> create job --from=cronjob/localcrag-backup localcrag-backup-premigration
kubectl -n <namespace> logs job/localcrag-backup-premigration --follow
```

Do not move on until that Job completes successfully. Two reasons:

- It is your restore point. The next step copies objects and then repoints the app, and this is the last moment where a single known-good backup covers both the database and the original MinIO bucket.
- The copy Job in step 3 is a Helm post-upgrade hook. A backup Job that keeps failing leaves the release in an unhealthy state, and the copy Job will not start until the release reconciles successfully.

## Step 3 — Copy objects

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

Keep the server scaled down until step 4 so the two stores cannot diverge.

## Step 4 — Serve from SeaweedFS

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

Leave MinIO running for now. It still holds the original copy of every object, which is what makes step 5 reversible right up until you run it.

## Step 5 — Remove MinIO and reclaim its storage (optional, destructive)

Only once SeaweedFS has been serving correctly for a while, and you have a backup you trust:

```yaml
s3:
  backend: seaweedfs
  minioEnabled: false
```

```bash
helm upgrade localcrag ./helm/localcrag \
  -f my-values.yaml \
  -f migrate-values.yaml \
  -n <namespace>
```

This uninstalls the MinIO subchart. **The PVC `{release}-s3` goes with it** — it carries no keep-policy, so Helm deletes it, and if your StorageClass reclaims with `Delete` the underlying volume and its objects are destroyed permanently. After this, SeaweedFS holds the only copy of your files and rolling back to `backend: minio` is no longer possible.

The chart refuses the combination that would be an obvious mistake: setting `minioEnabled: false` while `backend: minio` fails the upgrade rather than deleting the store you are serving from.

Two side effects to expect:

- The storage console disappears. It was the MinIO console, and SeaweedFS has no authenticated replacement, so `s3.ingress.consoleHost` is no longer required and its Ingress rule and TLS entry are dropped. Browse SeaweedFS with the `port-forward` above.
- If you deploy with Argo CD, nothing is actually deleted unless pruning is enabled. Without it the app simply reports OutOfSync with the leftover MinIO objects. Sync with `--prune`, or set `syncPolicy.automated.prune: true`.

You can skip this step entirely — a future chart release removes MinIO unconditionally.

## New installs

This chart version still installs MinIO and uses it by default (`s3.backend: minio`), same as previous charts. SeaweedFS is also deployed so you can switch when ready:

```yaml
s3:
  backend: seaweedfs
```

Empty new installs can switch without the copy Job.

## Rollback

As long as you have not run step 5:

```yaml
s3:
  backend: minio
```

Then `helm upgrade` again. MinIO data remains on its PVC. Once `minioEnabled: false` has been applied, the PVC is gone and restoring from a backup is the only way back.
