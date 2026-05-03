pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_FILE_PATH = 'docker-compose.deploy.yml'
        DEPLOY_ENV_FILE = '.env.deploy'
        DEFAULT_NETWORK_NAME = 'miso-blog-network'
    }

    stages {
        stage('Build Check') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                        sh 'npm run build'
                    } else {
                        bat 'npm ci'
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Write Deploy Env') {
            steps {
                script {
                    String deployEnv = """
MISO_BLOG_FRONT_PORT=${env.MISO_BLOG_FRONT_PORT ?: '8030'}
VITE_API_BASE_URL=${env.VITE_API_BASE_URL ?: '/'}
API_UPSTREAM_HOST=${env.API_UPSTREAM_HOST ?: 'miso-blog-server'}
API_UPSTREAM_PORT=${env.API_UPSTREAM_PORT ?: '8010'}
CLIENT_MAX_BODY_SIZE=${env.CLIENT_MAX_BODY_SIZE ?: '30m'}
MISO_BLOG_NETWORK_NAME=${env.MISO_BLOG_NETWORK_NAME ?: env.DEFAULT_NETWORK_NAME}
""".trim()

                    writeFile file: env.DEPLOY_ENV_FILE, text: deployEnv
                }
            }
        }

        stage('Ensure Network') {
            steps {
                script {
                    String networkName = env.MISO_BLOG_NETWORK_NAME ?: env.DEFAULT_NETWORK_NAME

                    if (isUnix()) {
                        sh "docker network inspect ${networkName} >/dev/null 2>&1 || docker network create ${networkName}"
                    } else {
                        bat "@echo off\r\n docker network inspect ${networkName} >nul 2>&1 || docker network create ${networkName}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    String composeCommand = "docker compose --env-file ${env.DEPLOY_ENV_FILE} -f ${env.COMPOSE_FILE_PATH} up -d --build --remove-orphans"

                    if (isUnix()) {
                        sh composeCommand
                    } else {
                        bat composeCommand
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (isUnix()) {
                    sh "rm -f ${env.DEPLOY_ENV_FILE}"
                } else {
                    bat "if exist ${env.DEPLOY_ENV_FILE} del /f /q ${env.DEPLOY_ENV_FILE}"
                }
            }
        }
    }
}
