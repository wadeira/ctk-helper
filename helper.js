// setup i18n
function updateContent() {
  let elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const text = i18next.t(key);
    element.textContent = text;
  });
  
  
  elements = document.querySelectorAll('[i18n-title]')
  elements.forEach((element) => {
    const key = element.getAttribute('i18n-title')
    const text = i18next.t(key)
    element.title = text;
  })
}

i18next
.use(i18nextHttpBackend)
.use(i18nextBrowserLanguageDetector)
.init({
  fallbackLng: 'en',
  backend: {
    loadPath: './locales/{{lng}}.json'
  }
}, (error, t) => {
  updateContent()
})




const COLORS = {
  background: '#101015',
  green: '#105E00',
  red: '#5E0000',
  orange: '#D17D00',
  purple: '#43005C',
  blue: '#000860',
  lightblue: '#007790',
  yellow: '#8f8f00',
  grey: '#1d1d26',
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
        updateContent()
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
    }
    else if (card.explosions && !card.notAFive && game.cards_remaining[5] > 0) {
      let red = (card.explosions * 140 / 8) + 10
      fill(red, 0, 0)
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
    else if (card.notAFive) {
      fill(COLORS.grey);
      rect(x * (width / 5), y * (height / 5), width / 5, height / 5);
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
} // DRAW
              
              
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
    inputPlaceholder: i18next.t('game_hash')
  }).then(({value}) => {
    if (!value || !value.length) return;
    try {
      JSON.parse(atob(value))
      game = new Game()
      game.load(value)
    } catch (error) {
      Swal.fire(i18next.t('invalid_hash'))
    }
    
  })
}

function openInstructions() {
  let t = i18next.t;
  Swal.fire({
    title: t('help_title'),
    html: t('help_text', { joinArrays: '<br>' }),
    showCloseButton: true,
    confirmButtonText: `<i class="fa fa-play"></i> ${t('help_watch_video')}`
  }).then((result) => {
    if (result.isConfirmed) {
      open(t('help_video_url'), '_blank')
    }
  })
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
    
    // Check if there is already an value
    if (card.value != -1)
    return
    
    // Check if there are cards remaining
    if (this.cards_remaining[value] < 1) {
      Swal.fire({
        text: i18next.t('no_more_cards', {value: value < 6 ? value : 'K'}),
        icon: "warning"
      });
      return
    }
    
    // Check if the card should be removed from hand
    if (this.hand[0] <= value || (this.hand[0] == 5 && exploded) || this.hand[0] == 6)
    this.hand.shift()
    
    this.cards_remaining[value]--
    
    card.setValue(value, exploded)
    
    if (exploded) {
      let nearby = card.getNearby(this.cards)
      nearby.map(c => c.explosions++)

      // create area of probabilities
      card.createAreaOfProbability();
      
      if (this.cards_remaining[5] == 1 && !nearby.filter(c => c.value == 5).length) {
        this.cards.map(c => {
          if (nearby.indexOf(c) < 0)
          c.notAFive = true
        })
      }
    }
    else
    card.getNearby(this.cards).map(c => c.notAFive = true)
    

    //Check for areas of probabilities
    this.checkAreasOfProbability();

    this.inputs.push([x, y, value, exploded ? true : false])
    
    this.addToHistory()
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
    
    // Convert Sets to Arrays before storing in history
    const cardsCopy = this.cards.map((card) => ({
      ...card,
      areaOfProbability: card.areaOfProbability ? [...card.areaOfProbability] : null,
    }));

    this.history.data.push(
      JSON.parse(
        JSON.stringify({
            cards: cardsCopy, // Use the converted copy of cards
            explosions: this.explosions,
            cards_remaining: this.cards_remaining,
            hand: this.hand,
            inputs: this.inputs
        })
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
    
    // Restore Sets from Arrays
    const cardsCopy = data.cards.map((cardData) => {
      const card = new Card(cardData.position.x, cardData.position.y);
      card.value = cardData.value;
      card.explosions = cardData.explosions;
      card.hasFiveNearby = cardData.hasFiveNearby;
      card.notAFive = cardData.notAFive;
      card.fiveProbability = cardData.fiveProbability;
      card.areaOfProbability = cardData.areaOfProbability ? new Set(cardData.areaOfProbability) : null;
      return card;
    });

    this.cards = cardsCopy;
    this.explosions = data.explosions || [];
    this.cards_remaining = data.cards_remaining || [];
    this.hand = data.hand || [];
    this.inputs = data.inputs || [];
  }
  
  reset() {
    this.history.index = 1
    this.undo()
  }

  /**
   * Analyzes cards with associated areas of probability to identify and filter combinations
   * that do not intersect in terms of areas of probability and do not contain a 5
   * in their areas of probability. Marks cards outside these combinations as "not a five",
   * only if the length of the combination matches the number of remaining cards with value 5.
   * 
   * Exemple scenario :
   * 
   * - clic on the card at (1,1) : discover a 1 with a probability of 5 around (marked as P) 
   * - clic on the card at (1,4) : discover a 3 with a probability of 5 around (marked as P) 
   * - clic on the card at (3,1) : discover a 2 with a probability of 5 around (marked as P) 
   * - clic on the card at (4,3) : discover a 4 with no 5s around (marked as -)
   * 
   * 
   *          P | P | P | P | P
   *          P | 1 | P | 2 | P
   *          P | P | P | - | -
   *          P | P | P | - | 4
   *          P | 3 | P | - | -
   * 
   * - clic on the card at (4,2) : discover a 1 with a probability of 5 around (marked as P)
   * 
   * --> The card at (4,1) is marked as a 5 by the update() function.
   * 
   *          P | P | P | P | P
   *          P | 1 | P | 2 | 5
   *          P | P | P | - | 2
   *          P | P | P | - | 4
   *          P | 3 | P | - | -
   * 
   * --> The checkAreasOfProbability function will deduce that cards at (3,0) and (4,0) cannot be a 5
   * (because card at (1,1) and (1,3) have their areas of 5 probability non-intersecting, meaning each of them has a 5 around + one 5 has already been discovered)
   * 
   *          P | P | P | - | -
   *          P | 1 | P | 2 | 5
   *          P | P | P | - | 2
   *          P | P | P | - | 4
   *          P | 3 | P | - | -
   * 
   */
  checkAreasOfProbability() {
    // Filter cards with areas of probability
    let cardsWithAreasOfProba = this.cards.filter((card) => card.areaOfProbability !== null);
    let nbCardsWithArea = cardsWithAreasOfProba.length;
    let maxNbFive = GAME_CARDS[5];
  
    // Creation of every combination of cards possessing an area of probability
    let combinationList = [];
  
    // First, add 1 card combinations
    combinationList = Array.from({ length: nbCardsWithArea }, (_, i) => [i]);
  
    // Then, add 2+ card combinations
    let maxCombinationLength = Math.min(maxNbFive, cardsWithAreasOfProba.length);
    for (let i = 1; i < maxCombinationLength; i++) {
      let lastIndice = i;
      let maxValue = nbCardsWithArea - 1;
      let output = [];
      for (let k = 0; k <= lastIndice; k++) {
        output.push(k);
      }
      combinationList.push([...output]);
      while (lastIndice >= 0) {
        while (output[lastIndice] < maxValue) {
          output[lastIndice] += 1;
          combinationList.push([...output]);
        }
        lastIndice--;
        maxValue--;
      }
    }
  
    // Now iterate over every combination and look for non-intersection and no 5s in the areas of probability
    let combinationListFiltered = [];
  
    for (let combination of combinationList) {
      let intersectionFound = false;
      for (let i = 0; i < combination.length - 1; i++) {
        const card1 = cardsWithAreasOfProba[combination[i]];
        for (let j = i + 1; j < combination.length; j++) {
          const card2 = cardsWithAreasOfProba[combination[j]];
          const intersection = new Set([...card1.areaOfProbability].filter((x) => card2.areaOfProbability.has(x)));
  
          if (intersection.size > 0) {
            intersectionFound = true;
            break;
          }
        }
  
        if (intersectionFound) {
          break;
        }
      }
      if (!intersectionFound) {
        let fivesInAreas = false;
        for (let i of combination) {
          cardsWithAreasOfProba[i].getNearby(this.cards).filter((c) => c.value == 5).length ? (fivesInAreas = true) : null;
        }
        if (!fivesInAreas) {
          combinationListFiltered.push(combination);
        }
      }
    }
  
    // Keep only the combination with length == nb fives remaining and mark cards outside of the combination as not a five
    console.clear();
    for (let combination of combinationListFiltered) {
      if (combination.length != this.cards_remaining[5]) {
        continue;
      }
      for (let card of this.cards) {
        let isNotInAnyArea = true;
        combination.forEach((i) => {
          if (cardsWithAreasOfProba[i].areaOfProbability.has(`${card.position.x},${card.position.y}`)) {
            isNotInAnyArea = false;
          }
        });
        if (isNotInAnyArea && card.value != 5) {
          card.notAFive = true;
          console.log('card at' + card.position.x + ',' + card.position.y + 'is not a five');
        }
      }
    }
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

    this.areaOfProbability = null;
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

  createAreaOfProbability() {
    let area = new Set();
    // Iterate over neighboring cells (including diagonal)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let nx = this.position.x + dx;
        let ny = this.position.y + dy;
        // Ensure coordinates are within bounds
        if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
          // Add neighboring cell to area of probability
          area.add(`${nx},${ny}`);
        }
      }
    }
    this.areaOfProbability = area;
    console.log(this.areaOfProbability);
  }
}
                    
class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  
  distance(vec) {
    return dist(this.x, this.y, vec.x, vec.y)
  }
}