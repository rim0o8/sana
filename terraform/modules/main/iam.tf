resource "google_service_account" "cloud_run_service_account" {
  account_id   = "sana-cr-invoker"
  display_name = "Sana Cloud Run Service Account"
  description  = "Service account for Sana Cloud Run service"
}

resource "google_project_iam_member" "roles" {
  for_each = toset([
    "roles/iam.serviceAccountTokenCreator",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/aiplatform.user",
  ])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_cloud_run_v2_service_iam_member" "invoker" {
  location = var.location
  name     = google_cloud_run_v2_service.sana.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}
