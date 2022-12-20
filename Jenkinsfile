pipeline {
  agent any
  environment {
    DOCKERHUB_CREDENTIALS=credentials('dockerhub-token')
  }
  stages {
    stage('Cloning our Git') {
      steps {
        sshagent (credentials: ['jenkins-ssh'])
        sh 'echo "Cloning repository..."'
        sh 'git clone git@github.com:neenus/xlsx-to-csv-server.git'
      }
    }
    stage('Build') {
      steps {
        sh 'echo "Building docker image..."'
        sh 'docker build -t neenus007/xlsx-csv:latest .'
      }
    }
    stage('Login to DockerHub') {
      steps {
        sh 'echo "Logging in to DockerHub..."'
        sh 'docker login -u $DOCKERHUB_CREDENTIALS_USERNAME -p $DOCKERHUB_CREDENTIALS_PASSWORD'
      }
    }
    stage('Push to DockerHub') {
      steps {
        sh 'echo "Pushing to DockerHub..."'
        sh 'docker push neenus007/xlsx-csv:latest'
      }
    }
  }
}
