'use strict'

const test = require('ava')
const path = require('path')
const cp = require('child_process')
const Pipeline = require('@phylum/pipeline')
const {ProcessTaskState} = require('..')

function spawn() {
	return cp.fork(path.join(__dirname, '_process.js'), {
		stdio: ['pipe', 'pipe', 'pipe', 'ipc']
	})
}

function processReady(proc) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject('Process ready message timed out.'), 5000)
		proc.on('message', msg => {
			if (msg === 'ready') {
				clearTimeout(timeout)
				resolve()
			}
		})
	})
}

test('assertions', async t => {
	new ProcessTaskState(new Pipeline.Context(), () => {})
	t.throws(() => new ProcessTaskState('foo', () => {}))
	t.throws(() => new ProcessTaskState(new Pipeline.Context(), 'bar'))
})

test('basic usage', async t => {
	let proc
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, spawn)
		t.is(state.ctx, ctx)

		let spawned = null
		state.on('spawn', proc => {
			spawned = proc
		})

		t.is(state.process, null)
		t.is(state.spawn(), state.process)
		t.is(spawned, state.process)
		proc = state.process
		await processReady(proc)
	})
	await pipeline.enable()
	t.false(proc.killed)
	await pipeline.disable()
	t.true(proc.killed)
})

test('respawn', async t => {
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, spawn)
		const respawnedProc = state.respawn()
		const proc = state.process
		t.is(respawnedProc, proc)
		await processReady(proc)
		state.respawn()
		t.true(proc !== state.process)
		await processReady(state.process)
	})
	await pipeline.enable()
	await pipeline.disable()
})

test('spawn while alive', async t => {
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, spawn)
		state.spawn()
		const proc = state.process
		t.is(state.spawn(), false)
		t.is(proc, state.process)
	})
	await pipeline.enable()
	await pipeline.disable()
})

test('error handling', async t => {
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, () => {
			return cp.spawn(path.join(__dirname, 'i-dont-exist'), {
				stdio: ['pipe', 'pipe', 'pipe', 'ipc']
			})
		})
		state.spawn()
	})
	pipeline.enable()
	await Promise.all([
		new Promise(resolve => pipeline.on('resolve', resolve)),
		new Promise(resolve => pipeline.on('reject', resolve))
	])
	t.pass()
})

test('silent error handling', async t => {
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, () => {
			return cp.spawn(path.join(__dirname, 'i-dont-exist'), {
				stdio: ['pipe', 'pipe', 'pipe', 'ipc']
			})
		})
		state.spawn()
		state.process = null
	})
	pipeline.enable()
	await new Promise((resolve, reject) => {
		pipeline.on('reject', () => t.fail())
		pipeline.on('resolve', resolve)
	})
	t.pass()
})

test('exit from process', async t => {
	const pipeline = new Pipeline(async ctx => {
		const state = new ProcessTaskState(ctx, spawn)
		state.spawn()
		await processReady(state.process)
		state.process.send('quit')
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject('Process did not exit.'), 5000)
			state.process.on('exit', () => {
				clearTimeout(timeout)
				resolve()
			})
		})
		t.is(state.process, null)
	})
	await pipeline.enable()
	await pipeline.disable()
})
