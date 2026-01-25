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
{{- fail "s3.ingress.consoleHost is required but not set. Please provide the public hostname for MinIO console." }}
{{- end }}
{{- end -}}
