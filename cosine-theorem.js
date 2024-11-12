function getCosineTheoremCalcHTML() {
  return `
      <div class="card">
        <h2>Cosine Theorem Calculator</h2>
        <div>
          <label for="a">Side A:</label>
          <input type="number" id="a" />
        </div>
        <div>
          <label for="b">Side B:</label>
          <input type="number" id="b" />
        </div>
        <div>
          <label for="c">Side C:</label>
          <input type="number" id="c" />
        </div>
        <button onclick="calculateCosineTheorem()">Calculate</button>
        <div id="result"></div>
      </div>
    `;
}

function calculateCosineTheorem() {
  const a = parseFloat(document.getElementById("a").value);
  const b = parseFloat(document.getElementById("b").value);
  const c = parseFloat(document.getElementById("c").value);

  const A = Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
  const B = Math.acos((a ** 2 + c ** 2 - b ** 2) / (2 * a * c));
  const C = Math.PI - A - B;

  const angleA = Math.round((A * 180) / Math.PI);
  const angleB = Math.round((B * 180) / Math.PI);
  const angleC = Math.round((C * 180) / Math.PI);

  document.getElementById("result").innerHTML = `
      Angle A: ${angleA}°
      Angle B: ${angleB}°
      Angle C: ${angleC}°
    `;
}
