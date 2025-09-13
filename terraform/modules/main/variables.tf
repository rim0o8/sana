variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "location" {
  description = "Google Cloud Location"
  type        = string
  default     = "asia-northeast1"
}

variable "ar_repository_id" {
  description = "Artifact Registry repository ID"
  type        = string
}
