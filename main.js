

class Game extends Array {
  constructor(w, h) {
    if (h === undefined) {
      // when using .map it calls new Game(16)
      super(w);
      return;
    }
    
    super(w*h);
    this.w = w; 
    this.h = h;
    this.fill(0).forEach((_, i) => { this[i] = i; });
  }
  shuffle() {
    this.sort(() => Math.random() - 0.5);
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

  /**
    * return [pos, newPos] for moved cell if any, else return undefined
    *
  **/
  moveDirection(dir) {
    const [x, y] = this._xy(this.map((_, i) => i).filter(pos => (this[pos] === 0))[0]);  // get position of empty cell
    switch (dir) {
      case 'up': {
        if (y+1 >= this.h) return;  // impossible move
        return this.moveCell([x, y+1])
      }
      case 'down': {
        if (y-1 < 0) return;
        return this.moveCell([x, y-1]);
      }
      case 'right': {
        if (x-1 < 0) return;
        return this.moveCell([x-1, y]);
      }
      case 'left': {
        if (x+1 >= this.w) return;
        return this.moveCell([x+1, y]);
      }
      default: {
        throw new Error(`unknown move direction: ${dir}`);
      }
    }
  }

  /**
    * return [pos, newPos] of new cell if cell with given position has empty adjacent cell
    * or return undefined if move can not be done
    *
  **/
  moveCell(pos) {
    pos = this._ensureFlat(pos);
    const [x, y] = this._xy(pos);
    if (this[pos] === 0) {
      // zero cell is immovable
      return;
    }
    const adjacentPositions = [
      [x, y-1],   // upper
      [x+1, y],   // right
      [x, y+1],   // bottom
      [x-1, y],   // left
    ]
      .filter(([x, y]) => (x >= 0 && x < this.w && y >= 0 && y < this.h))   // leave only possible values
      .map(this._flatPos.bind(this));

    const [newPos] = adjacentPositions
      .filter(pos => this[pos] === 0);     // leave only one with empty cell

    // newPos contains zero value === empty cell
    if (newPos !== undefined) {
      // swap values
      [this[newPos], this[pos]] = [this[pos], this[newPos]];
      // todo: check if game is ended
      return [pos, newPos];
    }
  }
}

const game = new Game(4, 4).shuffle();

const gameContainer = document.querySelector('#game-container');
const colors = ['red', 'blue', 'green', 'purple'];

const cells = new Array(4*4).fill(0).map((_, i) => {
  const value = game[i];
  const cell = document.createElement('button');
  cell.classList.add('cell');
  cell.innerText = value;
  cell.dataset.value = value;
  if (value === 0) { cell.tabIndex = -1; }
  cell.addEventListener('click', onCellClick);

  cell.style.color = colors[i%colors.length];

  gameContainer.appendChild(cell);  

  return cell;
});

function swapCells(fromPos, toPos) {
  const fromCell = gameContainer.children[fromPos];
  const toCell = gameContainer.children[toPos];
  swapElements(fromCell, toCell);
}

function swapElements(obj1, obj2) {
  var temp = document.createElement("div");
  obj1.parentNode.insertBefore(temp, obj1);
  obj2.parentNode.insertBefore(obj1, obj2);
  temp.parentNode.insertBefore(obj2, temp);
  temp.parentNode.removeChild(temp);
}


// control by cell click
function onCellClick(e) {
  const pos = Array.prototype.indexOf.call(gameContainer.children, e.target);
  const res = game.moveCell(pos);
  if (res) {
    swapCells(...res);
  }
}


// control by key

const keyCodeDirection = {
  38: 'up',
  39: 'right',
  40: 'down',
  37: 'left',
};

function onKeyDown(e) {
  if (keyCodeDirection.hasOwnProperty(e.keyCode)) {
    const direction = keyCodeDirection[e.keyCode];
    const res = game.moveDirection(direction);
    if (res) {
      swapCells(...res);
    }
  }
}

document.addEventListener('keydown', onKeyDown);
