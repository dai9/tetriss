let socket = io();
let key = window.location.pathname.split("/")[2]
matrix.versus = true;
socket.emit("joined-room", key);

socket.on("joined-room", function() {
  $(".chat-ol").append($(`<li>You have joined the game.</li>`));
});

socket.on("opponent-joined", function() {
  $(".chat-ol").append($(`<li>Opponent has joined the game.</li>`));
});

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

socket.on("receive-message", function(msg) {
  $(".chat-ol").append($(`<li>Opponent: ${msg}</li>`));
  $('.chat-ol').scrollTop($('.chat-ol').prop("scrollHeight"));
});

$("#ready-btn").on("click", function(e) {
  e.preventDefault();
  if ($(this).data("ready")) {
    socket.emit("cancel-ready", !$(this).data("ready"));
    $("#ready-btn").css("background-color", "rgba(0, 128, 0, 1)");
  } else {
    socket.emit("ready", !$(this).data("ready"));
    $("#ready-btn").css("background-color", "rgba(0, 0, 255, 1)");
  }
  $(this).data("ready", !$(this).data("ready"));
});

$(".send-msg").on("click submit", function(e) {
  e.preventDefault();
  var msg = $(".chat-input").val();
  if (msg.length > 0) {
    $(".chat-ol").append($(`<li>You: ${msg}</li>`));
    socket.emit("send-message", msg);
    $(".chat-input").val("");
  }
  $('.chat-ol').scrollTop($('.chat-ol').prop("scrollHeight"));
});

for (let i = 0; i < matrix.NUM_ROW; i++) {
  let tr = $("<tr>");
  for (let j = 0; j < matrix.NUM_COL; j++) {
    let td = $(`<td class="mini-tile" data-coord=${i},${j}>`);
    tr.append(td);
  }
  $("#mini-matrix-tbody").append(tr);
}
