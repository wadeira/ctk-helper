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

const cardColor = {
    1: COLORS.green,
    2: COLORS.orange,
    3: COLORS.yellow,
    4: COLORS.purple,
    5: COLORS.blue,
    6: COLORS.lightblue
}

const GAME_CARDS = {
    1: 7,
    2: 4,
    3: 5,
    4: 5,
    5: 3,
    6: 1
}

function setup() {
    window.game = new Game()
    
    window.app = new Vue({
        el: '#app',
        data: {
            cards_remaining: game.cards_remaining,
            hand: game.hand,
            cardColor
        },
        methods: {
            remainingCardStyle(card) {
                return `background: ${cardColor[card]}`
            }
        },
        computed: {
            warnAt4() {
                return this.hand[0] >= 4
            }
        }
    })

    let canvas = createCanvas(500, 500)
    canvas.parent('canvas-holder')
}

function draw() {
    game.update()

    app.cards_remaining = game.cards_remaining
    app.hand = game.hand

    background(COLORS.background)

    // Draw grid
    for (let x = 0; x < 5; x++)
    for (let y = 0; y < 5; y++) {
        // Verificar se a carta tem um valor atribuido
        let card = game.findCard({x, y})

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
        } else if (card.explosions && !card.notAFive && game.cards_remaining[5] > 0) {
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
                `${card.explosions}x\n${floor(card.fiveProbability)}%`,
                x * (width / 5) + 5,
                y * (height / 5) + 5
            )
        }

        if (game.hand[0] == 5 && card.value != 5) {

            let nearby = card.getNearby(game.cards).filter(c => c.value == 5)

            if (nearby.length) {          
                stroke(255, 0, 0)
                line(
                    x * (width / 5), 
                    y * (height / 5), 
                    x * (width / 5) + (width/5), 
                    y * (height / 5) + (width/5)
                )
                line( 
                    x * (width / 5), 
                    y * (height / 5) + (width/5),
                    x * (width / 5) + (width/5), 
                    y * (height / 5)
                )
            }
            
        }

        // DEBUG: draw coordinates
        textSize(14)
        textAlign(RIGHT, BOTTOM)
        fill(255)
        stroke(0)
        text(
            `{${card.position.x},${card.position.y}}`,
            (x + 1) * (width/5) - 3,
            (y + 1) * (height/5) - 5
        )
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
        case 54: { value = 6; break } // 6
        case 75: { value = 6; break } // K
        case 46: { value = -1; break }
        case 37: { game.undo(); return }
        case 39: { game.redo(); return }
        default: return
    }

    // Obter casa selecionada
    let pos = {
        x: floor(mouseX / (width / 5)),
        y: floor(mouseY / (height / 5))
    }

    if (value == -1) {
        game.clear(pos)
        return
    }

    game.play(pos, value, exploded)
}

function undo() {
    game.undo()
}

function redo() {
    game.redo()
}

function restart() {
    history.index = 1
    game.reset()
}


function _copy(arr) { return JSON.parse(JSON.stringify(arr)) }

function _savegame() {
    let hash = game.save()

    Swal.fire({
        input: 'textarea',
        inputValue: hash
    })
}

function _loadgame(hash) {
    Swal.fire({
        input: 'textarea',
        inputPlaceholder: 'Hash do jogo'
    }).then(({value}) => {
        try {
            JSON.parse(atob(value))
            game = new Game()
            game.load(value)
        } catch (error) {
            alert('Invalid hash')
        }

    })
}

function openInstructions() {
    open('https://youtu.be/BRdGkVJVzRg', '_blank')
}


function updateExplosions() {
    for (let e in explosions) {
        for (let i in  explosions[e]) {
            explosions[e][i] = getTile(explosions[e][i].position)
        }
    }
}


class Game {
    constructor() {
        this.cards = []     // List of cards in the table
        this.inputs = []    // Store user inputs
        this.cards_remaining = JSON.parse(JSON.stringify(GAME_CARDS))
        this.hand = [1,1,1,1,1,2,2,3,3,4,5,6]
        this.history = {
            index: -1,
            data: []
        }
        
        // Populate cards
        for (let i = 0; i < 5*5; i++)
            this.cards.push(new Card(i % 5, floor(i/5)))

        this.addToHistory()
    }

    update() {
        // Update probabilities of being a 5
        for (let card of this.cards.filter(c => c.hasFiveNearby)) {
            // Find cards nearby that are a five or a possible five
            let nearby = card.getNearby(this.cards).filter(c => !c.notAFive || c.value == 5)
            let pct = 100 / nearby.length
            nearby.map(c => {
                if (c.fiveProbability < pct) {
                    c.fiveProbability = pct

                    if (pct == 100 && c.value == -1) {
                        c.value = 5
                        this.cards_remaining[5]--
                    }
                }
            })
        }

        // Cards that we collected any information
        let checkedCards = this.cards.filter(c => c.notAFive || c.value != -1 || c.explosions)
        if (checkedCards.length == 25) {
            let explodedCards = this.cards.filter(c => c.explosions && !c.notAFive && c.value == -1)

            if (explodedCards.length == this.cards_remaining[5]) {
                explodedCards.map(card => {
                    card.value = 5
                    this.cards_remaining[5]--
                })
            }
        }
    }

    findCard(position) {
        return this.cards.find(card => floor(card.position.distance(position)) == 0)
    }

    play({x, y}, value, exploded) {
        let card = this.findCard({x, y})

        // Check if there is already a value
        if (card.value != -1)
            return

        // Check if there are cards remaining
        if (this.cards_remaining[value] < 1) {
            alert(`Não tens mais cartas disponiveis com o valor ${value < 6 ? value : 'K'}`)
            return
        }

        // Check if the card should be removed from hand
        if (this.hand[0] <= value || (this.hand[0] == 5 && exploded) || this.hand[0] == 6)
            this.hand.shift()

        card.setValue(value, exploded)
        
        if (exploded) {
            card.getNearby(this.cards).map(c => c.explosions++)
            let cardsNearby = card.getNearby(this.cards).filter(c => c.value == 5)
            if (this.cards_remaining[5] == 1 && cardsNearby == 0) { // if there is only a 5 and there are not 5 nearby at the moment
                for (let cardAux of this.cards.filter(c => c.fiveProbability > 0 && !c.isNearby(card))) {
                    cardAux.notAFive = true
                }
            }
        }
        else
            card.getNearby(this.cards).map(c => c.notAFive = true)

        // Remove all the probabilities that do not belong to the card that has nearbies with 1 explosion
        if (this.cards_remaining[5] == 2 && value == 5) {
            for (let cardAux of this.cards.filter(c => c.hasFiveNearby)) {
                // Find cards nearby that are a five or a possible five
                let cardsNearby = cardAux.getNearby(this.cards).filter(c => !c.notAFive || c.value == 5)
                if (this.sameNumberOfExplosionsNearby(cardsNearby)) {
                    for (let cardAux2 of this.cards.filter(c => !c.isNearby(cardAux))) {
                        cardAux2.notAFive = true
                    }
                }
            }
        }
            
        this.cards_remaining[value]--

        this.inputs.push([x, y, value, exploded ? true : false])

        this.addToHistory()
    }

    sameNumberOfExplosionsNearby(cardsNearby) {
        if (cardsNearby.length == 0)
            return false
        
        let numberOfExplosions = cardsNearby[0].explosions
        for (let cardNearby of cardsNearby) {
            if (cardNearby.explosions != numberOfExplosions)
                return false
        }
        return true
    }

    clear({x, y}) {
        let card = this.findCard({x, y})

        card.value = -1
        card.notAFive = true
        this.addToHistory()
    }

    nearbyPos({x, y}) {
        return this.cards.filter(card => floor(card.position.distance({x, y})) == 1)
    }
    

    save() {
        return btoa(JSON.stringify(this.inputs))
    }

    load(hash) {
        try {
            let inputs = JSON.parse(atob(hash))
            
            for (let input of inputs) {
                let position = {
                    x: input[0],
                    y: input[1]
                }

                let value = input[2]
                let exploded = input[3] == 1

                this.play(position, value, exploded)
            }
        } catch (error) {
            console.error('Invalid hash')
            console.error(error)
            return
        }
    }

    addToHistory() {
        if (this.history.index + 1 < this.history.data.length) {
            this.history.data.splice(this.history.index + 1, this.history.data.length - this.history.index)
        }

        this.history.data.push(
            JSON.parse(
                JSON.stringify(
                    {
                        cards: this.cards,
                        explosions: this.explosions,
                        cards_remaining: this.cards_remaining,
                        hand: this.hand,
                        inputs: this.inputs
                    }
                )
            )
        )

        this.history.index++
    }

    undo() {
        if (this.history.index < 1)
            return

        this.setHistory(--this.history.index)
    }

    redo() {
        if (this.history.index >= this.history.data.length - 1)
            return

        this.setHistory(++this.history.index)
    }

    setHistory(index) {
        let data = JSON.parse(JSON.stringify(this.history.data[index]))

        // Change object keys to class
        for (let i = 0; i < this.cards.length; i++) {
            for (let key of Object.keys(data.cards[i])) {
                if (key == 'position') {
                    let { x, y } = data.cards[i][key]
                    this.cards[i][key] = new Vector(x, y)
                    continue
                }
                this.cards[i][key] = data.cards[i][key]
            }    
        }

        this.explosions = data.explosions || []
        this.cards_remaining = data.cards_remaining || []
        this.hand = data.hand || []
        this.inputs = data.inputs || []
    }

    reset() {
        this.history.index = 1
        this.undo()
    }
}

class Card {
    constructor(x, y) {
        this.position = new Vector(x, y)
        this.value = -1

        this.explosions = 0
        
        this.hasFiveNearby = false
        this.notAFive = false
        this.fiveProbability = 0
    }

    get id() {
        return (this.position.y * 5) + this.position.x
    }

    setValue(value, fiveNearby) {
        this.value = value
        this.hasFiveNearby = fiveNearby
        this.notAFive = value != 5
    }

    // Returns the distance between tho cards
    distance(card) {
        return this.position.distance(card.position)
    }

    // Check if the card is nearby the other
    isNearby(card) {
        return this.distance(card) == 1
    }

    getNearby(arr) {
        return arr.filter(card => {
            return floor(card.position.distance(this.position)) == 1
        })
    }
}

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    distance(vec) {
        return Math.floor(dist(this.x, this.y, vec.x, vec.y))
    }
}
