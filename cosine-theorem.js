function getCosineTheoremCalcHTML() {
  // Use classes for styling via style.css
  return `
      <div class="card">
        <h2>余弦定理计算器 (计算角度)</h2>
        <p>输入三角形的三边长 (a, b, c)，计算对应的三个角 (A, B, C)。</p>
        <div class="form-group">
          <label for="a">边 A:</label>
          <input type="number" id="a" min="0" step="any" placeholder="例如: 3" />
        </div>
        <div class="form-group">
          <label for="b">边 B:</label>
          <input type="number" id="b" min="0" step="any" placeholder="例如: 4" />
        </div>
        <div class="form-group">
          <label for="c">边 C:</label>
          <input type="number" id="c" min="0" step="any" placeholder="例如: 5" />
        </div>
        <button id="calculate-cosine">计算角度</button>
        <div id="result-cosine" class="result-area">请输入边长并点击计算。</div>
      </div>
    `;
}

function calculateCosineTheorem() {
  const aInput = document.getElementById("a");
  const bInput = document.getElementById("b");
  const cInput = document.getElementById("c");
  const resultDiv = document.getElementById("result-cosine");

  // Clear previous errors/results styling
  resultDiv.classList.remove('error');

  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);
  const c = parseFloat(cInput.value);

  // Input Validation
  if (isNaN(a) || isNaN(b) || isNaN(c)) {
    resultDiv.textContent = '错误：请输入有效的数字作为边长。';
    resultDiv.classList.add('error');
    return;
  }

  if (a <= 0 || b <= 0 || c <= 0) {
    resultDiv.textContent = '错误：边长必须是正数。';
    resultDiv.classList.add('error');
    return;
  }

  // Triangle Inequality Check
  if (a + b <= c || a + c <= b || b + c <= a) {
    resultDiv.textContent = '错误：输入的三边无法构成三角形（不满足两边之和大于第三边）。';
    resultDiv.classList.add('error');
    return;
  }

  // Calculate angles using Cosine Theorem: A = acos((b^2 + c^2 - a^2) / (2bc))
  // Need to handle potential floating point inaccuracies leading to values slightly outside [-1, 1] for acos
  let cosA = (b * b + c * c - a * a) / (2 * b * c);
  let cosB = (a * a + c * c - b * b) / (2 * a * c);
  // Clamp values to [-1, 1] to prevent NaN results from acos
  cosA = Math.max(-1, Math.min(1, cosA));
  cosB = Math.max(-1, Math.min(1, cosB));

  const angleARad = Math.acos(cosA);
  const angleBRad = Math.acos(cosB);
  // Calculate C using A+B+C = PI radians (180 degrees)
  const angleCRad = Math.PI - angleARad - angleBRad;

  // Convert radians to degrees
  const angleADeg = (angleARad * 180) / Math.PI;
  const angleBDeg = (angleBRad * 180) / Math.PI;
  const angleCDeg = (angleCRad * 180) / Math.PI;

  // Display results
  resultDiv.innerHTML = `
计算结果:
  角 A (对应边 a): ${angleADeg.toFixed(2)}°
  角 B (对应边 b): ${angleBDeg.toFixed(2)}°
  角 C (对应边 c): ${angleCDeg.toFixed(2)}°
(总和: ${(angleADeg + angleBDeg + angleCDeg).toFixed(2)}°)`; // Should be close to 180
}