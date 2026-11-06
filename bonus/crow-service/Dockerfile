# Multi-stage Dockerfile for C++ Crow Microservice
FROM alpine:3.20 AS builder

RUN apk update && apk add --no-cache \
    build-base \
    cmake \
    git \
    asio-dev

WORKDIR /app
COPY CMakeLists.txt main.cpp ./

RUN mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --config Release

# --- Stage 2: Minimal Runtime Image ---
FROM alpine:3.20

RUN apk add --no-cache libstdc++

WORKDIR /app
COPY --from=builder /app/build/crow_health_service /app/crow_health_service

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/app/crow_health_service"]
