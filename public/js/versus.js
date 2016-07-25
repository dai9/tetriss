let socket = io();
socket.emit("join-room", window.location.pathname.split("/")[2]);
matrix.versus = true;

socket.on("full-room", function() {
  console.log("room is already full");
});

socket.on("matrix-data", function(grid) {
  matrix.miniRender(grid);
});

socket.on("game-start", function() {
  matrix.start();
});

socket.on("send-lines", function(n) {
  matrix.shiftUp(n);
});

socket.on("game-over", function() {
  clearInterval(matrix.gravityID);
});

for (let i = 0; i < matrix.NUM_ROW; i++) {
  let tr = $("<tr>");
  for (let j = 0; j < matrix.NUM_COL; j++) {
    let td = $(`<td class="mini-tile" data-coord=${i},${j}>`);
    tr.append(td);
  }
  $("#mini-matrix-tbody").append(tr);
}
