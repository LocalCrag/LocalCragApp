{{/*
Common template helpers for this chart.
*/}}

{{- define "localcrag.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "localcrag.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "localcrag.labels" -}}
app.kubernetes.io/name: {{ include "localcrag.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "localcrag.selectorLabels" -}}
app.kubernetes.io/name: {{ include "localcrag.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Helper templates for dependency service names.
*/}}
{{- define "localcrag.postgres.fullname" -}}
{{- printf "%s-postgres" .Release.Name -}}
{{- end -}}

{{- define "localcrag.s3.validate" -}}
{{- $backend := default "minio" .Values.s3.backend -}}
{{- if not (or (eq $backend "seaweedfs") (eq $backend "minio")) -}}
{{- fail "s3.backend must be \"seaweedfs\" or \"minio\"." -}}
{{- end -}}
{{- end -}}

{{- define "localcrag.s3.backend" -}}
{{- include "localcrag.s3.validate" . -}}
{{- default "minio" .Values.s3.backend -}}
{{- end -}}

{{- define "localcrag.s3.fullname" -}}
{{- if eq (include "localcrag.s3.backend" .) "minio" -}}
{{- printf "%s-s3" .Release.Name -}}
{{- else -}}
{{- printf "%s-seaweedfs" .Release.Name -}}
{{- end -}}
{{- end -}}

{{- define "localcrag.s3.port" -}}
{{- if eq (include "localcrag.s3.backend" .) "minio" -}}
9000
{{- else -}}
8333
{{- end -}}
{{- end -}}

{{/*
Storage console. Always the MinIO console, which requires a login, regardless of
the active backend. The SeaweedFS filer UI is deliberately never routed here: it
has no authentication whatsoever, so anyone who reached the URL could upload and
delete objects. Browse SeaweedFS with `kubectl port-forward` instead.
*/}}
{{- define "localcrag.s3.console.fullname" -}}
{{- printf "%s-s3-console" .Release.Name -}}
{{- end -}}

{{- define "localcrag.s3.console.port" -}}
9001
{{- end -}}

{{- define "localcrag.minio.fullname" -}}
{{- printf "%s-s3" .Release.Name -}}
{{- end -}}

{{- define "localcrag.seaweedfs.fullname" -}}
{{- printf "%s-seaweedfs" .Release.Name -}}
{{- end -}}

{{- define "localcrag.secrets.name" -}}
{{- required "existingSecret.name is required" .Values.existingSecret.name -}}
{{- end -}}

{{/*
Helper to get/set postgres auth existingSecret (for subchart).
Returns the secret name that should be used by the postgres subchart.
*/}}
{{- define "localcrag.postgres.secretName" -}}
{{- .Values.postgres.auth.existingSecret | default (include "localcrag.secrets.name" .) -}}
{{- end -}}

{{/*
Helper to get/set s3 existingSecret (for the MinIO subchart when enabled).
Returns the secret name that should be used by the s3/MinIO subchart.
*/}}
{{- define "localcrag.s3.secretName" -}}
{{- .Values.s3.existingSecret | default (include "localcrag.secrets.name" .) -}}
{{- end -}}

{{/*
Validate required configuration values.
This template is included in the main deployments to ensure all mandatory values are set.
*/}}
{{- define "localcrag.validateRequiredValues" -}}
{{- if not .Values.smtp.host }}
{{- fail "smtp.host is required but not set. Please provide an SMTP server hostname." }}
{{- end }}
{{- if not .Values.smtp.port }}
{{- fail "smtp.port is required but not set. Please provide an SMTP server port." }}
{{- end }}
{{- if not .Values.smtp.type }}
{{- fail "smtp.type is required but not set. Please provide an SMTP connection type (starttls, ssl, or plain)." }}
{{- end }}
{{- if not .Values.systemEmail }}
{{- fail "systemEmail is required but not set. Please provide a system email address." }}
{{- end }}
{{- if not .Values.server.frontendHost }}
{{- fail "server.frontendHost is required but not set. Please provide the public URL of your frontend." }}
{{- end }}
{{- if not .Values.client.ingress.host }}
{{- fail "client.ingress.host is required but not set. Please provide the public hostname for the application." }}
{{- end }}
{{- if not .Values.client.ingress.clusterIssuer }}
{{- fail "client.ingress.clusterIssuer is required but not set. Please provide a cert-manager ClusterIssuer name." }}
{{- end }}
{{- if not .Values.s3.ingress.s3Host }}
{{- fail "s3.ingress.s3Host is required but not set. Please provide the public hostname for S3 API access." }}
{{- end }}
{{- if not .Values.s3.ingress.consoleHost }}
{{- fail "s3.ingress.consoleHost is required but not set. Please provide the public hostname for the object-storage console." }}
{{- end }}
{{- include "localcrag.s3.validate" . }}
{{- end -}}
