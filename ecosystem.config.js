module.exports = {
  apps: [
    {
      name: 'frontend_live',
      script: 'npm',
      args: 'start', // Runs "npm run start"
      instances: 1,  // You can adjust instances
      exec_mode: 'fork', // Fork mode (not cluster mode for Next.js)
      env: {
        PORT: 3000,  // Set the port to 3004
        NODE_ENV: 'production'
      }
    }
  ]
};
