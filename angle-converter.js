function getAngleConverterHTML() {
  // Remove inline styles, use classes from style.css
  return `
    <div class="card">
      <h2>角度转换器</h2>

      <div class="conversion-section">
        <h3>度 → 弧度</h3>
        <div class="form-group">
          <label for="degrees">度 (°):</label>
          <input type="number" id="degrees" step="any" placeholder="例如: 180"/>
        </div>
        <button id="btn-degreesToRadians">转换为弧度</button>
        <div id="radians-result" class="result-area">结果将显示在这里。</div>
      </div>

      <div class="conversion-section" style="margin-top: 30px;"> <h3>弧度 → 度</h3>
        <div class="form-group">
          <label for="radians">弧度 (rad):</label>
          <input type="number" id="radians" step="any" placeholder="例如: 3.14159"/>
        </div>
        <button id="btn-radiansToDegrees">转换为度</button>
        <div id="degrees-result" class="result-area">结果将显示在这里。</div>
      </div>

      <div class="reference-section" style="margin-top: 30px;">
        <h3>常用角度参考</h3>
        <table class="reference-table"> <thead> <tr>
              <th>度</th>
              <th>弧度 (精确)</th>
              <th>弧度 (近似值)</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody> <tr><td>0°</td><td>0</td><td>0.0000</td><td>-</td></tr>
            <tr><td>30°</td><td>π/6</td><td>0.5236</td><td>常见三角角度</td></tr>
            <tr><td>45°</td><td>π/4</td><td>0.7854</td><td>等腰直角三角形</td></tr>
            <tr><td>60°</td><td>π/3</td><td>1.0472</td><td>等边三角形</td></tr>
            <tr><td>90°</td><td>π/2</td><td>1.5708</td><td>直角</td></tr>
            <tr><td>180°</td><td>π</td><td>3.1416</td><td>平角</td></tr>
            <tr><td>270°</td><td>3π/2</td><td>4.7124</td><td></td></tr>
            <tr><td>360°</td><td>2π</td><td>6.2832</td><td>整圆</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function degreesToRadians() {
  const degreesInput = document.getElementById('degrees');
  const resultDiv = document.getElementById('radians-result');
  resultDiv.classList.remove('error');

  const degrees = parseFloat(degreesInput.value);
  if (isNaN(degrees)) {
    resultDiv.textContent = '错误：请输入有效的度数。';
    resultDiv.classList.add('error');
    return;
  }
  const radians = degrees * Math.PI / 180;
  resultDiv.innerHTML = `
结果:
  ${degrees}° = ${radians.toFixed(6)} rad
  (约为 ${formatPiRadians(radians)} π rad)`;
}

function radiansToDegrees() {
  const radiansInput = document.getElementById('radians');
  const resultDiv = document.getElementById('degrees-result');
   resultDiv.classList.remove('error');

  const radians = parseFloat(radiansInput.value);
  if (isNaN(radians)) {
    resultDiv.textContent = '错误：请输入有效的弧度值。';
     resultDiv.classList.add('error');
    return;
  }
  const degrees = radians * 180 / Math.PI;
  resultDiv.innerHTML = `
结果:
  ${radians} rad = ${degrees.toFixed(4)}°`;
}

// Helper function to format radians in terms of Pi
function formatPiRadians(radians) {
    // Handle zero case explicitly
    if (Math.abs(radians) < 1e-9) {
        return "0";
    }

    const tolerance = 1e-6;
    const maxDenominator = 12; // Check common fractions like pi/2, pi/3, pi/4, pi/6, etc.
    const valueOverPi = radians / Math.PI;

    // Check for simple integer multiples of Pi
    if (Math.abs(valueOverPi - Math.round(valueOverPi)) < tolerance) {
        const multiple = Math.round(valueOverPi);
        if (multiple === 1) return ""; // Just "π"
        if (multiple === -1) return "-"; // Just "-π"
        return `${multiple}`; // e.g., "2", "-3"
    }

    // Check for common fractions
    for (let denominator = 2; denominator <= maxDenominator; denominator++) {
        const numerator = Math.round(valueOverPi * denominator);
        if (Math.abs(valueOverPi - numerator / denominator) < tolerance) {
             if (numerator === 1) return `1/${denominator}`; // e.g., "1/6"
             if (numerator === -1) return `-1/${denominator}`; // e.g., "-1/6"
             // Add check for whole number simplification
             if(numerator % denominator === 0){
                 const multiple = numerator/denominator;
                  if (multiple === 1) return ""; // Just "π"
                  if (multiple === -1) return "-"; // Just "-π"
                  return `${multiple}`; // e.g., "2", "-3"
             }
             return `${numerator}/${denominator}`; // e.g., "5/6"
        }
    }

    // If no common fraction found, return decimal multiple
    return `${valueOverPi.toFixed(4)}`;
}