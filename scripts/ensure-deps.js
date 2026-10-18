const { existsSync, mkdirSync } = require('fs')
const { execSync } = require('child_process')

if (!existsSync('node_modules/.package-lock.json')) {
  console.log('First run: installing dependencies, tunggu sebentar...')
  mkdirSync('/home/container/tmp', { recursive: true })
  execSync('npm install', {
    stdio: 'inherit',
    env: { ...process.env, TMPDIR: '/home/container/tmp' }
  })
}