'use strict'

process.send('ready')
process.on('message', msg => {
	if (msg === 'quit') {
		process.exit()
	}
})

setInterval(() => {}, 1000)
