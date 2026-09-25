# CueSpace deployment placeholder

This document records future deployment options. They are not required for the current browser demo.

## Local development

```text
Browser frontend
  -> FastAPI backend on localhost
      -> SQLite database
      -> local uploads directory
      -> ModelGateway
          -> deterministic planner or local model runtime
```

## Future cloud deployment

```text
Static frontend hosting
  -> FastAPI application service
      -> PostgreSQL for structured data
      -> S3-compatible object storage for uploaded images/exports
      -> hosted model API or GPU model service
      -> centralized logs/traces
```

Potential future topics include containerization, CI/CD, secrets management, authentication, backups, scaling, and GPU scheduling. None are part of the Stage 1 deliverable.
