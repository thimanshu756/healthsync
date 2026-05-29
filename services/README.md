# HealthSync AI — Services & Application Code

This directory contains the application code, Dockerfiles, and CI pipelines for our microservices and background workers.

## Services
- `/patient-service`: CRUD service managing patient onboarding.
- `/appointment-service`: CRUD service managing scheduling and appointments.
- `/billing-service`: Event-driven billing invoice generator.
- `/notification-worker`: Queue-consuming worker generating mock email and SMS.
- `/frontend`: Minimal web client interfacing with the gateway.
- `/shared`: Shared logging, middleware, and common utilities.
