(function() {
	const upgradeOrder = [ // taken from https://github.com/Noble-Mushtak/Gimkit-Strategy/
		["Streak Bonus", 2, 20],
		["Money Per Question", 3, 100],
		["Streak Bonus", 3, 200],
		["Multiplier", 3, 300],
		["Streak Bonus", 4, 2000],
		["Multiplier", 4, 2000],
		["Money Per Question", 5, 10000],
		["Streak Bonus", 5, 20000],
		["Multiplier", 5, 12000],
		["Money Per Question", 6, 75000],
		["Multiplier", 6, 85000],
		["Streak Bonus", 6, 200000],
		["Streak Bonus", 7, 2000000],
		["Streak Bonus", 8, 20000000],
		["Multiplier", 7, 700000],
		["Money Per Question", 9, 10000000],
		["Multiplier", 8, 6500000],
		["Streak Bonus", 9, 200000000],
		["Multiplier", 9, 65000000],
		["Streak Bonus", 10, 2000000000],
		["Money Per Question", 10, 100000000],
		["Multiplier", 10, 1000000000]
	]

	const prefixes = { // the upgrades are always prefixed by this byte, don't ask me why
		"Money Per Question": 178,
		"Streak Bonus": 172,
		"Multiplier": 170,
		"Insurance": 169
	}

	function u8tobuff(array) {
	    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
	}

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
			right: 0;
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
		<p class="gc_info" style="display:none;">Automatically answering & buying</p>
		<button class="gc_pause">Pause</button>
	`
	document.body.appendChild(gcHud)
	let todos = new TodoManager(["Answer a question", "Purchase an upgrade"],
	gcHud.querySelector(".gc_todo"), gcHud.querySelector(".gc_info"))

	gcHud.querySelector(".gc_pause").addEventListener("click", function() {
		active = !active
		this.innerHTML = active ? "Pause" : "Resume"
	})

	let socket = null;
	let lastMessage = null;
	let purchaseMessage = null;
	let correctAnswers = [];

	let wsSend = WebSocket.prototype.send
	WebSocket.prototype.send = function(data) {
		if (socket == null) socket = this
		// console.log("Prefix thingie: ", Array.from(new Uint8Array(data))[97])
		window.socket = this
		wsSend.call(this, data)
		// decode the data from an ArrayBuffer to a string
		let str = new TextDecoder("utf-8").decode(data)
		if(str.includes("UPGRADE_PURCHASED")) {
			purchaseMessage = data
			todos.finish("Purchase an upgrade")
		}
		if(str.toLowerCase().includes("answered")) {
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
		// attempt to purchase upgrades
		let moneyElement = document.querySelector(".sc-gSyvRN.keOSAu > div > div > div > div")
		if(moneyElement && purchaseMessage && active) {
			let money = moneyElement.innerHTML.replace("$", "").replaceAll(",", "")
			for(let upgrade of upgradeOrder) {
				if(money > upgrade[2]) {
					// we can purchase the upgrade
					let arr = Array.from(new Uint8Array(purchaseMessage))
					let text = new TextDecoder("utf-8").decode(purchaseMessage)
					// splice everything between "upgradeName" and "level" in the array
					let startIndex = text.indexOf("upgradeName") + 11
					let endIndex = text.indexOf("level") - 1
					let message = new TextEncoder().encode(upgrade[0])
					let prefix = prefixes[upgrade[0]]
					let swapEncoded = [prefix, ...message]
					arr.splice(startIndex, endIndex - startIndex, ...swapEncoded)
					text = new TextDecoder("utf-8").decode(new Uint8Array(arr))
					// set the level
					let levelIndex = text.indexOf("level") + 5
					arr[levelIndex] = upgrade[1]
					// dispatch the event
					socket.send(u8tobuff(new Uint8Array(arr)))
					console.log("Purchased upgrade", upgrade[0], "at level", upgrade[1])
					// remove the upgrade from the list
					upgradeOrder.splice(upgradeOrder.indexOf(upgrade), 1)
					break;
				}
			}
		} 
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true
	})

	const answerQuestion = () => {
		// sleep for 600-1350ms (these numbers are arbitrary)
		setTimeout(answerQuestion, Math.floor(Math.random() * 750) + 600)
		if(!active) return
		// send a random answer
		let randomAnswer = correctAnswers[Math.floor(Math.random() * correctAnswers.length)]
		if(randomAnswer) socket.send(randomAnswer)
	}
	answerQuestion()

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
})();