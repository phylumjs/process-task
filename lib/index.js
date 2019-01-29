'use strict'

function createProcessTask(spawn, {expect = 0, killOnDispose = false} = {}) {
	if (typeof spawn !== 'function') {
		throw new TypeError('spawn must be a function.')
	}
	if (expect && !['number', 'string'].includes(typeof expect)) {
		throw new TypeError('options.expect must be a number or a string.')
	}
	return async ctx => {
		const proc = spawn(ctx)
		const result = new Promise((resolve, reject) => {
			proc.on('error', reject)
			proc.on('exit', (code, signal) => resolve([code, signal]))
		})

		ctx.on('dispose', () => {
			if (killOnDispose) {
				return proc.kill()
			}
			return result
		})

		const [code, signal] = await result
		if ((typeof expect === 'number' && code !== expect) || (typeof expect === 'string' && signal !== expect)) {
			throw Object.assign(new Error(`Process exited with unexpected code or signal: ${signal || code}`), {
				signal, code
			})
		}
		return [code, signal]
	}
}

module.exports = {
	createProcessTask,
	ProcessTaskState: require('./state')
}
