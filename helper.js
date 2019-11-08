const COLORS = {
    background: '#101015',
    green: '#105E00',
    red: '#5E0000',
    orange: '#D17D00',
    purple: '#43005C',
    blue: '#000860',
    lightblue: '#007790',
    yellow: '#8f8f00'
}

// Variables
let cards = []
let explosions = []

let history = {
    data: [],
    index: -1
}

function setup() {
    let canvas = createCanvas(500, 500)
    canvas.parent('canvas-holder')
    
    for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++) {
        cards.push({
            value: -1,
            position: { x, y },
            explosions: 0,
            max_explosion_pct: 0,
            safe: false
        })
    }

    addToHistory()
}

function draw() {
    background(COLORS.background)

    // Draw grid
    for (let x = 0; x < 5; x++)
    for (let y = 0; y < 5; y++) {
        // Verificar se a carta tem um valor atribuido
        let card = getTile({x, y})
        if (card.value > 0) {
            // Desenhar a carta
            switch(card.value) {
                case 1: { fill(COLORS.green); break }
                case 2: { fill(COLORS.orange); break }
                case 3: { fill(COLORS.yellow); break }
                case 4: { fill(COLORS.purple); break }
                case 5: { fill(COLORS.blue); break }
                case 6: { fill(COLORS.lightblue); break }
            }

            rect(
                x * (width / 5), 
                y * (height / 5), 
                (width / 5), 
                (height / 5)
            )

            fill(255)
            stroke(0)
            strokeWeight(3)
            textSize(32)
            textAlign(CENTER, CENTER)
            text(
                card.value < 6 ? card.value : 'K',
                 x * (width / 5) + ((width / 5) / 2),
                 y * (height / 5) + ((height / 5) / 2)
            )
        } else if (card.explosions && !card.safe) {
            fill(COLORS.red)
            rect(
                x * (width / 5), 
                y * (height / 5), 
                (width / 5), 
                (height / 5)
            )

            fill(255)
            stroke(0)
            strokeWeight(1)
            textSize(14)
            textAlign(LEFT, TOP)
            text(
                `${card.explosions}x\n${floor(card.max_explosion_pct)}%`,
                x * (width / 5) + 5,
                y * (height / 5) + 5
            )
        }
    }

    // Draw lines
    stroke(180)
    strokeWeight(2)
    for (let x = 0; x <= 5; x++) {
        let pos = x * (width/5)
        line(pos, 0, pos, width)
        line(0, pos, height, pos)
    }
}


function keyPressed() {
    let value
    let exploded = keyIsDown(SHIFT)

    // Verificar se o cursor do rato se encontra na mesa
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height)
        return

    // Verificar se a carta é valida
    switch (keyCode) {
        case 49: { value = 1; break }
        case 50: { value = 2; break }
        case 51: { value = 3; break }
        case 52: { value = 4; break }
        case 53: { value = 5; break }
        case 75: { value = 6; break }
        default: return
    }

    // Obter casa selecionada
    let pos = {
        x: floor(mouseX / (width / 5)),
        y: floor(mouseY / (height / 5))
    }

    let card = getTile(pos)
    let nearby = cards.filter(c => floor(distance(c.position, pos)) == 1)

    card.value = value
    card.safe = true

    
    // Verificar se a carta explodiu
    if (exploded) {
        // Obter cartas que não tem valor atribuido
        nearby = nearby.filter(c => (c.value == -1 && !c.safe))

        // Adicionar à lista de explosões
        explosions.push(nearby)

        // Contar cartas explodidas
        let pct = 100 / nearby.length

        for (let c of nearby) {
            // Atribuir uma percentagem baseada na probablidade de haver um 5
            if (c.max_explosion_pct < pct) {
                c.max_explosion_pct = pct
            }
            
            c.explosions++

            // Caso a percentagem seja de 100%, colocar o valor da carta como 5 automaticamente
            if (pct == 100) {
                c.value = 5
            }
        }
    } else {
        for (let c of nearby) {
            c.safe = true
        }

        // Update old explosions
        for (let i in explosions) {
            // Remover cartas que não contem um 5
            explosions[i] = explosions[i].filter(_c => !_c.safe)
            let ecards = explosions[i]
            for (let ecard of ecards) {
                ecard.max_explosion_pct = 100 / ecards.length

                if (ecard.max_explosion_pct == 100) {
                    ecard.value = 5
                }
            }
        }
    }

    addToHistory()
}

function addToHistory() {
    if (history.index + 1 < history.data.length)
        history.data.splice(history.index+1, history.data.length - history.index)

    // JSON serve para fazer um deep clone
    history.data.push(
        JSON.parse(JSON.stringify(
            {
                cards,
                explosions
            }
        ))
    )
    history.index++
}

function undo() {
    if (history.index < 0)
        return

    let data = JSON.parse(JSON.stringify(
        history.data[--history.index]
    ))

    cards = data.cards
    explosions = data.explosions
}

function redo() {
    if (history.index >= history.data.length - 1)
        return
    
    let data = history.data[++history.index]

    cards = data.cards
    explosions = data.explosions
}

function restart() {
    history.index = 1
    undo()
}


function getTile({x, y}) {
    return cards.find(card => card.position.x == x && card.position.y == y)
}

function distance(a, b) { return dist(a.x, a.y, b.x, b.y) }