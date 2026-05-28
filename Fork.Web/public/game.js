const boardSvg = document.getElementById('board');
if (boardSvg) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let r = 1; r <= ROWS; r++) {
    for (let c = COL_MIN; c <= COL_MAX; c++) {
      if (!isValidCell(r, c)) continue;
      const { x, y } = cellToPixel(r, c);
      minX = Math.min(minX, x - HEX_SIZE);
      maxX = Math.max(maxX, x + HEX_SIZE);
      minY = Math.min(minY, y - HEX_SIZE);
      maxY = Math.max(maxY, y + HEX_SIZE);
    }
  }
  boardSvg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
}

// Initial update/render
updateStatus();
renderBoard();
