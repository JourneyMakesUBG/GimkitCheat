(function() {
	if(!window.gc) return alert(`You need to set up the override to use this script. Find instructions here:
	https://github.com/TheLazySquid/GimkitCheat#setting-up-the-overrides
	If you have it set up, try reloading this page with the console open.`)

	function arrayBufferToString(buffer) {
		return String.fromCharCode.apply(null, new Uint8Array(buffer));
	}

	gc.hud.addTodo("Fish a fish")
	gc.hud.addTodo("Sell a fish")
	
	let autoselling = false;
	let autofishing = false;
	let lastMenu = null;
	
	let quickTravel = new Map()
	let lastTravelPos = null
	let fastTravelMenu = null
	
	let sellMessage = null;
	let fishMessage = null;

	gc.socket.outgoing((data) => {
		// decode the data from an ArrayBuffer to a string
		let str = arrayBufferToString(data)
		if(str.includes("interacted")) {
			if(sellMessage == data || fishMessage == data) return
			if(str.includes("dropped-item")) return
			switch(lastMenu) {
				case "fishing":
					console.log("New fish message:", arrayBufferToString(data))
					if(fishMessage == null) {
						gc.hud.completeTodo("Fish a fish")
						gc.hud.addToggleBtn("Stop autofishing", "Start autofishing", (enabled) => {
							autofishing = enabled
						})
					}
					fishMessage = data
					break
				case "selling":
					console.log("New sell message:", arrayBufferToString(data))
					sellMessage = data
					gc.hud.completeTodo("Sell a fish")
					gc.hud.addToggleBtn("Stop autoselling", "Start autoselling", (enabled) => {
						autoselling = enabled
					})
					break
				case "travel":
					if(!lastTravelPos || quickTravel.has(lastTravelPos)) return
					quickTravel.set(lastTravelPos, data)
					// update the fast travel menu
					if(fastTravelMenu) fastTravelMenu.addOption(lastTravelPos)
					else {
						fastTravelMenu = gc.hud.addDropButton(Array.from(quickTravel.keys()), (pos) => {
							gc.socket.send(quickTravel.get(pos))
						}, "Travel")
					}
			}
		}
	})

	let observer = new MutationObserver(function() {
		// check if a menu is going to be opened
		let menu = document.querySelector('img[src*="/assets/map/others/enter.svg"] + div > div')
		if(menu) {
			if(menu.innerHTML.includes("Cast Fishing Rod")) lastMenu = "fishing"
			else if(menu.innerHTML.includes("Sell Fish")) lastMenu = "selling"
			else if(menu.innerHTML.includes("Travel")) {
				lastMenu = "travel"
				lastTravelPos = menu.innerHTML.replace("Travel", "").trim()
			}
			else lastMenu = null
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
		// send a random answer
		if(autoselling) gc.socket.send(sellMessage)
		if(autofishing) {
			// fish for fish
			if(fishMessage) gc.socket.send(fishMessage)
		}
	}, 500)

	console.log("Gimkit Cheat Loaded")
})();