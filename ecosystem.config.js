module.exports = {
	apps : [{
		name: 'Cardano CLI REST server',
		script: 'npm',
		// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
		args: ['run', 'start'],
		interpreter: '/bin/bash',
		instances: 1,
		autorestart: true,
		watch: false,
		max_memory_restart: '200M',
		env: {
			NODE_ENV: 'production'
		},
		env_dev: {
			NODE_ENV: 'development'
		},
		error_file: 'error.log',
		time: true //prefix logs with standard formated timestamp
	}],
};