(function() {
	function arrayBufferToString(buffer) {
		return String.fromCharCode.apply(null, new Uint8Array(buffer));
	}

	gc.hud.addTodo("Collect Water")
	gc.hud.addTodo("Conduct Research")
	gc.hud.addTodo("Sell Crops")

	let toggleGroup = gc.hud.createGroup("Toggles")
	let harvestGroup = gc.hud.createGroup("Harvest")
	let harvestInfo = harvestGroup.addText("Harvesting 0 plots, harvest a plot to auto harvest in the future")

	let messages = {}
	let toggles = {
		harvest: true
	}

	let lastMenu = null;

	let waterButton = null;
	let researchButton = null;

	let lastSeed = null;
	let buySeedMenu = null;
	let seedMsgs = new Map();
	let harvestMsgs = new Set();

	let observer = new MutationObserver(function() {
		if(toggles.water || toggles.research) {
			let divs = Array.from(document.querySelectorAll(".vc.maxWidth div"))
			if(divs.some((div) =>  {
				return div.innerText == "All empty." || div.innerText == "Research failed!"
			})) {
				document.querySelectorAll(".ant-btn span").forEach((span) => {
					if(span.innerHTML == "Close") span.click()
				})
				waterButton?.setEnabled?.(false)
				researchButton?.setEnabled?.(false)
			}
		}

		// check if a menu is going to be opened
		// a more "robust" alternative to checking classes, which are prone to change
		let menu = document.querySelector('img[src*="/assets/map/others/enter.svg"] + div > div')
		if(menu) {
			if(menu.innerHTML.includes("Collect Water")) lastMenu = "water"
			else if(menu.innerHTML.includes("Conduct Research")) lastMenu = "research"
			else if(menu.innerHTML.includes("Seed") && !menu.innerHTML.includes("Unlock")) {
				lastMenu = "seed"
				lastSeed = menu.innerHTML.replace("Seed", "").trim()
			}
			else if(menu.innerHTML.includes("Sell")) lastMenu = "sell"
			else if(menu.innerHTML.includes("Collect")) lastMenu = "collect"
			else lastMenu = null	
		}
	})

	gc.socket.outgoing((data) => {
		let str = arrayBufferToString(data)
		if(str.includes("interacted")) {
			if(str.includes("dropped-item")) return
			switch(lastMenu) {
				case 'water':
					if(messages.water) return
					gc.hud.completeTodo("Collect Water")
					messages.water = data
					waterButton = toggleGroup.addToggleBtn("Stop Collecting Water", "Collect Water", (enabled) => {
						toggles.water = enabled
					})
					break;
				case 'research':
					if(messages.research) return
					gc.hud.completeTodo("Conduct Research")
					messages.research = data
					researchButton = toggleGroup.addToggleBtn("Stop Researching", "Auto Research", (enabled) => {
						toggles.research = enabled
					})
					break;
				case 'sell':
					if(messages.sell) return
					gc.hud.completeTodo("Sell Crops")
					messages.sell = data
					toggleGroup.addToggleBtn("Stop Selling", "Auto Sell", (enabled) => {
						toggles.sell = enabled
					})
					break;
			}
		}
		if(str.includes("purchase")) {
			if(seedMsgs.has(lastSeed)) return
			seedMsgs.set(lastSeed, data)
			console.log(seedMsgs)
			if(!buySeedMenu) {
				buySeedMenu = gc.hud.addDropdownButton(Array.from(seedMsgs.keys()), "Buy", (seed) => {
					gc.socket.send(seedMsgs.get(seed))
				}, "Buy")
			} else {
				buySeedMenu.addOption(lastSeed)
			}
		}
		if(str.includes("collect")) {
			harvestMsgs.add(data)
			harvestInfo.setText(`Harvesting ${harvestMsgs.size} plots, harvest a plot to auto harvest in the future`)
			if(harvestMsgs.size == 1) {
				harvestGroup.addToggleBtn("Stop Harvesting", "Auto Harvest", (enabled) => {
					toggles.harvest = enabled
				}, true)
				harvest()
			}
		}
	})

	setInterval(() => {
		if(toggles.water && messages.water) {
			gc.socket.send(messages.water)
		}
		if(toggles.research && messages.research) {
			gc.socket.send(messages.research)
		}
		if(toggles.sell && messages.sell) {
			gc.socket.send(messages.sell)
		}
	}, 1000)

	let harvestIndex = 0
	async function harvest() {
		if(toggles.harvest){
			let msgs = Array.from(harvestMsgs)
			gc.socket.send(msgs[harvestIndex])
			harvestIndex++
			if(harvestIndex >= msgs.length) harvestIndex = 0
		}
		await new Promise((resolve) => setTimeout(resolve, 1000 / harvestMsgs.size))
		harvest()
	}


	observer.observe(document.body, {
		childList: true,
		subtree: true
	})
})()