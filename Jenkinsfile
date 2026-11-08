pipeline {
    agent any

    options {
        // Stop pipeline if any stage exceeds 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Retain last 10 builds to conserve server disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Enable colored console output
        ansiColor('xterm')
    }

    environment {
        // =========================================================================
        // PREDEFINED LOCAL DEPLOYMENT PATH CONFIGURATION
        // =========================================================================
        // Configurable target deployment directory on the machine running Jenkins.
        // In Jenkins, configure this via:
        //   1. Job Configuration -> "This project is parameterized" -> String Parameter PREDEFINED_DEPLOY_PATH
        //   2. Or System Environment Variable PREDEFINED_DEPLOY_PATH on the Jenkins agent
        // The fallback path (/opt/borrowbox on Linux or WORKSPACE/deploy on Windows)
        // is a local placeholder for testing and NOT an official company path.
        DEPLOY_DIR = "${env.PREDEFINED_DEPLOY_PATH ?: (isUnix() ? '/opt/borrowbox' : "${WORKSPACE}/deploy")}"
        COMPOSE_PROJECT_NAME = 'borrowbox'
        DOCKER_COMPOSE_CMD = 'docker compose'
    }

    stages {
        // ----------------------------------------------------
        // STAGE 1: CHECKOUT
        // ----------------------------------------------------
        stage('Checkout') {
            steps {
                echo "=========================================================="
                echo "📥 [Stage 1: Checkout] Pulling source code from repository"
                echo "=========================================================="
                // Retrieve source code using Jenkins SCM checkout configuration
                checkout scm

                script {
                    def gitCommit = isUnix() ? sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim() : bat(returnStdout: true, script: '@git rev-parse --short HEAD').trim()
                    echo "Successfully checked out commit: ${gitCommit}"
                }
            }
        }

        // ----------------------------------------------------
        // STAGE 2: BUILD
        // ----------------------------------------------------
        stage('Build') {
            steps {
                echo "=========================================================="
                echo "🔨 [Stage 2: Build] Building application & container images"
                echo "=========================================================="
                script {
                    if (isUnix()) {
                        sh '''
                            echo "Verifying Docker CLI availability..."
                            docker --version
                            ${DOCKER_COMPOSE_CMD} version

                            echo "Building Docker Compose service images..."
                            ${DOCKER_COMPOSE_CMD} build
                        '''
                    } else {
                        bat '''
                            @echo Verifying Docker CLI availability...
                            docker --version
                            %DOCKER_COMPOSE_CMD% version

                            @echo Building Docker Compose service images...
                            %DOCKER_COMPOSE_CMD% build
                        '''
                    }
                }
            }
        }

        // ----------------------------------------------------
        // STAGE 3: DEPLOY
        // ----------------------------------------------------
        stage('Deploy') {
            steps {
                echo "=========================================================="
                echo "🚀 [Stage 3: Deploy] Deploying locally to predefined path"
                echo "Target Path: ${env.DEPLOY_DIR}"
                echo "=========================================================="
                script {
                    if (isUnix()) {
                        sh '''
                            set -e
                            # 1. Create target deployment directory if it does not exist
                            mkdir -p "${DEPLOY_DIR}"

                            # 2. Safe file transfer: preserve Dockerfiles, compose, source, configs,
                            #    Prisma migrations & seed, while strictly excluding secrets (.env),
                            #    node_modules, .git, and local build artifacts.
                            echo "Copying deployment files safely to ${DEPLOY_DIR}..."
                            tar --exclude='node_modules' \
                                --exclude='.env' \
                                --exclude='.env.*' \
                                --exclude='.git' \
                                --exclude='dist' \
                                --exclude='build' \
                                -cf - docker-compose.yml server client bonus | (cd "${DEPLOY_DIR}" && tar -xf -)

                            cd "${DEPLOY_DIR}"

                            # 3. Gracefully stop existing containers without deleting PostgreSQL volume
                            echo "Stopping previous containers (preserving database volume)..."
                            ${DOCKER_COMPOSE_CMD} down --remove-orphans || true

                            # 4. Launch containers using images already built in Stage 2 (no unnecessary rebuild)
                            echo "Starting services with pre-built images..."
                            ${DOCKER_COMPOSE_CMD} up -d

                            # 5. Rigorous Health Verification Loop (120s timeout)
                            # Checks actual container health using docker inspect
                            echo "Waiting for services to become healthy (Timeout: 120s)..."
                            SERVICES="borrowbox-postgres borrowbox-redis borrowbox-server borrowbox-client"
                            TIMEOUT=120
                            ELAPSED=0
                            INTERVAL=5
                            ALL_HEALTHY=false

                            while [ $ELAPSED -lt $TIMEOUT ]; do
                                ALL_HEALTHY=true
                                for svc in $SERVICES; do
                                    STATUS=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$svc" 2>/dev/null || echo "not_found")
                                    if [ "$STATUS" != "healthy" ]; then
                                        ALL_HEALTHY=false
                                        echo "Waiting for $svc... Current status: $STATUS (${ELAPSED}s elapsed)"
                                        break
                                    fi
                                done

                                if [ "$ALL_HEALTHY" = "true" ]; then
                                    echo "=========================================================="
                                    echo "✅ All required services are healthy and operational!"
                                    echo "=========================================================="
                                    ${DOCKER_COMPOSE_CMD} ps
                                    break
                                fi

                                sleep $INTERVAL
                                ELAPSED=$((ELAPSED + INTERVAL))
                            done

                            if [ "$ALL_HEALTHY" != "true" ]; then
                                echo "❌ [DEPLOYMENT ERROR] Health verification timed out after ${TIMEOUT}s."
                                echo "Container status overview:"
                                ${DOCKER_COMPOSE_CMD} ps -a
                                echo "--- Server Diagnostics Logs ---"
                                docker logs --tail 50 borrowbox-server 2>&1 || true
                                echo "--- Client Diagnostics Logs ---"
                                docker logs --tail 50 borrowbox-client 2>&1 || true
                                echo "--- Postgres Diagnostics Logs ---"
                                docker logs --tail 50 borrowbox-postgres 2>&1 || true
                                echo "--- Redis Diagnostics Logs ---"
                                docker logs --tail 50 borrowbox-redis 2>&1 || true
                                exit 1
                            fi
                        '''
                    } else {
                        bat '''
                            @echo off
                            setlocal enabledelayedexpansion

                            echo Creating deployment directory: %DEPLOY_DIR%
                            if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
                            if !ERRORLEVEL! NEQ 0 (
                                echo [ERROR] Failed to create deployment directory: %DEPLOY_DIR%
                                exit /b 1
                            )

                            echo Copying docker-compose.yml...
                            copy /Y docker-compose.yml "%DEPLOY_DIR%\\docker-compose.yml" >nul
                            if !ERRORLEVEL! NEQ 0 (
                                echo [ERROR] Failed to copy docker-compose.yml
                                exit /b 1
                            )

                            echo Copying server files (excluding node_modules, .env, .git)...
                            robocopy server "%DEPLOY_DIR%\\server" /E /XD node_modules .git dist /XF .env .env.* /NFL /NDL /NJH /NJS /nc /ns /np
                            if !ERRORLEVEL! GEQ 8 (
                                echo [ERROR] Robocopy failed for server directory with code !ERRORLEVEL!
                                exit /b 1
                            )

                            echo Copying client files (excluding node_modules, .env, dist, .git)...
                            robocopy client "%DEPLOY_DIR%\\client" /E /XD node_modules .git dist /XF .env .env.* /NFL /NDL /NJH /NJS /nc /ns /np
                            if !ERRORLEVEL! GEQ 8 (
                                echo [ERROR] Robocopy failed for client directory with code !ERRORLEVEL!
                                exit /b 1
                            )

                            echo Copying bonus files (excluding build, .env, .git)...
                            robocopy bonus "%DEPLOY_DIR%\\bonus" /E /XD build .git /XF .env .env.* /NFL /NDL /NJH /NJS /nc /ns /np
                            if !ERRORLEVEL! GEQ 8 (
                                echo [ERROR] Robocopy failed for bonus directory with code !ERRORLEVEL!
                                exit /b 1
                            )

                            cd /d "%DEPLOY_DIR%"

                            echo Stopping previous containers (preserving database volume)...
                            %DOCKER_COMPOSE_CMD% down --remove-orphans

                            echo Starting services with pre-built images (no rebuild)...
                            %DOCKER_COMPOSE_CMD% up -d
                            if !ERRORLEVEL! NEQ 0 (
                                echo [ERROR] Docker compose up failed with code !ERRORLEVEL!
                                exit /b 1
                            )

                            echo Verifying container health status (Timeout: 120s)...
                            powershell -NoProfile -ExecutionPolicy Bypass -Command "$services = @('borrowbox-postgres', 'borrowbox-redis', 'borrowbox-server', 'borrowbox-client'); $timeout = 120; $elapsed = 0; $interval = 5; $allHealthy = $false; while ($elapsed -lt $timeout) { $pending = @(); foreach ($svc in $services) { $st = (docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $svc 2>$null); if ($st -ne 'healthy') { $pending += \"$svc ($st)\" } }; if ($pending.Count -eq 0) { $allHealthy = $true; Write-Host '=========================================================='; Write-Host 'All required services are healthy and operational!'; Write-Host '=========================================================='; docker compose ps; break }; Write-Host \"Waiting for: $($pending -join ', ') (${elapsed}s elapsed)...\"; Start-Sleep -Seconds $interval; $elapsed += $interval }; if (-not $allHealthy) { Write-Error 'DEPLOYMENT HEALTH CHECK FAILED: Containers did not become healthy within 120s'; docker compose ps -a; Write-Host '--- Server Logs ---'; docker logs --tail 50 borrowbox-server; Write-Host '--- Client Logs ---'; docker logs --tail 50 borrowbox-client; exit 1 }"
                            if !ERRORLEVEL! NEQ 0 (
                                echo [ERROR] Health verification failed.
                                exit /b 1
                            )
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo "=========================================================="
            echo "🏁 Jenkins Pipeline Execution Finished for BorrowBox"
            echo "=========================================================="
        }
        success {
            echo "✅ [SUCCESS] Application built and deployed to: ${env.DEPLOY_DIR}"
            echo "🌐 Accessible at: http://localhost:3000 (Frontend) | http://localhost:5000 (Backend)"
        }
        failure {
            echo "❌ [FAILURE] Pipeline failed. Check console log above for error details."
        }
    }
}
