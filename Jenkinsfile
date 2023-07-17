pipeline {
  agent any
  environment {
    DOCKERHUB_CREDENTIALS=credentials('dockerhub-token')
    MONGODB_URL=credentials('MONGODB_URL')
  }
  stages {
    stage('Cloning our Git') {
      steps {
        sh 'echo "Cloning repository..."'
        sshagent (credentials: ['jenkins-ssh']) {
          sh 'git clone git@github.com:neenus/xlsx-to-csv-server.git'
        }
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
        sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
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
