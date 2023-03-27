(function() {
	class TodoManager {
		constructor(todos, hud, toReveal) {
			this.todos = todos
			this.hud = hud
			this.toReveal = toReveal

			let div = document.createElement("div")
			div.innerHTML = "Please do the following"
			this.hud.appendChild(div)

			for(let todo of todos) {
				let div = document.createElement("div")
				div.innerHTML = todo
				this.hud.appendChild(div)
			}
		}
		finish(todo) {
			let index = this.todos.indexOf(todo)
			if(index == -1) return
			this.todos.splice(index, 1)
			let hudElement = Array.from(this.hud.children).find(e => e.innerHTML == todo)
			hudElement.style.textDecoration = "line-through"
			hudElement.style.textDecorationThickness = "2.5px"

			if(this.todos.length == 0) {
				this.hud.remove()
				if(this.toReveal) this.toReveal.style.display = "block"
			}
		}
	}

	// initialize the cheat hud
	const injectedCss = new CSSStyleSheet()
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
		.gc_hud p {
			margin: 0;
			padding: 0;
			text-align: center;
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
	`)
	document.adoptedStyleSheets = [injectedCss, ...document.adoptedStyleSheets]

	let active = true;
	let gcHud = document.createElement("div")
	gcHud.classList.add("gc_hud")
	gcHud.innerHTML = `
		<p class="gc_todo"></p>
		<p class="gc_info" style="display:none;">Automatically answering questions</p>
		<button class="gc_pause">Pause</button>
	`
	document.body.appendChild(gcHud)
	let todos = new TodoManager(["Answer a question"],
	gcHud.querySelector(".gc_todo"), gcHud.querySelector(".gc_info"))

	gcHud.querySelector(".gc_pause").addEventListener("click", function() {
		active = !active
		this.innerHTML = active ? "Pause" : "Resume"
	})

	let socket = null;
	let lastMessage = null;
	let correctAnswers = [];

	let wsSend = WebSocket.prototype.send
	WebSocket.prototype.send = function(data) {
		if (socket == null) socket = this
		wsSend.call(this, data)
		// decode the data from an ArrayBuffer to a string
		let str = new TextDecoder("utf-8").decode(data)
		if(str.includes("answered")) {
			lastMessage = data
		}
	}

	let observer = new MutationObserver(function() {
		let greenBgExists = Array.from(document.querySelectorAll("div")).some(e => getComputedStyle(e).backgroundColor == "rgb(56, 142, 60)") 
		if(greenBgExists) {
			// make sure the answer was unique
			if(correctAnswers.some(e => e == lastMessage)) return
			// we answered correctly, so this is a new correct answer
			correctAnswers.push(lastMessage)
			todos.finish("Answer a question")
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true
	})

	setInterval(function() {
		if(!active) return
		// send a random answer
		let randomAnswer = correctAnswers[Math.floor(Math.random() * correctAnswers.length)]
		if(randomAnswer) socket.send(randomAnswer)
	}, 500)

	// triple shift to hide the hud
	let shiftCount = 0
	let shiftTimeout = null
	document.addEventListener("keydown", function(e) {
		if(e.key == "Shift") {
			shiftCount++
			if(shiftTimeout) clearTimeout(shiftTimeout)
			shiftTimeout = setTimeout(function() {
				shiftCount = 0
			}, 500)
			if(shiftCount == 3) {
				gcHud.style.display = gcHud.style.display == "none" ? "flex" : "none"
			}
		}
	})
	console.log("Gimkit Cheat Loaded")
})()