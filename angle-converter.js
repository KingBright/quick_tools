function getAngleConverterHTML() {
  return `
    <div class="card">
      <h2>Angle Converter</h2>
      
      <div class="section">
        <h3>Degrees to Radians</h3>
        <div>
          <label for="degrees">Degrees:</label>
          <input type="number" id="degrees" step="any" />
        </div>
        <button onclick="degreesToRadians()">Convert to Radians</button>
        <div id="radians-result"></div>
      </div>

      <div class="section" style="margin-top: 20px;">
        <h3>Radians to Degrees</h3>
        <div>
          <label for="radians">Radians:</label>
          <input type="number" id="radians" step="any" />
        </div>
        <button onclick="radiansToDegrees()">Convert to Degrees</button>
        <div id="degrees-result"></div>
      </div>

      <div class="section" style="margin-top: 20px;">
        <h3>Common Angles Reference</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd;">Degrees</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Radians</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Note</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">0°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">0</td>
            <td style="padding: 8px; border: 1px solid #ddd;">-</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">30°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">π/6</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Common angle in triangles</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">45°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">π/4</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Isosceles right triangle</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">60°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">π/3</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Equilateral triangle</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">90°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">π/2</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Right angle</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">180°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">π</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Straight angle</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">360°</td>
            <td style="padding: 8px; border: 1px solid #ddd;">2π</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Full circle</td>
          </tr>
        </table>
      </div>
    </div>
  `;
}

function degreesToRadians() {
  const degrees = parseFloat(document.getElementById('degrees').value);
  if (isNaN(degrees)) {
    document.getElementById('radians-result').innerHTML = 'Please enter a valid number';
    return;
  }
  const radians = degrees * Math.PI / 180;
  document.getElementById('radians-result').innerHTML = `
    ${degrees}° = ${radians.toFixed(6)} radians
    = ${formatPiRadians(radians)} π radians
  `;
}

function radiansToDegrees() {
  const radians = parseFloat(document.getElementById('radians').value);
  if (isNaN(radians)) {
    document.getElementById('degrees-result').innerHTML = 'Please enter a valid number';
    return;
  }
  const degrees = radians * 180 / Math.PI;
  document.getElementById('degrees-result').innerHTML = `
    ${radians} radians = ${degrees.toFixed(2)}°
  `;
}

function formatPiRadians(radians) {
  const inTermsOfPi = radians / Math.PI;
  if (inTermsOfPi === 1) return '';
  if (inTermsOfPi === -1) return '-';
  return inTermsOfPi.toFixed(4);
}
