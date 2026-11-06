/**
 * BorrowBox C++ Crow Health Microservice (Bonus Component)
 * 
 * An ultra-fast, independent microservice demonstrating high-performance C++20
 * microservices using the Crow web framework.
 */

#include "crow.h"
#include <chrono>
#include <ctime>
#include <string>

int main() {
    crow::SimpleApp app;

    const auto startTime = std::chrono::system_clock::now();

    // 1. Root Gateway
    CROW_ROUTE(app, "/")([]() {
        crow::json::wvalue res;
        res["service"] = "BorrowBox C++ Crow Microservice";
        res["status"] = "operational";
        res["engine"] = "Crow (C++20)";
        res["tagline"] = "Borrow More. Own Less.";
        return res;
    });

    // 2. Health Check Endpoint
    CROW_ROUTE(app, "/health")([&startTime]() {
        const auto now = std::chrono::system_clock::now();
        const auto uptimeSeconds = std::chrono::duration_cast<std::chrono::seconds>(now - startTime).count();

        crow::json::wvalue res;
        res["status"] = "healthy";
        res["framework"] = "Crow C++";
        res["uptime_seconds"] = uptimeSeconds;
        res["timestamp"] = std::time(nullptr);
        return res;
    });

    // 3. System Telemetry
    CROW_ROUTE(app, "/api/crow-health")([&startTime]() {
        crow::json::wvalue res;
        res["success"] = true;
        res["service"] = "borrowbox-cpp-sidecar";
        res["language"] = "C++20";
        res["features"] = crow::json::wvalue::list({
            "zero-allocation-routing",
            "modern-cpp20-coroutine-readiness",
            "independent-microservice"
        });
        return res;
    });

    // Run on port 8080 (independent of main Express port 5000 and client port 3000)
    const int port = 8080;
    std::cout << "[Crow C++] Starting independent microservice on port " << port << "..." << std::endl;
    app.port(port).multithreaded().run();

    return 0;
}
