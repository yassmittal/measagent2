// PM2 process file for the api. Secrets stay in api/.env, which the api reads
// from its working directory, so nothing in here is sensitive.
module.exports = {
  apps: [
    {
      name: 'measagent-api',
      cwd: __dirname,
      script: `${process.env.HOME}/.bun/bin/bun`,
      args: 'run start',
      interpreter: 'none',
      // One instance: the memory and reminder jobs run on a timer inside it.
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '1G',
      // Lets an in-flight chat stream finish before a restart kills it.
      kill_timeout: 10000,
    },
  ],
};
