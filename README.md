
# Process task
Pipeline task for running child processes

## Installation
```bash
npm i @phylum/process-task
```

# Usage
There is currently no api for creating a task directly. Instead a utility is provided for implementing such a task. The `ProcessTaskState` manages a single child process that can be spawned and killed manually and is automatically disposed with the task.
```js
const {ProcessTaskState} = require('@phylum/process-task')

const state = new ProcessTaskState(ctx, spawn)
```
+ ctx `<Pipeline.Context>` - The pipeline context to attach to.
+ spawn `<function>` - A function to spawn a child process. The context is passed with the first argument and the function must return the new child process.

### state.process
Get the current `<ChildProcess>`.
If the process has been killed using `state.kill(..)` or the process emitted an exit event, this property will be set to `null`

### state.spawn()
Spawn the process if not alive.
```js
const proc = state.spawn()
```
+ returns `<ChildProcess> | false` - The new child process if created or false otherwise.

### state.respawn()
Kill the current process if alive and spawn a new one.
```js
const proc = state.respawn()
```
+ returns `<ChildProcess>` - The new child process.

### state.kill([signal])
Kill the current process if alive.<br/>
*Only use this function if you are expecting the process to exit after receiving the signal. Otherwise use `state.process.kill(..)`*
```js
state.kill()
```
Note that `state.process` will be set to `null` after calling this function.
