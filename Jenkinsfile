pipeline {
  agent any
  environment {
    DOCKERHUB_CREDENTIALS=credentials('dockerhub-token')
  }
  stages {
    stage('Cloning our Git') {
      steps {
        sh 'Echo "Cloning repository..."'
        sh 'git clone git@github.com:neenus/xlsx-to-csv-server.git'
      }
    }
    stage('Build') {
      steps {
        sh 'Echo "Building docker image..."'
        sh 'docker build -t neenus007/xlsx-csv:latest .'
      }
    }
    stage('Login to DockerHub') {
      steps {
        sh 'Echo "Logging in to DockerHub..."'
        sh 'docker login -u $DOCKERHUB_CREDENTIALS_USERNAME -p $DOCKERHUB_CREDENTIALS_PASSWORD'
      }
    }
    stage('Push to DockerHub') {
      steps {
        sh 'Echo "Pushing to DockerHub..."'
        sh 'docker push neenus007/xlsx-csv:latest'
      }
    }
  }
}
