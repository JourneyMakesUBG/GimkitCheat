(function() {
    let purchases = gc.hud.createGroup("Purchase")

    let healthDevice = gc.getDevice({ mustHave: { grantedItemId: "medpack" } })
    let healthPacket = {
        key: "purchase",
        data: undefined,
        deviceId: healthDevice.id
    }

    purchases.addBtn("Medpack", () => {
        gc.socket.sendObj("MESSAGE_FOR_DEVICE", healthPacket)
    })

    let shieldDevice = gc.getDevice({ mustHave: { grantedItemId: "shield-can" } })
    let shieldPacket = {
        key: "purchase",
        data: undefined,
        deviceId: shieldDevice.id
    }

    purchases.addBtn("Shield Can", () => {
        gc.socket.sendObj("MESSAGE_FOR_DEVICE", shieldPacket)
    })

    let autoAttacking = false
    gc.hud.addToggleBtn("Stop auto attacking", "Auto Attack", (state) => {
        autoAttacking = state
    }, false)

    let characters = JSON.parse(JSON.stringify(gc.data.serializer.getState().characters))
    let user
    let closestDistance = Infinity
    for(let id in characters) {
        let character = characters[id]
        let distance = Math.sqrt(Math.pow(character.x - gc.data.playerPos.x, 2) + 
            Math.pow(character.y - gc.data.playerPos.y, 2))
        if(distance < closestDistance) {
            user = character
            closestDistance = distance
        }
    }
    
    setInterval(() => {
        if(!autoAttacking) return
        let characters = JSON.parse(JSON.stringify(gc.data.serializer.getState().characters))
    
        // calculate the closest player to the last position we were at
        let target
        let shortedDistance = Infinity
        for(let id in characters) {
            if(id == user.id) continue
            let character = characters[id]

            // don't attack respawning players
            if(character.isRespawning || character.health.spawnImmunityActive) continue
            let distance = Math.sqrt(Math.pow(character.x - gc.data.playerPos.x, 2) + 
                Math.pow(character.y - gc.data.playerPos.y, 2))
            if(distance < shortedDistance) {
                target = character
                shortedDistance = distance
            }
        }
    
        if(!target) return
        gc.socket.sendObj("FIRE", {
            angle: 0,
            x: target.x,
            y: target.y
        })
    }, 100)
})()