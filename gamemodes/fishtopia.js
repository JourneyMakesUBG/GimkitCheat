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

	function arrayBufferToString(buffer) {
		return String.fromCharCode.apply(null, new Uint8Array(buffer));
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

		.gc_todo {
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
		
		.gc_fasttravel {
			display: flex;
			flex-direction: row;
			justify-content: space-around;
			align-items: center;
			width: 100%;
		}

		.gc_fasttravel select {
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
	document.adoptedStyleSheets = [injectedCss, ...document.adoptedStyleSheets]

	let active = true;
	let autofishing = false;
	let gcHud = document.createElement("div")
	gcHud.classList.add("gc_hud")
	gcHud.innerHTML = `
		<p class="gc_todo"></p>
		<div class="gc_fasttravel" style="display:none;">
			<select>
			</select>
			<button>Travel</button>
		</div>
		<button class="gc_autofish" style="display:none;">Start Autofishing</button>
		<button class="gc_pause">Pause</button>
	`
	document.body.appendChild(gcHud)
	let todos = new TodoManager(["Answer a question", "Fish a fish", "Sell a fish"],
	gcHud.querySelector(".gc_todo"), gcHud.querySelector(".gc_autofish"))
	// prevent the elements from being submitted with enter
	gcHud.querySelectorAll("button").forEach(e => e.addEventListener('keydown', (e) => {
		if(e.key == "Enter") e.preventDefault()
	}))

	gcHud.querySelector(".gc_pause").addEventListener("click", function() {
		active = !active
		this.innerHTML = active ? "Pause" : "Resume"
	})
	gcHud.querySelector(".gc_autofish").addEventListener("click", function() {
		autofishing = !autofishing
		this.innerHTML = autofishing ? "Stop Autofishing" : "Start Autofishing"
	})

	let socket = null;
	let lastMessage = null;
	let correctAnswers = [];
	let lastMenu = null;

	let quickTravel = new Map()
	let lastTravelPos = null

	gcHud.querySelector(".gc_fasttravel button").addEventListener("click", function() {
		let select = gcHud.querySelector(".gc_fasttravel select")
		let pos = quickTravel.get(select.value)
		if(pos == null) return
		socket.send(pos)
	})

	let sellMessage = null;
	let fishMessage = null;

	// override the WebSocket send function to intercept the data
	let wsSend = WebSocket.prototype.send
	WebSocket.prototype.send = function(data) {
		if (socket == null) socket = this
		wsSend.call(this, data)
		// decode the data from an ArrayBuffer to a string
		let str = arrayBufferToString(data)
		if(str.includes("answered")) lastMessage = data
		if(str.includes("interacted")) {
			if(sellMessage == data || fishMessage == data) return
			if(str.includes("dropped-item")) return
			switch(lastMenu) {
				case "fishing":
					console.log("New fish message:", arrayBufferToString(data))
					fishMessage = data
					todos.finish("Fish a fish")
					break
				case "selling":
					console.log("New sell message:", arrayBufferToString(data))
					sellMessage = data
					todos.finish("Sell a fish")
					break
				case "travel":
					if(!lastTravelPos || quickTravel.has(lastTravelPos)) return
					quickTravel.set(lastTravelPos, data)
					// update the fast travel menu
					let select = gcHud.querySelector(".gc_fasttravel select")
					let option = document.createElement("option")
					option.value = lastTravelPos
					option.innerHTML = lastTravelPos
					select.appendChild(option)
					let fastTravel = gcHud.querySelector(".gc_fasttravel")
					fastTravel.style.display = "flex"
					break
			}
		}
	}

	let observer = new MutationObserver(function() {
		// check if a menu is going to be opened
		let menu = document.querySelector(".sc-cBQajf.kLvXJf")
		if(menu) {
			if(menu.innerHTML.includes("Cast Fishing Rod")) lastMenu = "fishing"
			else if(menu.innerHTML.includes("Sell Fish")) lastMenu = "selling"
			else if(menu.innerHTML.includes("Travel")) {
				lastMenu = "travel"
				lastTravelPos = menu.innerHTML.replace("Travel", "").trim()
			}
			else lastMenu = null
		}
		let greenBgExists = Array.from(document.querySelectorAll("div")).some(e => getComputedStyle(e).backgroundColor == "rgb(56, 142, 60)") 
		if(greenBgExists) {
			// make sure the answer was unique
			if(correctAnswers.some(e => e == lastMessage)) return
			// we answered correctly, so this is a new correct answer
			correctAnswers.push(lastMessage)
			// remove the todo
			todos.finish("Answer a question")
		}
	})

	const tryRefish = () => {
		window.requestAnimationFrame(tryRefish)
		if(!autofishing) return
		// hit the fish again button if it exists
		let buttons = document.querySelectorAll("button.ant-btn")
		for(let button of buttons) {
			if(button.innerText == "Fish Again") {
				button.click()
				break
			}
		}
	}
	tryRefish()

	observer.observe(document.body, {
		childList: true,
		subtree: true
	})

	setInterval(function() {
		if(!active) return
		// send a random answer
		let randomAnswer = correctAnswers[Math.floor(Math.random() * correctAnswers.length)]
		if(randomAnswer) socket.send(randomAnswer)
		if(sellMessage) socket.send(sellMessage)
		if(autofishing) {
			// fish for fish
			if(fishMessage) socket.send(fishMessage)
		}
	}, 500)

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
})();