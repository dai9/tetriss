let socket = io();
let key = window.location.pathname.split("/")[2]
socket.emit("join-room", key);
matrix.versus = true;

socket.on("full-room", function() {
  console.log("room is full");
});

socket.on("matrix-data", function(grid) {
  matrix.miniRender(grid);
});

socket.on("enough-players", function() {
  $(".key-form").css("display", "none");
  $("#ready-btn").css("background-color", "rgba(0, 128, 0, 1)").removeAttr("disabled");
});

socket.on("not-enough-players", function() {
  $("#ready-btn").css("background-color", "rgba(255, 0, 0, 1)").attr("disabled", true);
});

socket.on("send-lines", function(n) {
  matrix.shiftUpQueue += n;
});

socket.on("game-over", function() {
  console.log("game over hit");
  clearInterval(matrix.gravityID);
});

socket.on("game-start", function() {
  $("#ready-btn").css("background-color", "rgba(255, 0, 0, 1)").attr("disabled", true);
  matrix.start();
});

$("#ready-btn").on("click", function() {
  if ($(this).data("ready")) {
    socket.emit("cancel-ready", !$(this).data("ready"));
    $("#ready-btn").css("background-color", "rgba(0, 128, 0, 1)");
  } else {
    socket.emit("ready", !$(this).data("ready"));
    $("#ready-btn").css("background-color", "rgba(0, 0, 255, 1)");
  }
  $(this).data("ready", !$(this).data("ready"));
});

for (let i = 0; i < matrix.NUM_ROW; i++) {
  let tr = $("<tr>");
  for (let j = 0; j < matrix.NUM_COL; j++) {
    let td = $(`<td class="mini-tile" data-coord=${i},${j}>`);
    tr.append(td);
  }
  $("#mini-matrix-tbody").append(tr);
}
