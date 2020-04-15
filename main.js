

class Game extends Array {
  constructor(w, h) {
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
    return this._xy(pos);
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
  moveDirection(dir) {
    switch (dir) {
      case 'up': 
      case 'bottom':
      case 'right':
      case 'left':
      default: {
        throw new Error(`unknwon move direction: ${dir}`);
      }
    }
  }

  /**
    * return [pos, newPos] of new cell if cell with given position has empty adjacent cell
    * or return undefined if move can not be done
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

    console.log(adjacentPositions);

    const [newPos] = adjacentPositions
      .filter(pos => this[pos] === 0);     // leave only one with empty cell
    
    console.log(newPos);

    // newPos contains zero value === empty cell
    if (newPos !== undefined) {
      // swap values
      [this[newPos], this[pos]] = [this[pos], this[newPos]];
      // return
      return [pos, newPos];
    }
  }
}

const game = new Game(4, 4).shuffle();
console.log(''+game);


const gameContainer = document.querySelector('#game-container');


