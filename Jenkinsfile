pipeline {
  agent {
    node {
      label 'node'
    }

  }
  stages {
    stage('Cloning our Git') {
      agent any
      steps {
        sh 'Echo "Cloning repository..."'
        sh 'git clone git@github.com:neenus/xlsx-to-csv-server.git'
      }
    }

  }
}

# this is a comment
