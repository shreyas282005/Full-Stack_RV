# BorrowBox C++ Crow Health Microservice (Bonus)

> **Role:** Optional independent microservice showcasing high-performance C++20 HTTP microservices with the Crow framework.  
> **Status:** Completely decoupled from the primary Node.js / React application.

---

## Overview

This microservice demonstrates how BorrowBox can integrate specialized native C++ high-throughput services for compute-intensive tasks, health telemetry, or IoT device gateways without impacting the primary application architecture.

- **Language:** C++20
- **Framework:** [Crow](https://github.com/CrowCpp/Crow) (v1.2.0)
- **Port:** `8080`

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Microservice metadata and tagline |
| `GET` | `/health` | Live service health check & uptime |
| `GET` | `/api/crow-health` | C++ telemetry & architecture metadata |

---

## Building and Running Independently

### Option A: Using Docker
```bash
cd bonus/crow-service
docker build -t borrowbox-crow-service .
docker run -p 8080:8080 borrowbox-crow-service
```

### Option B: Local CMake Build (Linux / macOS / WSL)
```bash
cd bonus/crow-service
mkdir build && cd build
cmake ..
cmake --build .
./crow_health_service
```

Test with curl:
```bash
curl http://localhost:8080/health
```

