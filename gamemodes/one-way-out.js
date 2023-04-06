(function () {
	if(!window.gc) return alert(`You need to set up the override to use this script. Find instructions here:
	https://github.com/TheLazySquid/GimkitCheat#setting-up-the-overrides
	If you have it set up, try reloading this page with the console open.`)

	let lastMenu = null
	let shieldMessage = null
	let medpackMessage = null

	gc.hud.addTodo("Buy a medpack")
	gc.hud.addTodo("Buy a shield can")

	let observer = new MutationObserver(function() {
		// check if a menu is going to be opened
		let menu = document.querySelector('img[src*="/assets/map/others/enter.svg"] + div > div')
		if(menu) {
			if(menu.innerHTML.includes("Med Pack")) lastMenu = "medpack"
			else if(menu.innerHTML.includes("Shield Can")) lastMenu = "shieldcan"
			else lastMenu = null
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true
	})

	gc.socket.outgoing((data) => {
		let str = new TextDecoder("utf-8").decode(data)
		if(!str.includes("purchase")) return
		if(lastMenu == "medpack") {
			if(medpackMessage != null) return
			gc.hud.completeTodo("Buy a medpack")
			gc.hud.addBtn("Buy Medpack", () => {
				gc.socket.send(medpackMessage)
			})
			medpackMessage = data
		} else if (lastMenu == "shieldcan") {
			if(shieldMessage != null) return
			gc.hud.completeTodo("Buy a shield can")
			gc.hud.addBtn("Buy Shield Can", () => {
				gc.socket.send(shieldMessage)
			})
			shieldMessage = data
		}
	})
})()