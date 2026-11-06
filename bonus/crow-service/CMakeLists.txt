cmake_minimum_required(VERSION 3.16)
project(BorrowBoxCrowService CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# Fetch Crow C++ Web Framework
FetchContent_Declare(
    Crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG v1.2.0
)
FetchContent_MakeAvailable(Crow)

add_executable(crow_health_service main.cpp)
target_link_libraries(crow_health_service PRIVATE Crow::Crow)

