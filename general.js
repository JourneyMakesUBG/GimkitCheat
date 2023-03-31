(function() {
	if(!window.gcQuestions || !window.gcSocket) return alert(`You need to set up the override to use this script. Find instructions here:
	https://github.com/TheLazySquid/GimkitCheat#override
	If you have it set up, try reloading this page with the console open.`)
	
	// initalize standard stuff so multiple scripts can run simultaneously
	class GCHud {
		constructor() {
			this.todos = []
			
			this.hud = document.createElement("div")
			this.hud.classList.add("gc_hud")
			this.hud.innerHTML = `
				<div class="gc_todo_msg" style="display:none;">Please do the following:</div>
			`
			document.body.appendChild(this.hud)

			// make the hud draggable
			let drag = false
			let dragX = 0
			let dragY = 0
			this.hud.addEventListener("mousedown", (e) => {
				drag = true
				dragX = e.clientX - this.hud.offsetLeft
				dragY = e.clientY - this.hud.offsetTop
			})
			window.addEventListener("mouseup", () => drag = false)
			window.addEventListener("mousemove", (e) => {
				if(drag) {
					this.hud.style.left = e.clientX - dragX + "px"
					this.hud.style.top = e.clientY - dragY + "px"
				}
			})				

			// add stylesheets
			let injectedCss = new CSSStyleSheet()
			injectedCss.replaceSync(`
			.gc_hud {
				background-color: rgba(0, 0, 0, 0.5) !important;
				position: absolute;
				top: 0;
				left: 0;
				width: 300px;
				height: 150px;
				z-index: 999999999;
				color: white;
				font-size: 1rem;
				font-family: Verdana, Geneva, Tahoma, sans-serif;
				display: flex;
				flex-direction: column;
				justify-content: space-around;
				align-items: center;
				margin: 1rem;
				border-radius: 0.5rem;
			}

			.gc_hud button {
				width: 100%;
				height: 2rem;
				margin: 0;
				padding: 0;
				background-color: rgba(0, 0, 0, 0.5);
				border: none;
				border-radius: 0.5rem;
			}

			.gc_hud button:hover {
				border: 1px solid white;
			}

			.gc_todo .gc_todo_msg {
				width: 100%;
			}

			.gc_drop_group {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				width: 100%;
			}

			.gc_drop {
				width: 60%;
				height: 2rem;
				margin: 0;
				padding: 0;
				background-color: rgba(0, 0, 0, 0.5);
				color: white;
				font-size: 1rem;
				font-family: Verdana, Geneva, Tahoma, sans-serif;
				border: none;
				border-radius: 0.5rem;
				margin: 0.35rem;
			}
			`)
			document.adoptedStyleSheets = [injectedCss]				
		}
		addToggleBtn(on, off, callback) {
			let enabled = false
			let btn = document.createElement("button")
			btn.classList.add("gc_toggle")
			btn.innerHTML = off
			btn.addEventListener("click", function() {
				enabled = !enabled
				this.innerHTML = enabled ? on : off
				callback(enabled)
			})
			btn.addEventListener("keydown", (e) => {
				e.preventDefault()
			})
			this.hud.appendChild(btn)
		}
		addTodo(text) {
			this.todos.push(text)
			let todo = document.createElement("div")
			todo.classList.add("gc_todo")
			todo.innerHTML = text
			this.hud.querySelector(".gc_todo_msg").after(todo)
			this.hud.querySelector(".gc_todo_msg").style.display = "block"
		}
		completeTodo(text) {
			if(this.todos.indexOf(text) == -1) return
			this.hud.querySelectorAll(".gc_todo").forEach((todo) => {
				if(todo.innerHTML == text) {
					todo.remove()
				}
			})
			this.todos.splice(this.todos.indexOf(text), 1)
			if(this.todos.length == 0) this.hud.querySelector(".gc_todo_msg").style.display = "none"
		}
		addDropButton(values, callback, btnMsg = "Go") {
			let group = document.createElement("div")
			group.classList.add("gc_drop_group")
			let drop = document.createElement("select")
			drop.classList.add("gc_drop")
			values.forEach((value) => {
				let option = document.createElement("option")
				option.innerHTML = value
				drop.appendChild(option)
			})
			group.appendChild(drop)
			let btn = document.createElement("button")
			btn.classList.add("gc_drop_btn")
			btn.innerHTML = btnMsg
			btn.addEventListener("click", () => callback(drop.value))
			btn.addEventListener("keydown", (e) => {
				e.preventDefault()
			})
			group.appendChild(btn)
			this.hud.appendChild(group)
			return {
				addOption: (value) => {
					let option = document.createElement("option")
					option.innerHTML = value
					drop.appendChild(option)
				},
				removeOption: (value) => {
					drop.querySelectorAll("option").forEach((option) => {
						if(option.innerHTML == value) option.remove()
					})
				}
			}
		}
	}

	if(!window.gcSocket){
		window.gcSocket = {
			fake: true,
			outgoingCallbacks: [],
			outgoing: function(callback) {
				if(!this.outgoingCallbacks) this.outgoingCallbacks = []
				this.outgoingCallbacks.push(callback)
			}
		}
	}

	if(!WebSocket.prototype.outgoing) {
		WebSocket.prototype._send = WebSocket.prototype.send
		WebSocket.prototype.send = function(data) {
			if(window.gcSocket.fake) {
				this.outgoingCallbacks = window.gcSocket.outgoingCallbacks
				window.gcSocket = this
			}
			if(this.outgoingCallbacks) {
				for(let callback of this.outgoingCallbacks) {
					callback(data)
				}
			}
			return this._send(data)
		}
		WebSocket.prototype.outgoing = function(callback) {
			if(!this.outgoingCallbacks) this.outgoingCallbacks = []
			this.outgoingCallbacks.push(callback)
		}
	}

	if(!window.gcHud) {
		let hud = new GCHud()
		window.gcHud = hud
	}

	window.gcHud.addTodo("Answer a question")

	let active = false
	let answerBuffer = null
	window.gcSocket.outgoing((e) => {
		if(answerBuffer != null) return
		const u8arr = new Uint8Array(e);
		const text = new TextDecoder().decode(u8arr);

		if(!text.includes("answer")) return
		answerBuffer = e

		window.gcHud.addToggleBtn("Stop Auto Answering", "Auto Answer Questions", (state) => {
			active = state
		})
		window.gcHud.completeTodo("Answer a question")

		const arr = Array.from(u8arr);

		console.log(text)
		
		const correctIDs = window.gcQuestions.map(q => q.answers.find(a => a.correct)._id)
		let index = 0
		
		const startIndex = text.lastIndexOf("answer") + 7
		
		// TODO: Rather than spam every answer and pray, send the correct answer
		setInterval(() => {
			if(!active) return
			// replace everything after the startIndex with a random correct answer
			const id = correctIDs[index % correctIDs.length]
			const bytes = new TextEncoder().encode(id)
			arr.splice(startIndex, arr.length - startIndex, ...bytes)
			
			if(window.gcSocket) window.gcSocket._send(u8tobuff(new Uint8Array(arr)))
			index++
		}, 1000 / correctIDs.length)
	})

	function u8tobuff(array) {
		return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
	}
})()