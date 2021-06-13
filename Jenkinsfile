pipeline {
  agent {
    kubernetes {
      // pod definition that contains env vars, secrets, containers etc needed for building and deploying
      yamlFile 'ci-pod-template.yaml'
    }
  }
  stages {
    stage('Notify') {
      steps {
        mattermostSend color: "warning", message: "[Data-Emitter-Interfaces] Build Started - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
      }
    }
    //always run
    stage('Build') {
        steps {
            // install dependencies
            sh 'npm ci'
            // compile typescript to js and create map files
            sh 'npm run build'
            sh 'npm test'              // lint
            sh 'npm run lint'
            // check for vulnerabilities
            sh 'npm audit --production'
            sh 'npm run sonarscan'
        }
    }
    stage('Publish Prerelease') {
        when {
            branch 'development'
        }
        steps {
            sh 'npm version prerelease --preid=alpha'
            sh 'npm publish --dry-run --access public'
        }
    }
    stage('Publish') {
        when {
            branch 'master'
        }
        steps {
            sh 'npm version major'
            sh 'npm publish --dry-run --access public'
        }
    }
  }
  post {
    failure {
       mattermostSend color: "danger", message: "[Data-Emitter-Interfaces] Build Failure - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
    success{
       mattermostSend color: "good", message: "[Data-Emitter-Interfaces] Build Success - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
  }
}