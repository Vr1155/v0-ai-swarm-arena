#!/usr/bin/env bash
set -euo pipefail

# Activate your virtualenv beforehand if needed.
# This script simply runs the FastAPI app with autoreload.
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
