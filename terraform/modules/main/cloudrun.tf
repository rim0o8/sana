resource "google_cloud_run_v2_service" "sana" {
  name     = "sana"
  location = var.location

  template {
    service_account = google_service_account.cloud_run_service_account.email

    containers {
      image = "${var.location}-docker.pkg.dev/${var.project_id}/${var.ar_repository_id}/sana:latest"

      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi"
        }
      }
    }

    scaling {
      max_instance_count = 1
      min_instance_count = 0
    }
  }

  ingress = "INGRESS_TRAFFIC_ALL"

  depends_on = [google_project_service.required_apis]
}
