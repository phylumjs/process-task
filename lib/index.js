'use strict'

const cp = require('child_process')

module.exports = options => {
	if (options === null || typeof options !== 'object') {
		throw new TypeError('options must be an object.')
	}
	if (typeof options.spawn !== 'function') {
		throw new TypeError('options.spawn must be a function.')
	}
	if (typeof options.task !== 'function') {
		throw new TypeError('options.task must be a function.')
	}

	const createProcess = options.spawn
	const task = options.task

	return async ctx => {
		let proc = null

		function spawn() {
			if (!proc) {
				const p = createProcess(ctx)
				p.on('error', err => {
					if (proc === p) {
						kill()
						ctx.push(Promise.reject(err))
					}
				})
				p.on('exit', () => {
					if (proc === p) {
						proc = null
					}
				})
				proc = p
				return true
			}
			return false
		}

		function respawn() {
			kill()
			spawn()
		}

		function kill(signal) {
			if (proc) {
				proc.kill(signal)
				proc = null
			}
		}

		ctx.on('dispose', () => {
			if (proc) {
				proc.kill()
				proc = null
			}
		})

		await start(ctx, {
			get proc() {
				return proc
			},
			spawn,
			respawn
		})
	}
}
