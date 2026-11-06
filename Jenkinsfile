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
        // Can be overridden via Jenkins Job parameters or system environment variables.
        // Default fallback: /opt/borrowbox (Linux/macOS) or ./deploy (Local/Windows)
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
                        sh """
                            echo "Verifying Docker CLI availability..."
                            docker --version
                            ${DOCKER_COMPOSE_CMD} version

                            echo "Building Docker Compose service images..."
                            ${DOCKER_COMPOSE_CMD} build
                        """
                    } else {
                        bat """
                            @echo Verifying Docker CLI availability...
                            docker --version
                            %DOCKER_COMPOSE_CMD% version

                            @echo Building Docker Compose service images...
                            %DOCKER_COMPOSE_CMD% build
                        """
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
                        sh """
                            # 1. Create target deployment directory if it does not exist
                            mkdir -p "${DEPLOY_DIR}"

                            # 2. Copy deployment configuration and application directories
                            # Preserving existing data, database volumes, and runtime state
                            cp -R docker-compose.yml server client bonus "${DEPLOY_DIR}/" || rsync -av --exclude='.git' --exclude='node_modules' ./ "${DEPLOY_DIR}/"

                            # 3. Enter target directory
                            cd "${DEPLOY_DIR}"

                            # 4. Gracefully restart services (preserves named volume borrowbox_postgres_data)
                            ${DOCKER_COMPOSE_CMD} down --remove-orphans || true
                            ${DOCKER_COMPOSE_CMD} up -d --build

                            # 5. Display container status and verify health
                            sleep 10
                            ${DOCKER_COMPOSE_CMD} ps
                        """
                    } else {
                        bat """
                            @echo Creating deployment directory...
                            if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"

                            @echo Copying deployment files to predefined directory...
                            xcopy /E /I /Y /Q server "%DEPLOY_DIR%\\server"
                            xcopy /E /I /Y /Q client "%DEPLOY_DIR%\\client"
                            xcopy /E /I /Y /Q bonus "%DEPLOY_DIR%\\bonus"
                            copy /Y docker-compose.yml "%DEPLOY_DIR%\\docker-compose.yml"

                            cd /d "%DEPLOY_DIR%"

                            @echo Starting application containers in background...
                            %DOCKER_COMPOSE_CMD% down --remove-orphans || rem
                            %DOCKER_COMPOSE_CMD% up -d --build

                            @echo Verifying container status...
                            %DOCKER_COMPOSE_CMD% ps
                        """
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
