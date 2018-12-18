'use strict'

const Emitter = require('events')
const Pipeline = require('@phylum/pipeline')

class ProcessTaskState extends Emitter {
	constructor(ctx, spawn) {
		if (!(ctx instanceof Pipeline.Context)) {
			throw new TypeError('ctx must be a pipeline context.')
		}
		if (typeof spawn !== 'function') {
			throw new TypeError('spawn must be a function.')
		}
		super()
		this.process = null
		Object.defineProperty(this, 'spawn', {
			value: () => {
				if (this.process) {
					return false
				}
				const proc = spawn(ctx)
				proc.on('error', err => {
					if (this.process === proc) {
						this.process.kill()
						this.process = null
						ctx.push(Promise.reject(err))
					}
				})
				proc.on('exit', () => {
					if (this.process === proc) {
						this.process = null
					}
				})
				this.process = proc
				this.emit('spawn', proc)
				return proc
			}
		})

		ctx.on('dispose', () => this.kill())
	}

	kill(signal) {
		if (this.process) {
			this.process.kill(signal)
			this.process = null
		}
	}

	respawn() {
		this.kill()
		return this.spawn()
	}
}

module.exports = ProcessTaskState
