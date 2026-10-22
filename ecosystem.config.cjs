module.exports = {
  apps: [
    {
      name: 'oshads',
      script: 'npm',
      args: 'run start',
      instances: 1, // Single instance required for SQLite database
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8788
      }
    }
  ]
}
