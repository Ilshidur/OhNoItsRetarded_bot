module.exports = {

  apps: [

    {
      name: 'oh-no-retarded-bot',
      script: 'src/bot.js',
      env: {
        TWITTER_CONSUMER_KEY: '',
        TWITTER_CONSUMER_SECRET: '',
        TWITTER_ACCESS_TOKEN: '',
        TWITTER_ACCESS_TOKEN_SECRET: ''
      },
      args: ['--release'],
      watch: false,
      append_env_to_name: true,
      autorestart: true
    }

  ]

};
