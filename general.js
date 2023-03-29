(function() {
	let socket = window.gcSocket ? window.gcSocket : null;
	if(socket == null) {
		let wsSend = WebSocket.prototype.send
		WebSocket.prototype.send = function(data) {
			if (socket == null) socket = this
			wsSend.call(this, data)
		}
	}

	const answerHex = "0db24d4553534147455f464f525f44455649434583a36b6579a8616e737765726564a86465766963654964b5413442353451797238716755317831714579446e5aa46461746181a6616e73776572b8363338386635393430383634653330303231616561663832"
	const u8arr = new Uint8Array(answerHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
	const arr = Array.from(u8arr);
	const text = new TextDecoder().decode(u8arr);
	console.log(text)
	
	if(!window.gcQuestions) return alert(`You need to set up the override to use this script. Find instructions here:
	https://github.com/TheLazySquid/GimkitCheat#override`)
	const correctIDs = window.gcQuestions.map(q => q.answers.find(a => a.correct)._id)
	let index = 0
	
	const startIndex = text.lastIndexOf("answer") + 7
	
	// TODO: Rather than spam every answer and pray, send the correct answer
	setInterval(() => {
		// replace everything after the startIndex with a random correct answer
		const id = correctIDs[index % correctIDs.length]
		const bytes = new TextEncoder().encode(id)
		arr.splice(startIndex, arr.length - startIndex, ...bytes)
		
		console.log(index)

		if(window.gcSocket) window.gcSocket.send(u8tobuff(new Uint8Array(arr)))
		index++
	}, 1000 / correctIDs.length)
	
	function u8tobuff(array) {
		return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
	}
})
