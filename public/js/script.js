let matrix = new Matrix();
$("#matrix-td").append("<table id='matrix'>");
for (let i = 0; i < matrix.NUM_ROW + matrix.TOP_OFFSET; i++) {
  let row = [];
  let tr = $("<tr>");
  for (let j = 0; j < matrix.NUM_COL; j++) {
    let coord = [];
    coord[0] = i;
    coord[1] = j;
    let tile = new Tile(false, coord, "rgb(0, 0, 0)");
    row.push(tile);
    let td = $(`<td class="tile-container" data-coord=${i},${j}>`);
    tr.append(td);
  }
  matrix.grid.push(row);
  $("#matrix").append(tr);
}

let matrixWidth = $("#matrix").width();
let matrixHeight = $("#matrix").height();
$("#help-div").css("width", matrixWidth);
$("#help-div").css("height", matrixHeight);
$("#help-table").css("width", matrixWidth);
$("#high-scores-div").css("width", matrixWidth);
$("#high-scores-div").css("height", matrixHeight);
$("#high-scores-table").css("width", matrixWidth);
$("#entry-div").css("width", matrixWidth);
$("#entry-div").css("height", matrixHeight);
$("#lines-counter-div").css("width", matrixWidth);

matrix.TETRIS_THEME_AUDIO.addEventListener('ended', function() {
  this.currentTime = 0;
  this.play()
}, false);

$("#music-icon").on("click", function() {
  if (!matrix.HIGH_SCORE_AUDIO.paused) {
    matrix.HIGH_SCORE_AUDIO.pause();
  }
  if (matrix.musicEnabled) {
    matrix.TETRIS_THEME_AUDIO.pause();
  } else {
    matrix.TETRIS_THEME_AUDIO.currentTime = 0;
    matrix.TETRIS_THEME_AUDIO.play();
  }
  $(this).toggleClass("active");
  matrix.musicEnabled = !matrix.musicEnabled;
});

$("#sound-icon").on("click", function() {
  $(this).toggleClass("active");
  matrix.soundEnabled = !matrix.soundEnabled;
})

matrix.scoresDatabase.on("child_added", function(snapshot) {
  matrix.scores.high.push(snapshot.val());
});

$("body").on("keydown", function(e) {
  if (e.which === 13) {
    if (!matrix.isActiveGame && !matrix.versus) {
      if ($("#help-div").css("display") === "block") {
        $("#help-div").css("display", "none");
      }
      clearInterval(colorScrollID);
      matrix.start();
    }
  } else if (e.which === 27) {
    if (matrix.isActiveGame && !matrix.versus) {
      matrix.pause();
    }
  }
});

$(".key").on("click", function() {
  if ($("#initial-1").hasClass("blink")) {
    $("#initial-1").text($(this).text());
    $("#initial-1").removeClass("blink");
    $("#initial-2").addClass("blink");
  } else if ($("#initial-2").hasClass("blink")) {
    $("#initial-2").text($(this).text());
    $("#initial-2").removeClass("blink");
    $("#initial-3").addClass("blink");
  } else if ($("#initial-3").hasClass("blink")) {
    $("#initial-3").text($(this).text());
    $("#initial-3").removeClass("blink");
  }
});

$("#backspace-key").on("click", function() {
  if ($("#initial-3").text() !== "_") {
    $("#initial-3").text("_");
    $("#initial-3").addClass("blink");
  } else if ($("#initial-2").text() !== "_") {
    $("#initial-2").text("_");
    $("#initial-2").addClass("blink");
    $("#initial-3").removeClass("blink");
  } else if ($("#initial-1").text() !== "_") {
    $("#initial-1").text("_");
    $("#initial-1").addClass("blink");
    $("#initial-2").removeClass("blink");
  }
});

$("#name-submit").on("click", function() {
  let initials = $("#initial-1").text() + $("#initial-2").text() + $("#initial-3").text();
  if (initials.indexOf("_") === -1) {
    $("#entry-div").css("display", "none");
    matrix.addNewHighScore(initials);
    matrix.updateHighScores();
    matrix.displayHighScores();
  }
});

let keyState = {};
$("body").on("keydown", function(e) {
  keyState[e.which] = true;
});
$("body").on("keyup", function(e) {
  keyState[e.which] = false;
});
function keyLoop() {
  // if (keyState[37]) {
  //   matrix.move("left");
  // }
  // if (keyState[39]) {
  //   matrix.move("right");
  // }
  if (keyState[40]) {
    matrix.move("down");
  }
  // if (keyState[83]) {
  //   matrix.hold();
  // }
  setTimeout(keyLoop, 50);
}
keyLoop();

$("body").on("keydown", function(e) {
  if (e.which === 16) {
    matrix.hold();
  } else if (e.which === 32) {
    matrix.drop();
  } else if (e.which === 37) {
    matrix.move("left");
  } else if (e.which === 38) {
    matrix.rotate();
  } else if (e.which === 39) {
    matrix.move("right");
  } else if (e.which === 90) {
    matrix.rotate("ccw");
  }
});

let colorScroll = function() {
  let letters = $("#header").children();
  for (let i = 0; i < letters.length; i++) {
    switch (letters[i].className) {
      case "purple":
      letters[i].className = "blue";
      break;
      case "blue":
      letters[i].className = "red";
      break;
      case "red":
      letters[i].className = "yellow";
      break;
      case "yellow":
      letters[i].className = "green";
      break;
      case "green":
      letters[i].className = "orange";
      break;
      case "orange":
      letters[i].className = "cyan";
      break;
      case "cyan":
      letters[i].className = "purple";
      break;
    }
  }
}
let colorScrollID = setInterval(colorScroll, 200);

// prevent browser scrolling when game is bigger than window size
window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);
