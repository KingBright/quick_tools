// excavator-renderer.js

// --- Global Variables ---
let excavatorParts = [];
let excavatorImages = {};
let globalOffset = { x: 200, y: -80 };
let debugMode = false; // Controls connection point visibility
let partsVisibility = { body: true, boom: true, arm: true, bucket: true };
let originalAnchors = []; // Stores original anchors for reset
// *** 确保 groundLine 在这里被正确声明和初始化 ***
let groundLine = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }; // Stores calculated ground line coords
let originalSizes = {};   // Stores original SIZE from config ([width, height])
let originalScales = {};  // Stores original SCALE from config (scalar)
let originalConfigData = []; // Stores the full original config objects

// --- HTML Generation ---
function getExcavatorRendererHTML() {
  // HTML structure unchanged
  return `
    <div class="card">
      <h2>挖掘机侧视图渲染器</h2>
      <div class="excavator-layout">
        <div class="excavator-canvas-container">
          <canvas id="excavator-canvas" width="720" height="560"></canvas>
        </div>
        <div class="excavator-controls">
          <h3>控制面板</h3>
          <fieldset class="control-section">
            <legend><h4>角度控制</h4></legend>
            <div class="slider-group"> <label for="cab-rotate">车身旋转:</label> <input type="range" id="cab-rotate" min="-30" max="30" value="0" step="1"> <span id="cab-angle-value" class="value-display">0° abs</span> <div class="checkbox-group"><input type="checkbox" id="show-body" checked></div> </div>
            <div class="slider-group"> <label for="boom-rotate">大臂:</label> <input type="range" id="boom-rotate" min="0" max="115" value="55" step="1"> <span id="boom-angle-value" class="value-display">?° rel</span> <div class="checkbox-group"><input type="checkbox" id="show-boom" checked></div> </div>
            <div class="slider-group"> <label for="arm-rotate">小臂:</label> <input type="range" id="arm-rotate" min="0" max="180" value="90" step="1"> <span id="arm-angle-value" class="value-display">?° rel</span> <div class="checkbox-group"><input type="checkbox" id="show-arm" checked></div> </div>
            <div class="slider-group"> <label for="bucket-rotate">铲斗:</label> <input type="range" id="bucket-rotate" min="0" max="180" value="90" step="1"> <span id="bucket-angle-value" class="value-display">?° rel</span> <div class="checkbox-group"><input type="checkbox" id="show-bucket" checked></div> </div>
          </fieldset>
          <fieldset class="control-section">
            <legend><h4>真实尺寸比例调整 (单位: mm)</h4></legend>
            <div class="form-group"> <label for="real-body-height" title="挖机旋转中心到地面的垂直距离">(参考)车身高:</label> <input type="number" id="real-body-height" placeholder="例如: 5230" /> </div>
            <div class="form-group"> <label for="real-body-boom" title="车身转轴到大臂转轴距离">车身-大臂:</label> <input type="number" id="real-body-boom" placeholder="例如: 260" /> </div>
            <div class="form-group"> <label for="real-boom-arm" title="大臂转轴到小臂转轴距离">大臂-小臂:</label> <input type="number" id="real-boom-arm" placeholder="例如: 7000" /> </div>
            <div class="form-group"> <label for="real-arm-bucket" title="小臂转轴到铲斗转轴距离">小臂-铲斗:</label> <input type="number" id="real-arm-bucket" placeholder="例如: 2600" /> </div>
            <div class="form-group"> <label for="real-bucket-tip" title="铲斗转轴到铲斗尖距离">铲斗轴-尖:</label> <input type="number" id="real-bucket-tip" placeholder="例如: 2230" /> </div>
            <div style="margin-bottom: 10px;"> <button id="apply-scale-button">应用比例</button> <button onclick="resetSizesToOriginal()">重置尺寸</button> </div>
            <div id="scale-ratios-display" class="result-area" style="font-size: 0.9em; line-height: 1.4;"> 应用比例后将在此显示各部件缩放比 (以车身原始尺寸=1为基准)。 </div>
          </fieldset>
          <fieldset class="control-section">
            <legend><h4>部件渲染长度 & 比例对比</h4></legend>
            <div id="part-measurements">初始化中...</div>
          </fieldset>
          <fieldset class="control-section">
            <legend><h4>锚点设置 (高级)</h4></legend>
            <div class="form-group"> <label for="anchor-part">选择部件:</label> <select id="anchor-part"> <option value="body">驾驶舱</option><option value="boom">大臂</option><option value="arm">小臂</option><option value="bucket">铲斗</option> </select> </div> <div class="anchor-controls"> <h5>旋转锚点 (rotate_anchor)</h5> <div class="anchor-input-group"><label>X:</label><input type="number" id="rotate-anchor-x" step="0.01" class="short-input"><label>Y:</label><input type="number" id="rotate-anchor-y" step="0.01" class="short-input"><button id="update-rotate-anchor">更新</button></div> </div> <div class="anchor-controls"> <h5>连接点 (next_anchor)</h5> <div class="anchor-input-group"><label>X:</label><input type="number" id="next-anchor-x" step="0.01" class="short-input"><label>Y:</label><input type="number" id="next-anchor-y" step="0.01" class="short-input"><button id="update-next-anchor">更新</button></div> </div>
          </fieldset>
          <div class="button-group control-section"> <button onclick="resetExcavator()">重置视图</button> <button onclick="toggleDebugMode()">连接点</button> <button onclick="applyCurrentAnchors()">复制锚点</button> </div>
        </div>
      </div>
    </div>
  `;
}

// --- Initialization and Setup ---
async function initExcavatorRenderer() {
    try {
        const response = await fetch("./assets/config.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const config = await response.json();
        originalConfigData = JSON.parse(JSON.stringify(config));
        excavatorParts = JSON.parse(JSON.stringify(config));

        globalOffset = { x: 200, y: -80 };
        debugMode = false;
        partsVisibility = { body: true, boom: true, arm: true, bucket: true };
        originalAnchors = [];
        originalSizes = {};
        originalScales = {};

        originalConfigData.forEach(partConfig => {
            const partName = partConfig.part;
            originalAnchors.push({ part: partName, rotate_anchor: [...partConfig.rotate_anchor], next_anchor: [...partConfig.next_anchor], });
            originalSizes[partName] = [...partConfig.size];
            const configScale = partConfig.scale ?? 1.0;
            originalScales[partName] = configScale;
            const currentPart = excavatorParts.find(p => p.part === partName);
            if(currentPart) {
                 currentPart.size = [partConfig.size[0] * configScale, partConfig.size[1] * configScale];
                 currentPart.originalScale = configScale;
            }
        });

        await Promise.all(
          excavatorParts.map(async (partConfig) => {
            const img = new Image(); img.src = `./assets/${partConfig.part}.png`; return new Promise((resolve, reject) => { img.onload = () => { excavatorImages[partConfig.part] = img; resolve(); }; img.onerror = (err) => { console.error(`Error loading image for ${partConfig.part}:`, err); reject(err); }; });
          })
        );
        setupExcavator();
        setupControlEvents();
        updateExcavatorAngles();

      } catch (error) {
        // Log the actual error causing the catch block to execute
        console.error("初始化挖掘机渲染器时出错:", error);
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            // Display the specific error message to the user
            pageContent.innerHTML = `<div class="card error"><p>加载挖掘机配置或图像失败: ${error.message}。请检查控制台和文件路径。</p></div>`;
        }
      }
}

function setupExcavator() {
    const canvas = document.getElementById("excavator-canvas"); if (!canvas || !excavatorParts || excavatorParts.length === 0) { console.error("Canvas element or parts data missing for setup."); return; } const centerX = canvas.width / 3; const centerY = canvas.height / 2 + 80; const bodyPart = excavatorParts.find(p => p.part === 'body'); if(bodyPart && bodyPart.rotate_anchor_pos) { bodyPart.rotate_anchor_pos = [centerX, centerY]; } else { console.error("Body part not found or missing rotate_anchor_pos"); }
}

function setupControlEvents() {
    document.getElementById("cab-rotate")?.addEventListener("input", updateExcavatorAngles); document.getElementById("boom-rotate")?.addEventListener("input", updateExcavatorAngles); document.getElementById("arm-rotate")?.addEventListener("input", updateExcavatorAngles); document.getElementById("bucket-rotate")?.addEventListener("input", updateExcavatorAngles); document.getElementById("show-body")?.addEventListener("change", updatePartsVisibility); document.getElementById("show-boom")?.addEventListener("change", updatePartsVisibility); document.getElementById("show-arm")?.addEventListener("change", updatePartsVisibility); document.getElementById("show-bucket")?.addEventListener("change", updatePartsVisibility); document.getElementById("anchor-part")?.addEventListener("change", updateAnchorInputs); document.getElementById("update-rotate-anchor")?.addEventListener("click", updateRotateAnchor); document.getElementById("update-next-anchor")?.addEventListener("click", updateNextAnchor); document.getElementById("apply-scale-button")?.addEventListener("click", applyRealDimensionsScale); updateAnchorInputs();
}

// --- Angle and Position Calculations ---
function updateExcavatorAngles() {
    const cabRotate = document.getElementById("cab-rotate"); const boomRotate = document.getElementById("boom-rotate"); const armRotate = document.getElementById("arm-rotate"); const bucketRotate = document.getElementById("bucket-rotate"); const cabAngleValue = document.getElementById("cab-angle-value"); const boomAngleValue = document.getElementById("boom-angle-value"); const armAngleValue = document.getElementById("arm-angle-value"); const bucketAngleValue = document.getElementById("bucket-angle-value"); if (!cabRotate || !boomRotate || !armRotate || !bucketRotate || !cabAngleValue || !boomAngleValue || !armAngleValue || !bucketAngleValue || !excavatorParts || excavatorParts.length < 4) { console.error("Control elements or parts data missing for angle update."); return; } const cabSliderAngle = parseInt(cabRotate.value); const boomSliderValue = parseInt(boomRotate.value); const armSliderValue = parseInt(armRotate.value); const bucketSliderValue = parseInt(bucketRotate.value); const boomRelAngle = -45 + boomSliderValue; const armRelAngle = 30 - armSliderValue; const bucketRelAngle = 50 - bucketSliderValue; const bodyAbsAngle = cabSliderAngle; const boomAbsAngle = bodyAbsAngle + boomRelAngle; const armAbsAngle = boomAbsAngle + armRelAngle; const bucketAbsAngle = armAbsAngle + bucketRelAngle; excavatorParts[0].rotate = bodyAbsAngle; excavatorParts[1].rotate = boomAbsAngle; excavatorParts[2].rotate = armAbsAngle; excavatorParts[3].rotate = bucketAbsAngle; cabAngleValue.textContent = `${bodyAbsAngle}° abs`; boomAngleValue.textContent = `${boomRelAngle.toFixed(0)}° rel / ${boomAbsAngle.toFixed(0)}° abs`; armAngleValue.textContent = `${armRelAngle.toFixed(0)}° rel / ${armAbsAngle.toFixed(0)}° abs`; bucketAngleValue.textContent = `${bucketRelAngle.toFixed(0)}° rel / ${bucketAbsAngle.toFixed(0)}° abs`; updatePartsPositions(); renderExcavator();
}

function calcNextAnchor(idx) {
    const currentPart = excavatorParts[idx]; const nextPart = excavatorParts[idx + 1]; if (!currentPart || !nextPart || !currentPart.rotate_anchor_pos || !currentPart.rotate_anchor || !currentPart.next_anchor || !currentPart.size) { return; } const currentRotateRad = currentPart.rotate * Math.PI / 180; const vectorX = (currentPart.next_anchor[0] - currentPart.rotate_anchor[0]) * currentPart.size[0]; const vectorY = (currentPart.rotate_anchor[1] - currentPart.next_anchor[1]) * currentPart.size[1]; const rotatedVectorX = vectorX * Math.cos(currentRotateRad) - vectorY * Math.sin(currentRotateRad); const rotatedVectorY = vectorX * Math.sin(currentRotateRad) + vectorY * Math.cos(currentRotateRad); nextPart.rotate_anchor_pos = [rotatedVectorX + currentPart.rotate_anchor_pos[0], rotatedVectorY + currentPart.rotate_anchor_pos[1]];
}

function updatePartsPositions() {
    if (!excavatorParts || excavatorParts.length === 0) return; for (let i = 0; i < excavatorParts.length - 1; i++) { calcNextAnchor(i); } updatePartMeasurements();
}

function calcBucketHeadPos() {
    const bucketPart = excavatorParts.find(p => p.part === 'bucket'); if (!bucketPart || !bucketPart.rotate_anchor_pos || !bucketPart.rotate_anchor || !bucketPart.next_anchor || !bucketPart.size) { return null; } const bucketRotateRad = bucketPart.rotate * Math.PI / 180; const vectorX = (bucketPart.next_anchor[0] - bucketPart.rotate_anchor[0]) * bucketPart.size[0]; const vectorY = (bucketPart.rotate_anchor[1] - bucketPart.next_anchor[1]) * bucketPart.size[1]; const rotatedVectorX = vectorX * Math.cos(bucketRotateRad) - vectorY * Math.sin(bucketRotateRad); const rotatedVectorY = vectorX * Math.sin(bucketRotateRad) + vectorY * Math.cos(bucketRotateRad); return { x: rotatedVectorX + bucketPart.rotate_anchor_pos[0], y: rotatedVectorY + bucketPart.rotate_anchor_pos[1] };
}

// --- Rendering Functions ---
function renderExcavator() {
    const canvas = document.getElementById("excavator-canvas"); if (!canvas) return; const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, canvas.width, canvas.height); if (!excavatorParts || excavatorParts.length === 0 || !Object.keys(excavatorImages).length) { ctx.fillStyle = 'red'; ctx.font = '16px Arial'; ctx.fillText('错误: 挖掘机数据或图像未加载.', 20, 40); return; } let bucketTipHeightAboveGround = null; const bodyPart = excavatorParts[0]; let groundLineAngle = 0; if (!bodyPart || !bodyPart.rotate_anchor_pos || !bodyPart.size) { groundLine.start = { x: 0, y: canvas.height * 0.8 }; groundLine.end = { x: canvas.width, y: canvas.height * 0.8 }; } else { groundLineAngle = bodyPart.rotate * Math.PI / 180; const h = bodyPart.size[1] / 2; const rotationCenterX = bodyPart.rotate_anchor_pos[0] + globalOffset.x; const rotationCenterY = bodyPart.rotate_anchor_pos[1] + globalOffset.y; const vecX = 0, vecY = h; const rotatedVecX = vecX * Math.cos(groundLineAngle) - vecY * Math.sin(groundLineAngle); const rotatedVecY = vecX * Math.sin(groundLineAngle) + vecY * Math.cos(groundLineAngle); const groundPointX = rotationCenterX + rotatedVecX; const groundPointY = rotationCenterY + rotatedVecY; const lineLength = canvas.width * 1.5; groundLine.start = { x: groundPointX - Math.cos(groundLineAngle) * lineLength / 2, y: groundPointY - Math.sin(groundLineAngle) * lineLength / 2 }; groundLine.end = { x: groundPointX + Math.cos(groundLineAngle) * lineLength / 2, y: groundPointY + Math.sin(groundLineAngle) * lineLength / 2 }; } ctx.save(); ctx.beginPath(); ctx.moveTo(groundLine.start.x, groundLine.start.y); ctx.lineTo(groundLine.end.x, groundLine.end.y); ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 3; ctx.stroke(); const textureSpacing = 25; const textureLength = 12; const textureAngle = groundLineAngle + Math.PI / 2; const textureVectorX = Math.cos(textureAngle); const textureVectorY = Math.sin(textureAngle); const numTextures = Math.floor(canvas.width / textureSpacing); ctx.strokeStyle = "#A0522D"; ctx.lineWidth = 1; const groundMidX = (groundLine.start.x + groundLine.end.x) / 2; const groundMidY = (groundLine.start.y + groundLine.end.y) / 2; for (let i = -numTextures / 2; i < numTextures / 2; i++) { const t = i * textureSpacing; const posX = groundMidX + Math.cos(groundLineAngle) * t; const posY = groundMidY + Math.sin(groundLineAngle) * t; ctx.beginPath(); ctx.moveTo(posX, posY); ctx.lineTo(posX + textureLength * textureVectorX, posY + textureLength * textureVectorY); ctx.stroke(); } ctx.restore(); const renderOrder = ["body", "boom", "arm", "bucket"]; renderOrder.forEach(partName => { const part = excavatorParts.find(p => p.part === partName); if (part && excavatorImages[partName] && partsVisibility[partName] && part.rotate_anchor_pos) { drawPart(ctx, part, excavatorImages[partName]); } }); const bucketPart = excavatorParts.find(p => p.part === 'bucket'); if (partsVisibility.bucket && bucketPart && bucketPart.rotate_anchor_pos) { const headPos = calcBucketHeadPos(); if (headPos) { const tipGlobalX = headPos.x + globalOffset.x; const tipGlobalY = headPos.y + globalOffset.y; ctx.save(); ctx.fillStyle = "#FF6600"; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tipGlobalX, tipGlobalY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); bucketTipHeightAboveGround = calculatePerpendicularDistanceToLine( tipGlobalX, tipGlobalY, groundLine.start.x, groundLine.start.y, groundLine.end.x, groundLine.end.y ); const glStartX = groundLine.start.x; const glStartY = groundLine.start.y; const glEndX = groundLine.end.x; const glEndY = groundLine.end.y; const glDx = glEndX - glStartX; const glDy = glEndY - glStartY; const lineLengthSq = glDx * glDx + glDy * glDy; let groundPointX_Closest, groundPointY_Closest; if (lineLengthSq < 1e-9) { groundPointX_Closest = glStartX; groundPointY_Closest = glStartY; } else { const t = ((tipGlobalX - glStartX) * glDx + (tipGlobalY - glStartY) * glDy) / lineLengthSq; groundPointX_Closest = glStartX + t * glDx; groundPointY_Closest = glStartY + t * glDy; } ctx.save(); ctx.beginPath(); ctx.moveTo(tipGlobalX, tipGlobalY); ctx.lineTo(groundPointX_Closest, groundPointY_Closest); ctx.strokeStyle = "#007bff"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); const midX = (tipGlobalX + groundPointX_Closest) / 2; const midY = (tipGlobalY + groundPointY_Closest) / 2; const textOffsetX = 15 * Math.cos(groundLineAngle); const textOffsetY = 15 * Math.sin(groundLineAngle); ctx.fillStyle = "#007bff"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(`${bucketTipHeightAboveGround.toFixed(1)}px`, midX + textOffsetX, midY + textOffsetY); ctx.restore(); } } if (debugMode) { if (excavatorParts && excavatorParts.length > 1 && excavatorParts[1].rotate_anchor_pos) { drawConnectionPoints(ctx); } }
}

function drawPart(ctx, part, image) {
    ctx.save(); ctx.translate(part.rotate_anchor_pos[0] + globalOffset.x, part.rotate_anchor_pos[1] + globalOffset.y); ctx.rotate(part.rotate * Math.PI / 180); const width = part.size[0]; const height = part.size[1]; const offsetX = (-part.rotate_anchor[0] - 0.5) * width; const offsetY = (part.rotate_anchor[1] - 0.5) * height; try { ctx.drawImage(image, offsetX, offsetY, width, height); } catch (e) { console.error(`Error drawing image for ${part.part}:`, e); } ctx.restore();
}

// --- Debugging Visualization Function ---
function drawConnectionPoints(ctx) {
    for (let i = 0; i < excavatorParts.length - 1; i++) { const currentPart = excavatorParts[i]; const nextPart = excavatorParts[i + 1]; if (!currentPart || !nextPart || !currentPart.rotate_anchor_pos || !nextPart.rotate_anchor_pos || !partsVisibility[currentPart.part] || !partsVisibility[nextPart.part]) { continue; } const currentRotateRad = currentPart.rotate * Math.PI / 180; const vectorX = (currentPart.next_anchor[0] - currentPart.rotate_anchor[0]) * currentPart.size[0]; const vectorY = (currentPart.rotate_anchor[1] - currentPart.next_anchor[1]) * currentPart.size[1]; const rotatedVectorX = vectorX * Math.cos(currentRotateRad) - vectorY * Math.sin(currentRotateRad); const rotatedVectorY = vectorX * Math.sin(currentRotateRad) + vectorY * Math.cos(currentRotateRad); const globalNextAnchor = { x: rotatedVectorX + currentPart.rotate_anchor_pos[0] + globalOffset.x, y: rotatedVectorY + currentPart.rotate_anchor_pos[1] + globalOffset.y }; const nextGlobalAnchor = { x: nextPart.rotate_anchor_pos[0] + globalOffset.x, y: nextPart.rotate_anchor_pos[1] + globalOffset.y }; ctx.save(); ctx.fillStyle = "blue"; ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(globalNextAnchor.x, globalNextAnchor.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "purple"; ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(nextGlobalAnchor.x, nextGlobalAnchor.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); const dx = nextGlobalAnchor.x - globalNextAnchor.x; const dy = nextGlobalAnchor.y - globalNextAnchor.y; const distance = Math.sqrt(dx * dx + dy * dy); ctx.save(); if (distance > 1.5) { ctx.strokeStyle = "red"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); } else { ctx.strokeStyle = "lime"; ctx.lineWidth = 1.5; } ctx.beginPath(); ctx.moveTo(globalNextAnchor.x, globalNextAnchor.y); ctx.lineTo(nextGlobalAnchor.x, nextGlobalAnchor.y); ctx.stroke(); if (distance > 1.5) ctx.setLineDash([]); ctx.restore(); }
}

// --- Utility Functions ---
function calculatePerpendicularDistanceToLine(x, y, startX, startY, endX, endY) {
    const dx = endX - startX; const dy = endY - startY; const lineLengthSq = dx * dx + dy * dy; if (lineLengthSq < 1e-9) return 0; const numerator = dy * x - dx * y + endX * startY - startX * endY; const denominator = Math.sqrt(lineLengthSq); return numerator / denominator;
}

function calculatePartDistanceUsingSize(rotateAnchor, nextAnchor, size) {
    if (!rotateAnchor || !nextAnchor || !size) return 0; const dx_local = nextAnchor[0] - rotateAnchor[0]; const dy_local = nextAnchor[1] - rotateAnchor[1]; const dx_scaled = dx_local * size[0]; const dy_scaled = dy_local * size[1]; return Math.sqrt(dx_scaled * dx_scaled + dy_scaled * dy_scaled);
}

function updatePartsVisibility() {
    partsVisibility.body = document.getElementById("show-body")?.checked ?? true; partsVisibility.boom = document.getElementById("show-boom")?.checked ?? true; partsVisibility.arm = document.getElementById("show-arm")?.checked ?? true; partsVisibility.bucket = document.getElementById("show-bucket")?.checked ?? true; renderExcavator();
}

function updateAnchorInputs() {
    const selectedPartName = document.getElementById("anchor-part")?.value; const rotateXInput = document.getElementById("rotate-anchor-x"); const rotateYInput = document.getElementById("rotate-anchor-y"); const nextXInput = document.getElementById("next-anchor-x"); const nextYInput = document.getElementById("next-anchor-y"); if (!selectedPartName || !rotateXInput || !rotateYInput || !nextXInput || !nextYInput || !excavatorParts) return; const part = excavatorParts.find(p => p.part === selectedPartName); if (part) { rotateXInput.value = part.rotate_anchor[0]?.toFixed(3) ?? 0; rotateYInput.value = part.rotate_anchor[1]?.toFixed(3) ?? 0; nextXInput.value = part.next_anchor[0]?.toFixed(3) ?? 0; nextYInput.value = part.next_anchor[1]?.toFixed(3) ?? 0; } else { rotateXInput.value = ''; rotateYInput.value = ''; nextXInput.value = ''; nextYInput.value = ''; }
}

function updateRotateAnchor() {
    const selectedPartName = document.getElementById("anchor-part")?.value; if (!selectedPartName || !excavatorParts) return; const part = excavatorParts.find(p => p.part === selectedPartName); if (part) { const x = parseFloat(document.getElementById("rotate-anchor-x")?.value); const y = parseFloat(document.getElementById("rotate-anchor-y")?.value); if (!isNaN(x) && !isNaN(y)) { part.rotate_anchor = [x, y]; updatePartsPositions(); renderExcavator(); } else { alert('请输入有效的旋转锚点 X 和 Y 值。'); } }
}

function updateNextAnchor() {
    const selectedPartName = document.getElementById("anchor-part")?.value; if (!selectedPartName || !excavatorParts) return; const part = excavatorParts.find(p => p.part === selectedPartName); if (part) { const x = parseFloat(document.getElementById("next-anchor-x")?.value); const y = parseFloat(document.getElementById("next-anchor-y")?.value); if (!isNaN(x) && !isNaN(y)) { part.next_anchor = [x, y]; updatePartsPositions(); renderExcavator(); } else { alert('请输入有效的连接点 X 和 Y 值。'); } }
}

function resetToOriginalAnchors() {
    // Only resets anchors
    if (!originalAnchors || !excavatorParts) return; originalAnchors.forEach(originalPartData => { const part = excavatorParts.find(p => p.part === originalPartData.part); if (part) { part.rotate_anchor = [...originalPartData.rotate_anchor]; part.next_anchor = [...originalPartData.next_anchor]; } }); updateAnchorInputs(); updatePartsPositions();
}

function applyCurrentAnchors() {
    if (!excavatorParts) return; const currentAnchors = excavatorParts.map(part => ({ part: part.part, rotate_anchor: part.rotate_anchor.map(v => parseFloat(v.toFixed(3))), next_anchor: part.next_anchor.map(v => parseFloat(v.toFixed(3))), })); const anchorsJSON = JSON.stringify(currentAnchors, null, 2); console.log("当前锚点配置 (JSON):\n", anchorsJSON); alert("当前锚点配置已输出到浏览器控制台。");
}

function toggleDebugMode() {
    debugMode = !debugMode; console.log(`显示连接点: ${debugMode ? '开启' : '关闭'}`); renderExcavator();
}

function resetExcavator() {
    console.log("重置挖掘机视图..."); document.getElementById("cab-rotate").value = 0; document.getElementById("boom-rotate").value = 55; document.getElementById("arm-rotate").value = 90; document.getElementById("bucket-rotate").value = 90; document.getElementById("show-body").checked = true; document.getElementById("show-boom").checked = true; document.getElementById("show-arm").checked = true; document.getElementById("show-bucket").checked = true; updatePartsVisibility(); resetToOriginalAnchors(); resetSizesToOriginal(); updateExcavatorAngles();
}

/**
 * Resets part sizes to their initial values (original size * original scale from config).
 */
function resetSizesToOriginal() {
    if (Object.keys(originalSizes).length === 0 || Object.keys(originalScales).length === 0) {
        console.warn("原始尺寸或比例未存储，无法重置。"); return;
    }
    let changed = false;
    excavatorParts.forEach(part => {
        const partName = part.part;
        if (originalSizes[partName] && originalScales[partName] !== undefined) {
            const initialScaledWidth = originalSizes[partName][0] * originalScales[partName];
            const initialScaledHeight = originalSizes[partName][1] * originalScales[partName];
            if (Math.abs(part.size[0] - initialScaledWidth) > 1e-3 || Math.abs(part.size[1] - initialScaledHeight) > 1e-3) {
                part.size = [initialScaledWidth, initialScaledHeight];
                changed = true;
            }
        }
    });
    if(changed){
        console.log("部件尺寸已重置为config.json定义的初始值。");
        const displayDiv = document.getElementById('scale-ratios-display');
        if (displayDiv) { displayDiv.innerHTML = '部件尺寸已重置。应用比例后将在此显示各部件缩放比。'; }
        updatePartsPositions();
        renderExcavator();
    }
}

/**
 * Applies scaling based on real dimensions, keeping Body scale = 1 (relative to original unscaled size)
 * and adjusting other parts proportionally based on real dimension ratios.
 * This OVERRIDES any scale factors defined in config.json for Boom, Arm, Bucket.
 */
function applyRealDimensionsScale() {
    // 1. Read inputs
    // const realBodyHeightRef = parseFloat(document.getElementById('real-body-height')?.value); // Not used directly
    const realBodyToBoomDist = parseFloat(document.getElementById('real-body-boom')?.value);
    const realBoomToArmDist = parseFloat(document.getElementById('real-boom-arm')?.value);
    const realArmToBucketDist = parseFloat(document.getElementById('real-arm-bucket')?.value);
    const realBucketToTipDist = parseFloat(document.getElementById('real-bucket-tip')?.value);

    // 2. Validate inputs (Body->Boom must be > 0)
    if (isNaN(realBodyToBoomDist) || realBodyToBoomDist <= 0 ||
        isNaN(realBoomToArmDist) || realBoomToArmDist < 0 ||
        isNaN(realArmToBucketDist) || realArmToBucketDist < 0 ||
        isNaN(realBucketToTipDist) || realBucketToTipDist < 0) {
        alert("请输入所有有效的真实尺寸（车身-大臂距离需>0，其他距离需>=0，单位mm）。"); return;
    }
    if (Object.keys(originalSizes).length === 0 || !originalConfigData || originalConfigData.length === 0) {
        alert("原始尺寸或配置数据未加载，无法缩放。"); return;
    }

    try {
        // 3. Calculate Real Ratios relative to Body->Boom distance
        const realRatio_BoomArm_To_BodyBoom = realBoomToArmDist / realBodyToBoomDist;
        const realRatio_ArmBucket_To_BodyBoom = realArmToBucketDist / realBodyToBoomDist;
        const realRatio_BucketTip_To_BodyBoom = realBucketToTipDist / realBodyToBoomDist;

        // 4. Get Original Config Part data and Calculate Original Pixel Distances
        //    using ORIGINAL UNscaled sizes and ORIGINAL anchors
        const findOrigConf = (partName) => originalConfigData.find(p => p.part === partName);
        const origBodyConf = findOrigConf('body');
        const origBoomConf = findOrigConf('boom');
        const origArmConf = findOrigConf('arm');
        const origBucketConf = findOrigConf('bucket');
        if (!origBodyConf || !origBoomConf || !origArmConf || !origBucketConf){ alert("无法找到所有部件的原始配置信息。"); return; }

        // Calculate distances based on ORIGINAL UNscaled sizes
        const originalPxBodyBoom = calculatePartDistanceUsingSize(origBodyConf.rotate_anchor, origBodyConf.next_anchor, originalSizes['body']);
        const originalPxBoomArm = calculatePartDistanceUsingSize(origBoomConf.rotate_anchor, origBoomConf.next_anchor, originalSizes['boom']);
        const originalPxArmBucket = calculatePartDistanceUsingSize(origArmConf.rotate_anchor, origArmConf.next_anchor, originalSizes['arm']);
        const originalPxBucketTip = calculatePartDistanceUsingSize(origBucketConf.rotate_anchor, origBucketConf.next_anchor, originalSizes['bucket']);

        if (originalPxBodyBoom <= 1e-6) { alert("原始配置中车身->大臂像素距离过小或为零，无法计算比例。"); return; }

        // 5. Determine Target Rendered Distances based on Body original size (scale=1)
        const targetPxBodyBoom = originalPxBodyBoom; // Rendered Body->Boom distance remains unchanged
        const targetPxBoomArm = targetPxBodyBoom * realRatio_BoomArm_To_BodyBoom;
        const targetPxArmBucket = targetPxBodyBoom * realRatio_ArmBucket_To_BodyBoom;
        const targetPxBucketTip = targetPxBodyBoom * realRatio_BucketTip_To_BodyBoom;

        // 6. Calculate Required FINAL Scale Factors (relative to ORIGINAL UNscaled sizes)
        const bodyFinalScale = 1.0; // Body scale is fixed at 1 (relative to its original size)
        const boomFinalScale = (originalPxBoomArm > 1e-6) ? targetPxBoomArm / originalPxBoomArm : 1;
        const armFinalScale = (originalPxArmBucket > 1e-6) ? targetPxArmBucket / originalPxArmBucket : 1;
        const bucketFinalScale = (originalPxBucketTip > 1e-6) ? targetPxBucketTip / originalPxBucketTip : 1;

        // 7. Apply Scaling (relative to originalSizes)
        let scalingApplied = false;
        excavatorParts.forEach(part => {
            const partName = part.part;
            const origSize = originalSizes[partName];
            if (!origSize) return;

            let finalScale = 1.0;
            if (partName === 'body') finalScale = bodyFinalScale; // Should be 1
            else if (partName === 'boom') finalScale = boomFinalScale;
            else if (partName === 'arm') finalScale = armFinalScale;
            else if (partName === 'bucket') finalScale = bucketFinalScale;

            const newWidth = origSize[0] * finalScale;
            const newHeight = origSize[1] * finalScale;

            // Check if size actually needs updating
            if (Math.abs(part.size[0] - newWidth) > 1e-3 || Math.abs(part.size[1] - newHeight) > 1e-3) {
                 part.size = [newWidth, newHeight]; // Update current size
                 scalingApplied = true;
            }
        });

        // 8. Update Display / Log / Render
         if(scalingApplied){
            console.log("应用真实尺寸比例 (车身=1x), 计算出的最终缩放因子:", {bodyFinalScale, boomFinalScale, armFinalScale, bucketFinalScale});

            // Update the display area with calculated final scale factors
            const displayDiv = document.getElementById('scale-ratios-display');
            if (displayDiv) {
                // Display factors relative to original unscaled size
                displayDiv.innerHTML = `
                    <strong>计算出的最终缩放因子 (相对原始尺寸):</strong><br>
                    车身 (Body): ${bodyFinalScale.toFixed(3)}<br>
                    大臂 (Boom): ${boomFinalScale.toFixed(3)}<br>
                    小臂 (Arm): ${armFinalScale.toFixed(3)}<br>
                    铲斗 (Bucket): ${bucketFinalScale.toFixed(3)}
                `;
            }
            updatePartsPositions();
            renderExcavator();
        } else {
             console.log("计算出的尺寸与当前尺寸无明显变化，未应用缩放。");
             const displayDiv = document.getElementById('scale-ratios-display');
             if (displayDiv) { displayDiv.innerHTML = '计算出的缩放比无需应用 (比例已匹配或输入错误)。'; }
        }

    } catch(e) {
        alert("应用缩放时出错: " + e.message); console.error("Error applying scale:", e);
    }
}


// --- Measurement Display Logic ---
/**
 * Updates the measurement display table. Includes real-world ratios relative to Body->Boom distance.
 */
function updatePartMeasurements() {
    const measurementsDiv = document.getElementById("part-measurements");
    if (!measurementsDiv) return;
    if (!excavatorParts || excavatorParts.length === 0 || !originalSizes || !originalSizes['body'] || !originalConfigData || originalConfigData.length === 0) {
         measurementsDiv.innerHTML = '<p>部件数据未加载或原始数据丢失。</p>'; return;
    }

    // Read Real Dimensions
    const realBodyHeightRef = parseFloat(document.getElementById('real-body-height')?.value); // Still read for context
    const realBodyToBoomDist = parseFloat(document.getElementById('real-body-boom')?.value);
    const realBoomToArmDist = parseFloat(document.getElementById('real-boom-arm')?.value);
    const realArmToBucketDist = parseFloat(document.getElementById('real-arm-bucket')?.value);
    const realBucketToTipDist = parseFloat(document.getElementById('real-bucket-tip')?.value);
    const hasRealBodyBoomRef = !isNaN(realBodyToBoomDist) && realBodyToBoomDist > 0;

    // Calculate Real Ratios relative to Body->Boom distance
    let realRatioBodyBoom = '1.00'; // Base reference if valid
    let realRatioBoomArm = 'N/A';
    let realRatioArmBucket = 'N/A';
    let realRatioBucketTip = 'N/A';
    if (hasRealBodyBoomRef) {
        if (!isNaN(realBoomToArmDist) && realBoomToArmDist >= 0) { realRatioBoomArm = (realBoomToArmDist / realBodyToBoomDist).toFixed(2); }
        if (!isNaN(realArmToBucketDist) && realArmToBucketDist >= 0) { realRatioArmBucket = (realArmToBucketDist / realBodyToBoomDist).toFixed(2); }
        if (!isNaN(realBucketToTipDist) && realBucketToTipDist >= 0) { realRatioBucketTip = (realBucketToTipDist / realBodyToBoomDist).toFixed(2); }
    } else {
        realRatioBodyBoom = 'N/A'; // Cannot calculate ratios without reference
    }

    // Generate HTML
    // Use ORIGINAL Body->Boom pixel distance as the consistent RENDER reference unit
    const findOrigConf = (partName) => originalConfigData.find(p => p.part === partName);
    const origBodyConf = findOrigConf('body');
    const renderRefPx = (origBodyConf && originalSizes['body']) ? calculatePartDistanceUsingSize(origBodyConf.rotate_anchor, origBodyConf.next_anchor, originalSizes['body']) : 0;

    // Header Info
    let html = `<div style="font-weight: bold; margin-bottom: 5px;">渲染参考: 原始 车身->大臂 距离 = ${renderRefPx > 0 ? renderRefPx.toFixed(1) + 'px' : 'N/A'}</div>`;
    if (hasRealBodyBoomRef) { html += `<div style="font-weight: bold; margin-bottom: 5px;">真实参考: 车身->大臂 距离 = ${realBodyToBoomDist.toFixed(0)} mm</div>`; }
    else { html += `<div style="font-weight: bold; margin-bottom: 5px; color: #777;">(请输入真实 车身-大臂 距离以计算真实比例)</div>`; }
    if (!isNaN(realBodyHeightRef) && realBodyHeightRef > 0) { // Still show body height if entered
         html += `<div style="font-weight: bold; margin-bottom: 5px; font-size: 0.9em; color: #555;">(真实车身参考高: ${realBodyHeightRef.toFixed(0)} mm)</div>`;
    }

    // Table Header: Segment Name, Current Render Length(px), Current Render Ratio (rel to renderRefPx), Real Ratio (rel to realBodyToBoomDist)
    html += `<table><thead><tr><th>部件(定义段)</th><th>渲染长度(px)</th><th>渲染比例</th><th>真实比例</th></tr></thead><tbody>`;

    const renderOrder = ["body", "boom", "arm", "bucket"];
    renderOrder.forEach((partName) => {
        const part = excavatorParts.find((p) => p.part === partName);
        if (!part) { html += `<tr><td>${partName}</td><td colspan="3">部件丢失</td></tr>`; return; }

        // Calculate CURRENT rendered distance using CURRENT size and ORIGINAL anchors
        const origPartConf = findOrigConf(partName);
        if (!origPartConf) { html += `<tr><td>${partName}</td><td colspan="3">原始配置丢失</td></tr>`; return; }
        const currentPixelDistance = calculatePartDistanceUsingSize(origPartConf.rotate_anchor, origPartConf.next_anchor, part.size); // Use current size

        let rowClass = !partsVisibility[partName] ? "class='inactive-part'" : "";
        const segmentNameMap = { body: "车身->大臂", boom: "大臂->小臂", arm: "小臂->铲斗", bucket: "铲斗轴->尖" };
        const segmentName = segmentNameMap[partName] || partName;

        // Calculate CURRENT rendered ratio relative to the CONSISTENT render reference (originalPxBodyBoom)
        const ratioToReferenceUnit = renderRefPx > 0 ? (currentPixelDistance / renderRefPx).toFixed(2) : 'N/A';

        // Determine which real ratio to show for this segment
        let realRatioToShow = '---';
        if (partName === 'body') realRatioToShow = realRatioBodyBoom;
        else if (partName === 'boom') realRatioToShow = realRatioBoomArm;
        else if (partName === 'arm') realRatioToShow = realRatioArmBucket;
        else if (partName === 'bucket') realRatioToShow = realRatioBucketTip;

        html += `<tr ${rowClass}><td>${segmentName}</td><td>${currentPixelDistance ? currentPixelDistance.toFixed(1) : 'N/A'}</td><td>${ratioToReferenceUnit}</td><td>${realRatioToShow}</td></tr>`;
    });
    html += "</tbody></table>";
    measurementsDiv.innerHTML = html;
}

function calculatePartsRatio() {
    const bodyPart = excavatorParts.find(p => p.part === 'body'); if (!bodyPart || !bodyPart.size) return { bodyHeight: 0, ratios: {} }; const referenceHeight = bodyPart.size[1]; const ratios = {}; if (!excavatorParts) return { bodyHeight: referenceHeight, ratios: {} }; excavatorParts.forEach((part) => { const distance = calculatePartDistanceUsingSize(part.rotate_anchor, part.next_anchor, part.size); ratios[part.part] = { pixelDistance: distance, ratio: referenceHeight > 0 ? distance / referenceHeight : 0, }; }); return { bodyHeight: referenceHeight, ratios };
}