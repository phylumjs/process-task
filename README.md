# Process Task
[![Coverage Status](https://coveralls.io/repos/github/phylumjs/process-task/badge.svg?branch=master)](https://coveralls.io/github/phylumjs/process-task?branch=master)
[![Build Status](https://travis-ci.org/phylumjs/process-task.svg?branch=master)](https://travis-ci.org/phylumjs/process-task)
![Version](https://img.shields.io/npm/v/@phylum/process-task.svg)
![License](https://img.shields.io/npm/l/@phylum/process-task.svg)

Utility for running child processes.

## Installation
```bash
npm i @phylum/process-task
```

## Usage
The `ProcessTaskState` class manages a single child process that can be spawned and killed manually.<br>
It is killed automatically when the task is disposed.
```js
const {ProcessTaskState} = require('@phylum/process-task')
```

### `new ProcessTaskState(ctx, spawn)`
```js
const cp = require('child_process')

async function example(ctx) {
	const state = new ProcessTaskState(ctx, () => {
		return cp.fork('foo.js')
	})

	state.spawn()
}
```
+ ctx `<Pipeline.Context>` - The pipeline context to attach to.
+ spawn `<function>` - A function to spawn a child process. The context is passed with the first argument and the function must return the new child process.

### `state.ctx`
Get the `<Pipeline.Context>` the state was bound to.
```js
state.ctx === ctx
```

### `state.process`
Get the current `<ChildProcess>`.<br>
If the process has been killed using `state.kill(..)` or the process emitted an exit event, this property will be set to `null`

```js
if (state.process) {
	state.process.send('Hello World!')
}
```

### `state.spawn()`
Spawn the process if not alive.
```js
if (state.spawn()) {
	// A new process has been spawned.
} else {
	// The process is alive.
}
```
+ returns `<ChildProcess> | false` - The new child process if created or false otherwise.

### `state.respawn()`
Kill the current process if alive and spawn a new one.
```js
const proc = state.respawn()
```
+ returns `<ChildProcess>` - The new child process.

### `state.kill([signal])`
Kill the current process if alive.<br>
Only use this function if you are expecting the process to exit after receiving the signal. Otherwise use `state.process.kill(..)`
```js
state.kill()
state.process === null
```
Note that `state.process` will be set to `null` after calling this function.

### `Event: 'spawn'`
The `spawn` event is emitted when a new process has been spawned using `state.spawn(..)` or `state.respawn(..)`. The child process is passed with the first argument. This can be useful for listening to process related events like ipc messages.
```js
state.on('spawn', process => {
	process.on('message', msg => {
		console.log('Message from child process:', msg)
	})
})
```
