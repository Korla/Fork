const boardSvg = document.getElementById('board');
if (boardSvg) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let r = 1; r <= ROWS; r++) {
    for (let c = COL_MIN; c <= COL_MAX; c++) {
      if (!isValidCell(r, c)) continue;
      const { x, y } = cellToPixel(r, c);
      minX = Math.min(minX, x - HEX_SIZE * 1.1);
      maxX = Math.max(maxX, x + HEX_SIZE * 1.1);
      minY = Math.min(minY, y - HEX_SIZE * 1.1);
      maxY = Math.max(maxY, y + HEX_SIZE * 1.1);
    }
  }
  boardSvg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
}

// Initial update/render
updateStatus();
renderBoard();
