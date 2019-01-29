'use strict'

const test = require('ava')
const Emitter = require('events')
const {Pipeline} = require('@phylum/pipeline')
const {createProcessTask} = require('..')

function createProcess(code, signal) {
	const fake = new Emitter()
	setImmediate(() => fake.emit('exit', code, signal))
	return fake
}

function createFailing() {
	const fake = new Emitter()
	setImmediate(() => fake.emit('error', new Error()))
	return fake
}

function runTask(spawn, options) {
	return new Pipeline(createProcessTask(spawn, options)).enable()
}

test('resolve', async t => {
	t.deepEqual(await runTask(() => createProcess(0)), [0, undefined])
})

test('reject', async t => {
	await t.throwsAsync(runTask(() => createFailing()))
})

test('exit with code', async t => {
	await t.throwsAsync(runTask(() => createProcess(1)))
	await t.throwsAsync(runTask(() => createProcess(undefined, 'SIGINT')))
	await t.throwsAsync(runTask(() => createProcess(7), {expect: 5}))
	await t.throwsAsync(runTask(() => createProcess(7), {expect: 'SIGINT'}))
	t.deepEqual(await runTask(() => createProcess(7), {expect: 7}), [7, undefined])
})

test('exit with signal', async t => {
	await t.throwsAsync(runTask(() => createProcess(undefined, 'SIGINT')))
	await runTask(() => createProcess(undefined, 'SIGINT'), {expect: 'SIGINT'})
})

test('assertions', t => {
	t.throws(() => createProcessTask())
	t.throws(() => createProcessTask(() => {}, {expect: []}))
})

test('dispose', async t => {
	let exited = false
	const task = createProcessTask(ctx => {
		const fake = new Emitter()
		fake.kill = () => t.fail()
		setImmediate(() => {
			ctx.dispose()
			setImmediate(() => {
				exited = true
				fake.emit('exit', 0)
			})
		})
		return fake
	})
	const pipeline = new Pipeline(task)
	pipeline.enable()
	t.false(exited)
	pipeline.disable()
	await pipeline.enable()
	t.true(exited)
})

test('kill on dispose', async t => {
	let exited = false
	let killed = false
	const task = createProcessTask(ctx => {
		const fake = new Emitter()
		fake.kill = () => {
			killed = true
		}
		setImmediate(() => {
			ctx.dispose()
			setImmediate(() => {
				exited = true
				fake.emit('exit', 0)
			})
		})
		return fake
	}, {killOnDispose: true})
	const pipeline = new Pipeline(task)
	await pipeline.enable()
	t.true(exited)
	t.true(killed)
})
