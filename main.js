

class Game extends Array {
  constructor(w, h, type = 'end-zero') {
    if (h === undefined) {
      // when using .map it calls new Game(16)
      super(w);
      return;
    }
    super(w*h);

    this.w = w; 
    this.h = h;
    this.movesCount = 0;
    this.type = type;
    switch (type) {
      case 'end-zero':
        this.fill(0).forEach((_, i) => { this[i] = (i === this.length-1) ? 0 : i+1; });
        break;
      case 'start-zero':
        this.fill(0).forEach((_, i) => { this[i] = i; });
        break;
      default:
        throw new Error(`unknown game type: ${type}`);
    }
    
  }
  shuffle(n = 500) {
    // this.sort(() => Math.random() - 0.5);
    const movesCount = this.movesCount;
    let c = 0;
    const ts = performance.now();
    for (let i = 0; i < n; i++) {
      while (this.moveCell(Math.floor(Math.random() * this.length)).length === 0) {
        c += 1;
      }
    }
    console.log('shuffled %d times in %d millis with %d misses (rate: %d\%)', n, performance.now() - ts, c, n/c*100);
    this.movesCount = movesCount;
    return this;
  }

  _xy(pos) {
    return [pos % this.w, Math.floor(pos / this.w)];
  }
  _flatPos(xy) {
    const [x, y] = xy;
    return x + y*this.w;
  }
  _ensureFlat(pos) {
    if (typeof pos === 'number') {
      // already flat
      return pos;
    } 
    // convert to flat position index
    return this._flatPos(pos);
  }
  _ensureXY(pos) {
    this._xy(this._ensureFlat(pos));
  }
  toString() {
    let s = '';
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        s += (this[this._flatPos([x,y])]+' ').padStart(3, ' ');
      }
      s += '\n';
    }
    return s;
  }
  get(pos) {
    return this[this._ensureFlat(pos)];
  }
  _zeroCellPosition(asXY=true) {
    const r = this.map((_, i) => i).filter(pos => (this[pos] === 0))[0];
    if (asXY) {
      return this._xy(r);
    }
    return r;
  }

  /**
    * return array of [fromPos, toPos] tuples for moved cells 
    * (empty array if no moves performed)
    *
  **/
  moveDirection(dir, row=false) {
    const [x, y] = this._zeroCellPosition();  // get position of empty cell
    switch (dir) {
      case 'up': {
        if (y+1 >= this.h) return [];  // impossible move
        if (row) return this.moveCell([x, this.h-1]);   // act as last cell in column was clicked
        return this.moveCell([x, y+1])
      }
      case 'down': {
        if (y-1 < 0) return [];
        if (row) return this.moveCell([x, 0]);  // act as first cell in column was clicked
        return this.moveCell([x, y-1]);
      }
      case 'right': {
        if (x-1 < 0) return [];
        if (row) return this.moveCell([0, y]);  // as first cell in row was clicked
        return this.moveCell([x-1, y]);
      }
      case 'left': {
        if (x+1 >= this.w) return [];
        if (row) return this.moveCell([this.w-1, y]);  // as last cell in row was clicked
        return this.moveCell([x+1, y]);
      }
      default: {
        throw new Error(`unknown move direction: ${dir}`);
      }
    }
  }

  /**
    * return array of [fromPos, toPos] tuples for moved cells 
    * (empty array if no moves performed)
    *
  **/
  moveCell(pos) {
    pos = this._ensureFlat(pos);
    if (this[pos] === 0) {
      // zero cell is immovable
      return [];
    }

    const [x, y] = this._xy(pos);
    const [x0, y0] = this._zeroCellPosition();

    // if selected and emtpy cell are on same column
    if (x === x0) {
      this.movesCount += 1;
      const shiftValue = y0 < y ? 1 : -1;
      const swapsCount = Math.abs(y - y0);
      return new Array(swapsCount).fill(0).map((_, i) => {
        const fromPos = this._flatPos([x0, y0+(i+1)*shiftValue]);
        const toPos = this._flatPos([x0, y0+i*shiftValue]);
        [this[fromPos], this[toPos]] = [this[toPos], this[fromPos]];
        return [fromPos, toPos];
      });
    }

    // or if on same row
    else if (y === y0) {
      this.movesCount += 1;
      const shiftValue = x0 < x ? 1 : -1;
      const swapsCount = Math.abs(x - x0);
      return new Array(swapsCount).fill(0).map((_, i) => {
        const fromPos = this._flatPos([x0+(i+1)*shiftValue, y0]);
        const toPos = this._flatPos([x0+i*shiftValue, y0]);
        [this[fromPos], this[toPos]] = [this[toPos], this[fromPos]];
        return [fromPos, toPos];
      });
    }

    // no swap actions
    return [];
  }

  /**
    * return number between 0.0 and 1.0 
    * where 0 means field is way far from completeness 
    * and 1.0 means field is totally completed (ordered)
    *
  **/
  estimatedCompleteness() {
    // const manhattanDistance = ([x1, y1], [x2, y2]) => Math.abs(x2-x1) + Math.abs(y2-y1);
    // const maxStepsCountForPosition = i => 'fuck you';  // todo: for 4x4 field return one of {10, 13, 16}
    // const estimatedStepsCountForValue = (value, currentPos) => 'magic'; 
    
    // const maxStepsCountTotal = this.map((_, pos) => maxStepsCountForPosition).reduce((s, v) => s+v, 0);
    // const stepsLeft = this.map((value, pos) => estimatedStepsCountForValue(value, pos)).reduce((s, v) => s+v, 0);
    // return 1.0 - stepsLeft / maxStepsCountTotal;

    const indexValueDiffSum = this
        // zero is empty cell, it must be on last position
        .map((value, index) => index-(value === 0 ? (this.length-1) : value-1))
        .reduce((sum, diff) => sum+Math.abs(diff), 0);

    // powering resulting value return more 'native' feeling values
    return Math.pow(1.0 - indexValueDiffSum / (14*this.length), 4);
  }
}

const fieldSize = 4;
const game = new Game(fieldSize, fieldSize).shuffle();
const movesCounter = {
  best: JSON.parse(localStorage.getItem('15:best-result')),
  current: 0,
  gameCompleted: false,
  complete: function() {
    if (this.gameCompleted) return;
    this.gameCompleted = true;
    if (this.best === null || this.current < this.best) {
      this.best = this.current;
      localStorage.setItem('15:best-result', JSON.stringify(this.best));
    }
  }
}


const gameContainer = document.querySelector('#game-container');
const rootContainer = document.querySelector('#app');
const currentMovesCounter = document.querySelector('#moves-count');
const bestResultCounter = document.querySelector('#best-result');

gameContainer.style.gridTemplateColumns = `repeat(${fieldSize}, 1fr)`;

function randomCssColor() {
  const minColor = 50, maxColor = 200;
  const r = () => Math.random() * (maxColor-minColor) + minColor;   // not too dark and too light colors
  return `rgb(${r()}, ${r()}, ${r()})`;
}

const cells = new Array(fieldSize*fieldSize).fill(0).map((_, i) => {
  const value = game[i];
  const cell = document.createElement('button');
  cell.classList.add('cell');
  cell.innerText = value;
  cell.dataset.value = value;
  cell.style.color = randomCssColor();
  if (value === 0) { cell.tabIndex = -1; }
  cell.addEventListener('click', onCellClick);

  gameContainer.appendChild(cell);  

  return cell;
});


function reflectGameStage() {
  const completeness = game.estimatedCompleteness();
  if (completeness === 1) {
    movesCounter.complete();
    rootContainer.style.backgroundColor = '#3333ff';
  } else {
    // red component goes down to zero
    // green to 1 according to completeness value
    // ... means from gradient from red to green! kek
    rootContainer.style.backgroundColor = `rgb(${255 - completeness*255}, ${completeness*255}, 0)`;
  }
  currentMovesCounter.innerText = movesCounter.current;
  bestResultCounter.innerText = movesCounter.best === null ? '-' : movesCounter.best;
}
reflectGameStage();

function handleMoveResult(res) {
  if (res.length === 0) {
    return;
  }
  movesCounter.current = game.movesCount;
  res.forEach(([fromPos, toPos]) => {
    const fromCell = gameContainer.children[fromPos];
    const toCell = gameContainer.children[toPos];
    swapElements(fromCell, toCell);
  });
  reflectGameStage();
}

function swapElements(obj1, obj2) {
  var temp = document.createElement("div");
  obj1.parentNode.insertBefore(temp, obj1);
  obj2.parentNode.insertBefore(obj1, obj2);
  temp.parentNode.insertBefore(obj2, temp);
  temp.parentNode.removeChild(temp);
}

// debug

function _swapGamePositions(a, b) {
  const r = [game[a], game[b]] = [game[b], game[a]];
  handleMoveResult([[a, b]]);
  return r;
}


// control by cell click
function onCellClick(e) {
  const pos = Array.prototype.indexOf.call(gameContainer.children, e.target);
  const res = game.moveCell(pos);
  handleMoveResult(res);
}


// control by key

const keyCodeArrowButtonMap = {
  38: 'up',
  39: 'right',
  40: 'down',
  37: 'left',
};

function onKeyDown(e) {
  if (keyCodeArrowButtonMap.hasOwnProperty(e.keyCode)) {
    e.stopPropagation();
    e.preventDefault();
    const direction = keyCodeArrowButtonMap[e.keyCode];
    const res = game.moveDirection(direction, e.ctrlKey);
    handleMoveResult(res);
  }
}

document.addEventListener('keydown', onKeyDown);
