(function() {
	if(!window.gc) return alert(`You need to set up the override to use this script. Find instructions here:
	https://github.com/TheLazySquid/GimkitCheat#setting-up-an-override
	If you have it set up, try reloading this page with the console open.`)

	gc.hud.addTodo("Answer a question")

	let active = false
	let answerBuffer = null
	gc.socket.outgoing((e) => {
		if(answerBuffer != null) return
		const u8arr = new Uint8Array(e);
		const text = new TextDecoder().decode(u8arr);

		if(!text.includes("answer")) return
		answerBuffer = e

		gc.hud.addToggleBtn("Stop Auto Answering", "Auto Answer Questions", (state) => {
			active = state
		})
		gc.hud.completeTodo("Answer a question")

		const arr = Array.from(u8arr);

		console.log(text)
		
		const correctIDs = gc.questions.map(q => q.answers.find(a => a.correct)._id)
		let index = 0
		
		const startIndex = text.lastIndexOf("answer") + 7
		
		// TODO: Rather than spam every answer and pray, send the correct answer
		setInterval(() => {
			if(!active) return
			// replace everything after the startIndex with a random correct answer
			const id = correctIDs[index % correctIDs.length]
			const bytes = new TextEncoder().encode(id)
			arr.splice(startIndex, arr.length - startIndex, ...bytes)
			
			if(gc.socket) gc.socket.send(u8tobuff(new Uint8Array(arr)))
			index++
		}, 1000 / correctIDs.length)
	})

	function u8tobuff(array) {
		return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
	}
})()