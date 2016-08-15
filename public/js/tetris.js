"use strict";

/**
 * Represents the matrix (a playing field) of a Tetris game.
 * @constructor
 */
function Matrix() {
  this.isActiveGame = false;
  this.isPaused = false;

  this.grid = [];
  this.bag = [];
  this.currentPiece = null;
  this.heldPiece = null;
  this.holdLimit = false;
  this.activeTiles = null;
  this.ghostTiles = [];
  this.shiftUpQueue = 0;

  this.gravityID = null;
  this.pointsDisplayID = null;

  this.level = { current: 1,
                 linesUntilNext: 10};
  this.stats = { linesCleared: 0,
                 T: 0,
                 J: 0,
                 Z: 0,
                 O: 0,
                 S: 0,
                 L: 0,
                 I: 0};
  this.scores = { current: 0,
                  top: 0,
                  high: []};
  this.tetrisBonus = 1;

  this.soundEnabled = true;
  this.musicEnabled = false;
  this.scoresDatabase = new Firebase("https://dazzling-torch-1287.firebaseio.com/");

  this.PIECE_TYPES = ["T", "J", "Z", "O", "S", "L", "I"];
  this.SYMBOL_COORDS = { T: [2,3,4,7, "rgb(175,82,179)"],
                         J: [2,3,4,8, "rgb(92,86,219)"],
                         Z: [2,3,7,8, "rgb(204,51,51)"],
                         O: [2,3,6,7, "rgb(211,230,46)"],
                         S: [3,4,6,7, "rgb(37,196,88)"],
                         L: [2,3,4,6, "rgb(235,186,26)"],
                         I: [5,6,7,8, "rgb(43,196,204)"]};
  this.TOP_OFFSET = 2;
  this.NUM_COL = 10;
  this.NUM_ROW = 20;
  this.TETRIS = 4;
  this.NEXT_WINDOWS = 5;
  this.RANDOM_TETRO = 7;
  this.WINDOW_TILES = 8;
  this.HIGH_SCORES_NUM = 10;
  this.LINE_CLEAR_AUDIO = new Audio("/sound/clearline.mp3");
  this.GAME_OVER_AUDIO = new Audio("/sound/gameover.mp3");
  this.HIGH_SCORE_AUDIO = new Audio("/sound/highscore.mp3");
  this.TETRIS_THEME_AUDIO = new Audio("/sound/tetristheme.mp3");
};

/** Initializes the game. */
Matrix.prototype.start = function() {
  this.reset();
  this.resetDOM();
  this.getPieces();
  this.spawn();
  this.gravity(this.getForce(this.level.current));
  if (this.musicEnabled) {
    this.TETRIS_THEME_AUDIO.play();
  }
  this.isActiveGame = true;
};

/** Resets game values back to its original state. */
Matrix.prototype.reset = function() {
  this.isPaused = false;

  this.bag = [];
  this.currentPiece = null;
  this.heldPiece = null;
  this.holdLimit = false;
  this.activeTiles = null;
  this.ghostTiles = [];

  this.tetrisBonus = 1;
  this.gravityID = null;
  this.pointsDisplayiD = null;

  this.level = { current: 1,
                 linesUntilNext: 10};
  this.stats = { linesCleared: 0,
                 T: 0,
                 J: 0,
                 Z: 0,
                 O: 0,
                 S: 0,
                 L: 0,
                 I: 0};
  this.scores.current = 0;

  this.HIGH_SCORE_AUDIO.pause();
  this.HIGH_SCORE_AUDIO.currentTime = 0;

  for (let i = 0; i < this.grid.length; i++) {
    for (let j = 0; j < this.grid[i].length; j++) {
      this.grid[i][j].on = false;
      this.grid[i][j].color = "rgb(0, 0, 0)";
      if (this.grid[i][j].border) {
        delete this.grid[i][j].border;
      }
    }
  }
};

/** Resets the DOM back to its original state. */
Matrix.prototype.resetDOM = function() {
  this.clearNext();
  this.clearHold();

  $("#messages").text("");

  for (let i = 0; i < this.PIECE_TYPES.length; i++) {
    $(`#${this.PIECE_TYPES[i]}`).text("000");
  }

  $("#lines-counter").text("000");

  $("#score").text("000000");
  $("#level-counter").text("01");

  $("#matrix").css("display", "table");
  $("#high-scores-div").css("display", "none");
};

/** Clears the "Next Piece" windows. */
Matrix.prototype.clearNext = function() {
  for (let i = 1; i <= this.NEXT_WINDOWS; i++) {
    for (let j = 1; j <= this.WINDOW_TILES; j++) {
      $(`[data-next${i}=${j}]`).css("background-color", "rgb(0, 0, 0");
    }
  }
};

/** Clears the "Hold Piece" window. */
Matrix.prototype.clearHold = function() {
  for (let i = 1; i <= this.WINDOW_TILES; i++) {
    $(`[data-hold=${i}]`).css("background-color", "rgb(0, 0, 0)");
  }
};

/** Pauses/unpauses the game and toggles the help menu. */
Matrix.prototype.pause = function() {
  if (!this.isPaused) {
    clearInterval(this.gravityID);
    $("#messages").text("Paused");
  } else {
    this.gravity(this.getForce(this.level.current));
    $("#messages").text("");
  }
  this.toggleHelp();
  this.isPaused = !this.isPaused;
};

/** Toggle between displaying and hiding the help window. */
Matrix.prototype.toggleHelp = function() {
  if ($("#help-div").css("display") === "none") {
    $("#matrix").css("display", "none");
    $("#help-div").css("display", "block");
  } else {
    $("#matrix").css("display", "table");
    $("#help-div").css("display", "none");
  }
};

/**
 * @param {number} force - The frequency with which to move
 *     the current piece down.
 */
Matrix.prototype.gravity = function(force) {
  this.gravityID = setInterval(this.move.bind(this, "down"), force);
};

/**
 * @return {number} - Returns a value that is inversely proportional
 *     to the current level, i.e. the current piece will drop faster
 *     when this number is lower.
 */
Matrix.prototype.getForce = function(currentLevel) {
  if (currentLevel < 10) {
    return 1100 - (currentLevel * 100);
  } else if (currentLevel < 15) {
    return 350 - (currentLevel * 20);
  } else {
    return 50;
  }
};

/**
 * @param {string} type - Specifies the type of Tetromino to create.
 *     Uses its properties to update the game state of Matrix.
 */
Matrix.prototype.spawn = function(type) {
  if (this.shiftUpQueue > 0) {
    this.shiftUp(this.shiftUpQueue);
    this.shiftUpQueue = 0;
  }
  let piece = type ? new Tetromino(type)
                   : new Tetromino(this.bag.shift());
  this.currentPiece = {type: piece.type, orientation: 0};
  if (this.isGameOver()) {
    this.setGameOver();
    if (this.versus) {
      socket.emit("game-over");
    }
  }
  if (this.bag.length === this.NEXT_WINDOWS) {
    this.getPieces();
  }
  this.stats[this.currentPiece.type]++;
  this.activeTiles = [this.grid[piece.defaultPos[0][0]][piece.defaultPos[0][1]],
                      this.grid[piece.defaultPos[1][0]][piece.defaultPos[1][1]],
                      this.grid[piece.defaultPos[2][0]][piece.defaultPos[2][1]],
                      this.grid[piece.defaultPos[3][0]][piece.defaultPos[3][1]]];
  this.activeTiles.forEach(function(tile) {
    tile.on = true;
    tile.color = piece.color;
  });
  this.setGhostTiles();
  this.updateNextPieces();
  this.render();

  let pieceCount = this.zeroPad(this.stats[this.currentPiece.type], 3);
  $(`#${this.currentPiece.type}`).text(pieceCount);
};

Matrix.prototype.setGhostTiles = function() {
  for (let i = 0; i < this.ghostTiles.length; i++) {
    delete this.ghostTiles[i].border;
  }

  this.ghostTiles = this.findBottom(this.activeTiles);

  for (let i = 0; i < this.ghostTiles.length; i++) {
    this.ghostTiles[i].border = this.activeTiles[i].color;
  }
};

Matrix.prototype.findBottom = function(tiles) {
  let ghostTiles = []
  for (let i = 0; i < tiles.length; i++) {
    ghostTiles.push(tiles[i]);
  }
  while (!this.collision(ghostTiles, "down")) {
    for (let i = 0; i < ghostTiles.length; i++) {
      ghostTiles[i] = this.find(ghostTiles[i], "down");
    }
  }
  return ghostTiles;
};

/**
 * @return {boolean} - Whether spawn tries to create a piece
 *     over an occupied tile.
 */
Matrix.prototype.isGameOver = function() {
  switch (this.currentPiece.type) {
    case "T":
    if (this.grid[2][4].on || this.grid[2][5].on || this.grid[2][6].on || this.grid[3][5].on) {
      return true;
    }
    break;
    case "J":
    if (this.grid[2][4].on || this.grid[2][5].on || this.grid[2][6].on || this.grid[3][6].on) {
      return true;
    }
    break;
    case "Z":
    if (this.grid[2][4].on || this.grid[2][5].on || this.grid[3][5].on || this.grid[3][6].on) {
      return true;
    }
    break;
    case "O":
    if (this.grid[2][4].on || this.grid[2][5].on || this.grid[3][4].on || this.grid[3][5].on) {
      return true;
    }
    break;
    case "S":
    if (this.grid[2][5].on || this.grid[2][6].on || this.grid[3][4].on || this.grid[3][5].on) {
      return true;
    }
    break;
    case "L":
    if (this.grid[2][4].on || this.grid[2][5].on || this.grid[2][6].on || this.grid[3][4].on) {
      return true;
    }
    break;
    case "I":
    if (this.grid[2][3].on || this.grid[2][4].on || this.grid[2][5].on || this.grid[2][6].on) {
      return true;
    }
    break;
  }
  return false;
};

/**
 * Halts the game, checks the current score against the top ten
 *     scores, and displays the high score screen.
 */
Matrix.prototype.setGameOver = function() {
  this.isActiveGame = false;
  clearInterval(this.gravityID);

  this.TETRIS_THEME_AUDIO.pause();
  this.TETRIS_THEME_AUDIO.currentTime = 0;

  if (this.soundEnabled) {
    this.GAME_OVER_AUDIO.play();
  }

  this.sortHighScores();
  if (this.isTopTen()) {
    this.enterName();
  } else {
    this.updateHighScores();
    setTimeout(this.displayHighScores.bind(this), 3000);
  }
};

/**
 * Displays high scores and plays accompanying high score music.
 */
Matrix.prototype.displayHighScores = function() {
  if (this.soundEnabled) {
    this.HIGH_SCORE_AUDIO.play();
    this.TETRIS_THEME_AUDIO.pause();
    this.TETRIS_THEME_AUDIO.currentTime = 0;
  }

  $("#matrix").css("display", "none");
  $("#high-scores-div").css("display", "block");
  $("#messages").text("Game over! Press enter to play again.");
};

/**
 * @return {boolean} - Whether the user's current score is
 *     in the all-time top ten.
 */
Matrix.prototype.isTopTen = function() {
  for (let i = 0; i < 10; i++) {
    if (!this.scores.high[i] || this.scores.current > this.scores.high[i].score) {
      return true;
    }
  }
  return false;
};

/** Prompts player for initials (in conjunction with isTopTen method). */
Matrix.prototype.enterName = function() {
  $("#matrix").css("display", "none");
  $("#entry-div").css("display", "block");
};

/** Updates scores in firebase */
Matrix.prototype.addNewHighScore = function(name) {
  this.scoresDatabase.push({initials: name, score: this.scores.current});
};

/** Displays high scores. */
Matrix.prototype.updateHighScores = function() {
  this.sortHighScores();
  for (let i = 0; i < this.scores.high.length; i++) {
    $(`#initials-${i}`).text(this.scores.high[i].initials);
    $(`#score-${i}`).text(this.zeroPad(this.scores.high[i].score, 6));
  }
};

/** Sorts high scores. */
Matrix.prototype.sortHighScores = function() {
  this.scores.high.sort(function(a, b) {
    return b.score - a.score;
  });
};

/**
 * Takes a "bag" consisting of 3 of each type of tetrominos
 *     and an additional 7 random tetrominoes (28 total), and
 *     shuffles them into Matrix's bag property.
 */
Matrix.prototype.getPieces = function() {
  let newBag = ["T","T","T",
                "J","J","J",
                "Z","Z","Z",
                "O","O","O",
                "S","S","S",
                "L","L","L",
                "I","I","I"];
  for (let i = 0; i < this.RANDOM_TETRO; i++) {
    newBag.push(this.PIECE_TYPES[Math.floor(Math.random() * this.PIECE_TYPES.length)]);
  }
  while (newBag.length > 0) {
    let random = Math.floor(Math.random() * newBag.length);
    this.bag.push(newBag.splice(random, 1)[0]);
  }
};

/**
 * @param {string} dir - Specifies a direction to move in
 *     ("left", "down", or "right").
 */
Matrix.prototype.move = function(dir) {
  if (!this.isActiveGame || this.isPaused) {
    return;
  }
  if (this.collision(this.activeTiles, dir)) {
    if (dir === "down") {
      this.lineClear();
      this.spawn();
      this.holdLimit = false;
    }
    return;
  }

  let savedColor = this.activeTiles[0].color;
  let newActiveTiles = [];
  for (let i = 0; i < this.activeTiles.length; i++) {
    newActiveTiles.push(this.find(this.activeTiles[i], dir));
  }
  for (let i = 0; i < this.activeTiles.length; i++) {
    this.activeTiles[i].on = false;
    this.activeTiles[i].color = "rgb(0, 0, 0)";
  }
  for (let i = 0; i < newActiveTiles.length; i++) {
    newActiveTiles[i].on = true;
    newActiveTiles[i].color = savedColor;
  }
  this.activeTiles = newActiveTiles;
  this.setGhostTiles();
  this.render();
};

/**
 * Instantly moves the current piece to the bottommost
 * valid location on the matrix.
 */
Matrix.prototype.drop = function() {
  if (!this.isActiveGame || this.isPaused) {
    return;
  }
  let points =  22 - this.activeTiles[0].coord[0];
  if (this.activeTiles.some((tile) => {
    return this.ghostTiles.indexOf(tile) > -1;
  })) {
    while (!this.collision(this.activeTiles, "down")) {
      this.move("down");
    }
  } else {
    for (let i = 0; i < this.activeTiles.length; i++) {
      this.transfer(this.activeTiles[i], this.ghostTiles[i]);
    }
  }
  this.move("down");
  this.scores.current += points;
  this.updatePointsDisplay();
};

/**
 * @param {string} dir - Rotates the current piece clockwise or,
 *     if specified, counterclockwise (ccw not yet implemented).
 */
Matrix.prototype.rotate = function(dir) {
  if (!this.isActiveGame || this.isPaused) {
    return;
  }
  let y0 = this.activeTiles[0].coord[0];
  let x0 = this.activeTiles[0].coord[1];
  let y1 = this.activeTiles[1].coord[0];
  let x1 = this.activeTiles[1].coord[1];
  let y2 = this.activeTiles[2].coord[0];
  let x2 = this.activeTiles[2].coord[1];
  let y3 = this.activeTiles[3].coord[0];
  let x3 = this.activeTiles[3].coord[1];
  switch (this.currentPiece.type) {
    case "T":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y0-1] || this.grid[y0-1][x0+1].on) {
        let newTile0 = this.grid[y0][x0+1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2+2][x2-1];
        let newTile3 = this.grid[y3][x3-1];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile0 = this.grid[y0-1][x0+1];
        let newTile2 = this.grid[y2+1][x2-1];
        let newTile3 = this.grid[y3-1][x3-1];
        if (!newTile0.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y0+1][x0+1]) {
        let newTile0 = this.grid[y0+1][x0+1];
        let newTile2 = this.grid[y2-1][x2-1];
        let newTile3 = this.grid[y3-1][x3+1];
        if (!newTile0.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y0+1]) {
        let newTile0 = this.grid[y0+1][x0-1];
        let newTile2 = this.grid[y2-1][x2+1];
        let newTile3 = this.grid[y3+1][x3+1];
        if (!newTile0.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y0-1][x0-1]) {
        let newTile0 = this.grid[y0-1][x0-1];
        let newTile2 = this.grid[y2+1][x2+1];
        let newTile3 = this.grid[y3+1][x3-1];
        if (!newTile0.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;

    case "J":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y0-1] || this.grid[y0-1][x0+1].on) {
        let newTile0 = this.grid[y0][x0+1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2+2][x2-1];
        let newTile3 = this.grid[y3+1][x3-2];
        if (!newTile1.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile0 = this.grid[y0-1][x0+1];
        let newTile2 = this.grid[y2+1][x2-1];
        let newTile3 = this.grid[y3][x3-2];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y0+1][x0+1]) {
        let newTile0 = this.grid[y0+1][x0+1];
        let newTile2 = this.grid[y2-1][x2-1];
        let newTile3 = this.grid[y3-2][x3];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y0+1]) {
        let newTile0 = this.grid[y0+1][x0-1];
        let newTile2 = this.grid[y2-1][x2+1];
        let newTile3 = this.grid[y3][x3+2];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y0-1][x0-1]) {
        let newTile0 = this.grid[y0-1][x0-1];
        let newTile2 = this.grid[y2+1][x2+1];
        let newTile3 = this.grid[y3+2][x3];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;

    case "Z":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y0-1] || this.grid[y0-1][x0+1].on) {
        let newTile0 = this.grid[y0][x0+1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2][x2-1];
        let newTile3 = this.grid[y3+1][x3-2];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile0 = this.grid[y0-1][x0+1];
        let newTile2 = this.grid[y2-1][x2-1];
        let newTile3 = this.grid[y3][x3-2];
        if (!newTile0.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y0+1][x0+1]) {
        let newTile0 = this.grid[y0+1][x0+1];
        let newTile2 = this.grid[y2-1][x2+1];
        let newTile3 = this.grid[y3-2][x3];
        if (!newTile0.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y0+1]) {
        let newTile0 = this.grid[y0+1][x0-1];
        let newTile2 = this.grid[y2+1][x2+1];
        let newTile3 = this.grid[y3][x3+2];
        if (!newTile0.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y0-1][x0-1]) {
        let newTile0 = this.grid[y0-1][x0-1];
        let newTile2 = this.grid[y2+1][x2-1];
        let newTile3 = this.grid[y3+2][x3];
        if (!newTile0.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;

    case "O":
    break;

    case "S":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y2-2] || this.grid[y2-2][x2].on) {
        let newTile0 = this.grid[y0+1][x0];
        let newTile1 = this.grid[y1+2][x1-1];
        let newTile2 = this.grid[y2-1][x2];
        let newTile3 = this.grid[y3][x3-1];
        if (!newTile1.on && !newTile2.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile1 = this.grid[y1+1][x1-1];
        let newTile2 = this.grid[y2-2][x2];
        let newTile3 = this.grid[y3-1][x3-1];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[1], newTile1);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y2][x2+2]) {
        let newTile1 = this.grid[y1-1][x1-1];
        let newTile2 = this.grid[y2][x2+2];
        let newTile3 = this.grid[y3-1][x3+1];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[1], newTile1);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y2+2]) {
        let newTile1 = this.grid[y1-1][x1+1];
        let newTile2 = this.grid[y2+2][x2];
        let newTile3 = this.grid[y3+1][x3+1];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[1], newTile1);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y2][x2-2]) {
        let newTile1 = this.grid[y1+1][x1+1];
        let newTile2 = this.grid[y2][x2-2];
        let newTile3 = this.grid[y3+1][x3-1];
        if (!newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[1], newTile1);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;

    case "L":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y0-1] || this.grid[y0-1][x0+1].on) {
        let newTile0 = this.grid[y0][x0+1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2+2][x2-1];
        let newTile3 = this.grid[y3-1][x3];
        if (!newTile1.on && !newTile2.on) {
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile0 = this.grid[y0-1][x0+1];
        let newTile2 = this.grid[y2+1][x2-1];
        let newTile3 = this.grid[y3-2][x3];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y0+1][x0+1]) {
        let newTile0 = this.grid[y0+1][x0+1];
        let newTile2 = this.grid[y2-1][x2-1];
        let newTile3 = this.grid[y3][x3+2];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y0+1]) {
        let newTile0 = this.grid[y0+1][x0-1];
        let newTile2 = this.grid[y2-1][x2+1];
        let newTile3 = this.grid[y3+2][x3];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y0-1][x0-1]) {
        let newTile0 = this.grid[y0-1][x0-1];
        let newTile2 = this.grid[y2+1][x2+1];
        let newTile3 = this.grid[y3][x3-2];
        if (!newTile0.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;

    case "I":
    switch (this.currentPiece.orientation) {
      case 0:
      if (!this.grid[y0-2] || this.grid[y0-2][x0+1].on) {
        let newTile0 = this.grid[y0][x0+1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2+2][x2-1];
        let newTile3 = this.grid[y3+3][x3-2];
        if (!newTile1.on && !newTile2.on && !newTile3.on) {
          this.transfer(this.activeTiles[3], newTile3);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[0], newTile0);
          this.currentPiece.orientation++;
        }
      } else {
        let newTile0 = this.grid[y0-2][x0+1];
        let newTile1 = this.grid[y1-1][x1];
        let newTile2 = this.grid[y2][x2-1];
        let newTile3 = this.grid[y3+1][x3-2];
        if (!newTile0.on && !newTile1.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 1:
      if (this.grid[y0+1][x0+2] && this.grid[y3-2][x3-1]) {
        let newTile0 = this.grid[y0+1][x0+2];
        let newTile1 = this.grid[y1][x1+1];
        let newTile2 = this.grid[y2-1][x2];
        let newTile3 = this.grid[y3-2][x3-1];
        if (!newTile0.on && !newTile1.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 2:
      if (this.grid[y0+2]) {
        let newTile0 = this.grid[y0+2][x0-1];
        let newTile1 = this.grid[y1+1][x1];
        let newTile2 = this.grid[y2][x2+1];
        let newTile3 = this.grid[y3-1][x3+2];
        if (!newTile0.on && !newTile1.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation++;
        }
      }
      break;
      case 3:
      if (this.grid[y0-1][x0-2] && this.grid[y3+2][x3+1]) {
        let newTile0 = this.grid[y0-1][x0-2];
        let newTile1 = this.grid[y1][x1-1];
        let newTile2 = this.grid[y2+1 ][x2];
        let newTile3 = this.grid[y3+2][x3+1];
        if (!newTile0.on && !newTile1.on && !newTile3.on) {
          this.transfer(this.activeTiles[0], newTile0);
          this.transfer(this.activeTiles[1], newTile1);
          this.transfer(this.activeTiles[2], newTile2);
          this.transfer(this.activeTiles[3], newTile3);
          this.currentPiece.orientation = 0;
        }
      }
      break;
    }
    break;
  }
  this.setGhostTiles();
  this.render();
};

/**
 * @param {Tile} oldTile - The tile giving away its properties.
 * @param {Tile} newTile - The tile receiving oldTile's
 *     properties: "on" and "color".
 */
Matrix.prototype.transfer = function(oldTile, newTile) {
  newTile.on = oldTile.on;
  newTile.color = oldTile.color;
  oldTile.on = false;
  oldTile.color = "rgb(0, 0, 0)";
  for (let i = 0; i < this.activeTiles.length; i++) {
    if (this.activeTiles[i] === oldTile) {
      this.activeTiles[i] = newTile;
    }
  }
};

/** Saves current piece or retrieves held piece if any. */
Matrix.prototype.hold = function() {
  if (!this.isActiveGame || this.isPaused || this.holdLimit === true) {
    return;
  }
  if (this.heldPiece) {
    let temp = this.heldPiece;
    this.heldPiece = this.currentPiece.type;
    this.activeTiles.forEach(function(tile) {
      tile.on = false;
      tile.color = "rgb(0, 0, 0)";
    })
    this.spawn(temp);
  } else {
    this.heldPiece = this.currentPiece.type;
    this.activeTiles.forEach(function(tile) {
      tile.on = false;
      tile.color = "rgb(0, 0, 0)";
    })
    this.spawn();
  }
  this.clearHold();
  for (let i = 0; i < 4; i++) {
    let coord = this.SYMBOL_COORDS[this.heldPiece];
    $(`[data-hold=${coord[i]}]`).css("background-color", coord[4]);
  }
  this.holdLimit = true;
};

/**
 * @param {Tile} tile - Specifies the tile to search from.
 * @param {string} dir - Specifies the direction to search relative
 *     to the coordinates of the specified tile.
 * @return {Tile} - A new tile adjacent to the given tile, or undefined.
 */
Matrix.prototype.find = function(tile, dir) {
  let y = tile.coord[0];
  let x = tile.coord[1];
  if (dir === "up") {
    return this.grid[y-1] ? this.grid[y-1][x] : undefined;
  } else if (dir === "right") {
    return this.grid[y][x+1];
  } else if (dir === "down") {
    return this.grid[y+1] ? this.grid[y+1][x] : undefined;
  } else if (dir === "left") {
    return this.grid[y][x-1];
  }
};

/**
 * @param {Tile} tiles - Specifies a set of tiles to check for collision.
 * @param {string} dir - Specifies a direction to search.
 * @return {boolean} - Whether all tiles in the set can move one unit
 *     in dir.
 */
Matrix.prototype.collision = function(tiles, dir) {
  for (let i = 0; i < tiles.length; i++) {
    let newTile = this.find(tiles[i], dir);
    if (tiles.indexOf(newTile) === -1 && (newTile === undefined || newTile.on === true)) {
      return true;
    }
  }
  return false;
};

/**
 * Performs the necessary actions when a line is cleared:
 *     Searches the matrix for cleared lines to animate, shifts
 *     the appropriate lines down, and updates points.
 */
Matrix.prototype.lineClear = function() {
  let linesCleared = 0;
  let rowsToAnimate = [];
  for (let i = this.TOP_OFFSET; i < this.grid.length; i++) {
    if (this.isFilledRow(this.grid[i])) {
      rowsToAnimate.push(this.grid[i]);
    }
  }
  for (let i = 0; i < rowsToAnimate.length; i++) {
    this.animateClear(rowsToAnimate[i]);
  }
  linesCleared = this.shiftDown();

  if (linesCleared < this.TETRIS) {
    this.tetrisBonus = 1;
  }
  if (linesCleared > 0) {
    this.updatePoints(linesCleared);
    if (linesCleared > 1 && this.versus) {
      socket.emit("send-lines", linesCleared);
    }
  }
};

/**
 * Finds a cleared line and shifts all rows above it down one tile.
 * @return {number} - The number of cleared lines found.
 */
Matrix.prototype.shiftDown = function() {
  let linesCleared = 0;
  for (let i = this.grid.length - 1; i >= 0; i--) {
    if (this.isFilledRow(this.grid[i])) {
      for (let j = i - 1; j >= 0; j--) {
        for (let k = 0; k < this.grid[j].length; k++) {
          let oldTile = this.grid[j][k];
          let newTile = this.find(oldTile, "down");
          this.transfer(oldTile, newTile);
        }
      }
      linesCleared++;
      i++;
    }
  }
  return linesCleared;
};

/**
 * @param {array} row - This array of Tile cells will specify the
 *     corresponding <td> to give the clear animation.
 */
Matrix.prototype.animateClear = function(row) {
  for (let i = 0; i < row.length; i++) {
    $(`.tile-container[data-coord='${row[i].coord[0]},${row[i].coord[1]}']`).addClass("clear");
    setTimeout(function() {
      $(`.tile-container[data-coord='${row[i].coord[0]},${row[i].coord[1]}']`).removeClass("clear");
    }, 300);
  }
};

/**
 * @return {boolean} - Whether every tile on a row is occupied.
 */
Matrix.prototype.isFilledRow = function(row) {
  return row.every(function(tile) {
    return tile.on;
  })
};

/**
 * Awards player points based on lines scored, current level,
 *     and any Tetris Bonuses.
 * @param {number} lines - Specifies the number of lines (1-4)
 *     to award points for.
 */
Matrix.prototype.updatePoints = function(lines) {
  let points = Math.pow(lines, 2) * this.level.current * 100;

  if (this.soundEnabled) {
    this.LINE_CLEAR_AUDIO.play();
  }

  let pointsDisplay = ""
  if (this.tetrisBonus > 1) {
    points *= Math.pow(this.tetrisBonus, 2);
    pointsDisplay += `${this.tetrisBonus}x Tetris! `;
  }
  pointsDisplay += points + " points!";
  $("#messages").text(pointsDisplay);
  clearTimeout(this.pointsDisplayID);
  this.pointsDisplayID = setTimeout(function() {
    $("#messages").text("");
  }, 3000);

  if (lines === this.TETRIS) {
    this.tetrisBonus++;
  }

  this.scores.current += points;
  this.stats.linesCleared += lines;
  this.updatePointsDisplay();
  this.updateLines(lines);
};

/** Modifies the DOM points display. */
Matrix.prototype.updatePointsDisplay = function() {
  let pointsCount = this.zeroPad(this.scores.current, 6);
  $("#score").text(pointsCount);
  if (this.scores.current >= this.scores.top) {
    this.scores.top = this.scores.current;
    $("#top").text(pointsCount);
  }
};

/**
 * Modifies the DOM lines display and calls update
 *     level when user has cleared 10 lines.
 */
Matrix.prototype.updateLines = function(lines) {
  let linesCount = this.zeroPad(this.stats.linesCleared, 3);
  $("#lines-counter").text(linesCount);
  this.level.linesUntilNext -= lines;
  if (this.level.linesUntilNext < 1) {
    this.updateLevel();
  }
};

/**
 * Modifies the DOM level display and requires
 *     10 new lines for next level.
 */
Matrix.prototype.updateLevel = function() {
  this.level.current++;
  this.level.linesUntilNext += 10;
  clearInterval(this.gravityID);
  this.gravity(this.getForce(this.level.current));
  let levelCount = this.zeroPad(this.level.current, 2);
  $("#level-counter").text(levelCount);
};

/** Clears and updates "Next Piece" windows. */
Matrix.prototype.updateNextPieces = function() {
  this.clearNext();

  for (let i = 0; i < this.NEXT_WINDOWS; i++) {
    let currentPiece = this.bag[i];
    for (let j = 0; j < 4; j++) {
      let coord = this.SYMBOL_COORDS[currentPiece];
      $(`[data-next${i+1}=${coord[j]}]`).css("background-color", coord[4]);
    }
  }
};

/** Loops through entire matrix and updates each tile's current color. */
Matrix.prototype.render = function() {
  for (let i = 0; i < this.grid.length; i++) {
    this.grid[i].forEach(function(tile) {
      let domTile = $(`.tile-container[data-coord='${tile.coord[0]},${tile.coord[1]}']`);
      domTile.css("background-color", tile.color);
      if (tile.border) {
        let boxShadowProps = `inset 0 0 1em ${tile.border}`;
        domTile.css("box-shadow", boxShadowProps);
      } else {
        domTile.css("box-shadow", "");
      }
    });
  }
  if (this.versus) {
    socket.emit("matrix-data", this.grid.slice(2));
  }
};

Matrix.prototype.miniRender = function(grid) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let tile = grid[i][j];
      let domTile = $(`.mini-tile[data-coord='${tile.coord[0]-2},${tile.coord[1]}']`);
      domTile.css("background-color", tile.color);
    }
  }
}

Matrix.prototype.shiftUp = function(n) {
  for (let y = 0; y < this.grid.length; y++) {
    for (let x = 0; x < this.grid[y].length; x++) {
      let tile = this.grid[y][x];
      tile.coord[0] = tile.coord[0] - n;
    }
  }
  let newRows = [];
  let y = 21;
  let randomGap = Math.floor(Math.random() * 10);
  for (let i = 0; i < n; i++) {
    let row = [];
    for (let x = 0; x < this.NUM_COL; x++) {
      let tile;
      if (x === randomGap) {
        tile = new Tile(false, [y, x], "rgb(0, 0, 0)");
      } else {
        tile = new Tile(true, [y, x], "rgb(100, 100, 100)");
      }
      row.push(tile);
    }
    y--;
    newRows.unshift(row);
  }
  this.grid = this.grid.slice(n).concat(newRows);
};

/**
 * The zeroPad function was borrowed and modified from Eloquent Javascript:
 *     Source: http://eloquentjavascript.net/03_functions.html#c_BF/ji546Xh
 * @param {number} num - Specifies the number to prepend zero's to.
 * @param {number} length - Specifies the desired length of the return string.
 * @return {string} - Returns a string with zeros prepended.
 */
Matrix.prototype.zeroPad = function(num, length) {
  let str = num.toString();
  while (str.length < length)
    str = "0" + str;
  return str;
};

/**
 * Represents a Tetromino, consists of 4 tiles.
 * @param {string} type Specifies the type of tetromino to
 *     create.
 * @constructor
 */
function Tetromino(type) {
  this.type = type;
  switch (this.type) {
    case "T":
    this.defaultPos = [[2,4],[2,5],[2,6],[3,5]];
    this.color = "rgb(175,82,179)";
    break;
    case "J":
    this.defaultPos = [[2,4],[2,5],[2,6],[3,6]];
    this.color = "rgb(92,86,219)";
    break;
    case "Z":
    this.defaultPos = [[2,4],[2,5],[3,5],[3,6]];
    this.color = "rgb(204,51,51)";
    break;
    case "O":
    this.defaultPos = [[2,4],[2,5],[3,4],[3,5]];
    this.color = "rgb(211,230,46)";
    break;
    case "S":
    this.defaultPos = [[2,5],[2,6],[3,4],[3,5]];
    this.color = "rgb(37,196,88)";
    break;
    case "L":
    this.defaultPos = [[2,4],[2,5],[2,6],[3,4]];
    this.color = "rgb(235,186,26)";
    break;
    case "I":
    this.defaultPos = [[2,3],[2,4],[2,5],[2,6]];
    this.color = "rgb(43,196,204)";
    break;
  }
}

/**
 * Represents an individual tile in a Matrix's grid.
 * @param {boolean} - Whether the tile is occupied or not.
 * @param {string} - The coordinate location of the tile.
 * @param {string} - The color of the tile.
 * @constructor
 */
function Tile(on, coord, color) {
  this.on = on;
  this.coord = coord;
  this.color = color;
}
