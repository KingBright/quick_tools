// 在全局坐标系中绘制高度线
function drawHeightLines(ctx) {
  if (!debugMode) return;

  const renderOrder = ["body", "boom", "arm", "bucket"];

  // 为每个可见部件绘制高度线
  for (let i = 0; i < renderOrder.length; i++) {
    const partName = renderOrder[i];
    const part = excavatorParts.find((p) => p.part === partName);

    if (part && partsVisibility[partName]) {
      // 在全局坐标系中绘制旋转锚点到底盘的高度线
      const globalAnchorX = part.rotate_anchor_pos[0] + globalOffset.x;
      const globalAnchorY = part.rotate_anchor_pos[1] + globalOffset.y;
      const heightToGround = calculateHeightToGroundDistance(part);

      // 绘制线段
      ctx.save();
      ctx.strokeStyle = "#4682B4"; // 钢蓝色
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(globalAnchorX, globalAnchorY);
      // 保留原始绘制逻辑但移除底盘高度线
      ctx.stroke();
      ctx.setLineDash([]);

      // 标注高度
      ctx.fillStyle = "#4682B4";
      ctx.font = "10px Arial";

      // 部件的中文名称
      const partNameCN = {
        body: "驾驶舱",
        boom: "大臂",
        arm: "小臂",
        bucket: "铲斗",
      }[partName];

      // 在高度线中间位置显示高度值
      let textX = globalAnchorX + 5;

      // 根据高度值，调整标注位置
      // 如果高度为负值(低于底盘)，显示在底盘下方
      // 如果高度为正值(高于底盘)，显示在中间
      let textY;
      if (heightToGround < 0) {
        textY = (groundLine.start.y + groundLine.end.y) / 2;
      } else {
        textY = globalAnchorY + heightToChassis / 2;
      }

      // 添加正负号来指示方向
      const heightText =
        heightToGround < 0
          ? `${partNameCN}: ${Math.abs(heightToGround).toFixed(1)}px (下)`
          : `${partNameCN}: +${Math.abs(heightToGround).toFixed(1)}px (上)`;
      ctx.fillText(heightText, textX, textY);

      ctx.restore();
    }
  }
}
// 计算旋转中心到底盘的高度
function calculateHeightToGroundDistance(part) {
  // 旋转中心对应的是rotate_anchor_pos
  const height = calculateVerticalDistanceToLine(
    part.rotate_anchor_pos[0],
    part.rotate_anchor_pos[1],
    groundLine.start.x,
    groundLine.start.y,
    groundLine.end.x,
    groundLine.end.y
  );
  return height;
}

// 计算车身中心点到地面的距离
function calculateBodyToGroundDistance() {
  const bodyPart = excavatorParts.find((p) => p.part === "body");
  if (!bodyPart) return 0;

  // half of the body height
  return bodyPart.size[1] / 2;
} // 更新部件测量信息显示

function updatePartMeasurements() {
  const measurementsDiv = document.getElementById("part-measurements");
  if (!measurementsDiv) return;

  const partRatios = calculatePartsRatio();
  const bodyHeight = partRatios.bodyHeight;

  let html = `<div style="font-weight: bold; margin-bottom: 5px;">基准单位(车身到地面): ${bodyHeight.toFixed(
    1
  )}px</div>`;

  // 创建一个表格显示测量数据
  html +=
    `<table style="width: 100%; border-collapse: collapse;">` +
    `<tr style="border-bottom: 1px solid #ddd; font-weight: bold;">` +
    `<td>部件</td><td>像素距离</td><td>比例</td><td>到底盘高度</td>` +
    `</tr>`;

  // 按渲染顺序显示部件
  const renderOrder = ["body", "boom", "arm", "bucket"];

  renderOrder.forEach((partName) => {
    const part = excavatorParts.find((p) => p.part === partName);
    const info = partRatios.ratios[partName];

    // 计算旋转中心到底盘的高度
    const heightToGround = calculateHeightToGroundDistance(part);

    // 显示部件信息（即使未显示也展示其长度）
    let style = "";
    if (!partsVisibility[partName]) {
      style = "color: #999; font-style: italic;";
    }

    // 根据各部件名称提供中文名称
    const partNameCN = {
      body: "驾驶舱",
      boom: "大臂",
      arm: "小臂",
      bucket: "铲斗",
    }[partName];

    html +=
      `<tr style="${style}">` +
      `<td>${partNameCN}</td>` +
      `<td>${info.pixelDistance.toFixed(1)}px</td>` +
      `<td>${info.ratio.toFixed(2)}</td>` +
      `<td>${heightToGround.toFixed(1)}px（地面，垂直距离）</td>` +
      `</tr>`;
  });

  html += "</table>";

  measurementsDiv.innerHTML = html;
} // 计算部件的内部距离 (从旋转点到连接点)
function calculatePartDistance(part) {
  // 计算旋转点到连接点的正确比例距离
  const dx = (part.next_anchor[0] - part.rotate_anchor[0]) * part.size[0];
  const dy = (part.next_anchor[1] - part.rotate_anchor[1]) * part.size[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// 计算各部件的长度比例
function calculatePartsRatio() {
  // 获取车身中心点到地面的距离作为基准单位
  const bodyToGroundDistance = calculateBodyToGroundDistance();

  // 计算各部件的比例
  const ratios = {};
  excavatorParts.forEach((part) => {
    const distance = calculatePartDistance(part);
    ratios[part.part] = {
      pixelDistance: distance,
      ratio: distance / bodyToGroundDistance,
    };
  });

  return { bodyHeight: bodyToGroundDistance, ratios };
} // 在全局坐标系中绘制连接点，检查是否对齐
function drawConnectionPoints(ctx) {
  // 遍历每一对相邻部件
  for (let i = 0; i < excavatorParts.length - 1; i++) {
    const currentPart = excavatorParts[i];
    const nextPart = excavatorParts[i + 1];

    // 只在两个部件都显示时才绘制连接点
    if (!partsVisibility[currentPart.part] || !partsVisibility[nextPart.part]) {
      continue;
    }

    // ----- 第一个点：当前部件的next_anchor在全局坐标中的位置 -----

    // 1. 按照与calcNextAnchor完全相同的逻辑计算
    const currentRotateRad = (currentPart.rotate * Math.PI) / 180;

    // 2. 从rotate_anchor到next_anchor的相对向量
    // 与calcNextAnchor函数里的逻辑保持一致
    const translatedPoint = [
      (currentPart.next_anchor[0] - currentPart.rotate_anchor[0]) *
        currentPart.size[0],
      (currentPart.rotate_anchor[1] - currentPart.next_anchor[1]) *
        currentPart.size[1], // 翻转Y
    ];

    // 3. 应用旋转变换
    const rotatedPoint = [
      translatedPoint[0] * Math.cos(currentRotateRad) -
        translatedPoint[1] * Math.sin(currentRotateRad),
      translatedPoint[0] * Math.sin(currentRotateRad) +
        translatedPoint[1] * Math.cos(currentRotateRad),
    ];

    // 4. 计算全局next_anchor位置
    const globalNextAnchor = {
      x: rotatedPoint[0] + currentPart.rotate_anchor_pos[0] + globalOffset.x,
      y: rotatedPoint[1] + currentPart.rotate_anchor_pos[1] + globalOffset.y,
    };

    // ----- 第二个点：下一个部件的rotate_anchor_pos在全局坐标中的位置 -----
    const nextGlobalAnchor = {
      x: nextPart.rotate_anchor_pos[0] + globalOffset.x,
      y: nextPart.rotate_anchor_pos[1] + globalOffset.y,
    };

    // ----- 绘制两个点和连线 -----

    // 绘制当前部件的next_anchor点（蓝色圆点）
    ctx.save();
    ctx.fillStyle = "blue";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(globalNextAnchor.x, globalNextAnchor.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 添加标签
    ctx.fillStyle = "black";
    ctx.font = "9px Arial";
    ctx.fillText(
      `${currentPart.part} next`,
      globalNextAnchor.x + 8,
      globalNextAnchor.y - 3
    );
    ctx.restore();

    // 绘制下一个部件的rotate_anchor_pos点（紫色圆点）
    ctx.save();
    ctx.fillStyle = "purple";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(nextGlobalAnchor.x, nextGlobalAnchor.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 添加标签
    ctx.fillStyle = "black";
    ctx.font = "9px Arial";
    ctx.fillText(
      `${nextPart.part} anchor`,
      nextGlobalAnchor.x + 8,
      nextGlobalAnchor.y + 12
    );
    ctx.restore();

    // 计算两点间的距离
    const dx = nextGlobalAnchor.x - globalNextAnchor.x;
    const dy = nextGlobalAnchor.y - globalNextAnchor.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果距离超过1像素，显示红色虚线和距离
    if (distance > 1) {
      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(globalNextAnchor.x, globalNextAnchor.y);
      ctx.lineTo(nextGlobalAnchor.x, nextGlobalAnchor.y);
      ctx.stroke();

      // 显示距离
      const midX = (globalNextAnchor.x + nextGlobalAnchor.x) / 2;
      const midY = (globalNextAnchor.y + nextGlobalAnchor.y) / 2;
      ctx.fillStyle = "red";
      ctx.font = "bold 10px Arial";
      ctx.fillText(`${distance.toFixed(1)}px`, midX, midY - 5);
      ctx.restore();

      // 输出详细的坐标信息用于调试
      console.log(`连接点不匹配: ${currentPart.part} -> ${nextPart.part}`);
      console.log(
        `  ${currentPart.part} 的next_anchor:`,
        currentPart.next_anchor
      );
      console.log(
        `  ${currentPart.part} 的rotate_anchor:`,
        currentPart.rotate_anchor
      );
      console.log(`  计算的next_anchor全局坐标:`, globalNextAnchor);
      console.log(
        `  ${nextPart.part} 的rotate_anchor_pos:`,
        nextPart.rotate_anchor_pos
      );
      console.log(
        `  ${nextPart.part} rotate_anchor_pos的全局坐标:`,
        nextGlobalAnchor
      );
      console.log(`  差距: ${distance.toFixed(2)}px`);
    } else {
      // 点对齐了，显示绿色的勾
      ctx.save();
      ctx.fillStyle = "green";
      ctx.font = "bold 10px Arial";
      ctx.fillText("✓", globalNextAnchor.x + 8, globalNextAnchor.y + 3);
      ctx.restore();
    }
  }
} // 挖掘机渲染器 - 修正版
// 完全遵循Rust实现的逻辑，正确处理坐标系

// 全局变量
let excavatorParts = []; // 挖掘机部件
let excavatorImages = {}; // 挖掘机图片
let globalOffset = { x: 200, y: -80 }; // 全局偏移，对应Rust中的trans
let debugMode = false; // 调试模式
let partsVisibility = {
  // 部件显示状态
  body: true,
  boom: true,
  arm: true,
  bucket: true,
};
let originalAnchors = []; // 存储原始锚点设置
let groundLine = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }; // 地面线坐标

// HTML模板
function getExcavatorRendererHTML() {
  return `
    <div class="card">
      <h2>挖掘机侧视图渲染器</h2>
      
      <div style="display: flex; flex-direction: row;">
        <div style="flex: 1;">
          <canvas id="excavator-canvas" width="720" height="560" style="border: 1px solid #ddd; background-color: #f8f8f8;"></canvas>
        </div>
        <div style="width: 400px; padding-left: 20px;">
          <h3>控制</h3>
          
          <div class="control-section">
            <div class="section-header">
              <h4>角度控制</h4>
            </div>
            
            <div>
              <label for="cab-rotate">驾驶舱角度:</label>
              <input type="range" id="cab-rotate" min="-30" max="30" value="0" step="1">
              <span id="cab-angle-value">0°</span>
              <input type="checkbox" id="show-body" checked>
              <label for="show-body">显示</label>
            </div>
            
            <div style="margin-top: 15px;">
              <label for="boom-rotate">大臂角度:</label>
              <input type="range" id="boom-rotate" min="0" max="60" value="30" step="1">
              <span id="boom-angle-value">30°</span>
              <input type="checkbox" id="show-boom" checked>
              <label for="show-boom">显示</label>
            </div>
            
            <div style="margin-top: 15px;">
              <label for="arm-rotate">小臂角度:</label>
              <input type="range" id="arm-rotate" min="0" max="90" value="45" step="1">
              <span id="arm-angle-value">45°</span>
              <input type="checkbox" id="show-arm" checked>
              <label for="show-arm">显示</label>
            </div>
            
            <div style="margin-top: 15px;">
              <label for="bucket-rotate">铲斗角度:</label>
              <input type="range" id="bucket-rotate" min="0" max="70" value="35" step="1">
              <span id="bucket-angle-value">35°</span>
              <input type="checkbox" id="show-bucket" checked>
              <label for="show-bucket">显示</label>
            </div>
          </div>
          
          <!-- 添加测量信息区域 -->
          <div class="control-section" style="margin-top: 20px;">
            <div class="section-header">
              <h4>部件长度测量</h4>
            </div>
            <div id="part-measurements" style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">
              <!-- 这里将通过JavaScript动态填充测量数据 -->
            </div>
          </div>
          
          <div class="control-section" style="margin-top: 20px;">
            <div class="section-header">
              <h4>锚点设置</h4>
              <select id="anchor-part">
                <option value="body">驾驶舱</option>
                <option value="boom">大臂</option>
                <option value="arm">小臂</option>
                <option value="bucket">铲斗</option>
              </select>
            </div>
            
            <div style="margin-top: 10px;">
              <h5>旋转锚点 (rotate_anchor)</h5>
              <div>
                <label>X: </label>
                <input type="number" id="rotate-anchor-x" step="0.01" style="width: 70px;">
                <label style="margin-left: 15px;">Y: </label>
                <input type="number" id="rotate-anchor-y" step="0.01" style="width: 70px;">
                <button id="update-rotate-anchor" style="margin-left: 10px;">更新</button>
              </div>
            </div>
            
            <div style="margin-top: 15px;">
              <h5>连接点 (next_anchor)</h5>
              <div>
                <label>X: </label>
                <input type="number" id="next-anchor-x" step="0.01" style="width: 70px;">
                <label style="margin-left: 15px;">Y: </label>
                <input type="number" id="next-anchor-y" step="0.01" style="width: 70px;">
                <button id="update-next-anchor" style="margin-left: 10px;">更新</button>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <button onclick="resetExcavator()">重置位置</button>
            <button onclick="toggleDebugMode()" style="margin-left: 10px;">调试模式</button>
            <button onclick="applyCurrentAnchors()" style="margin-left: 10px;">应用当前锚点</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 切换调试模式
function toggleDebugMode() {
  debugMode = !debugMode;
  renderExcavator();
}

// 初始化挖掘机渲染器
async function initExcavatorRenderer() {
  try {
    // 加载配置
    const response = await fetch("./assets/config.json");
    const config = await response.json();

    // 使用Rust代码中的原始值初始化部件
    excavatorParts = [
      {
        part: "body",
        size: [215.0, 147.0],
        rotate_anchor: [0.0, 0.0],
        rotate_anchor_pos: [0.0, 0.0],
        next_anchor: [-0.18, 0.14],
        rotate: 0.0,
        center: [0.0, 0.0],
      },
      {
        part: "boom",
        size: [236.0, 166.0],
        rotate_anchor: [0.44, 0.44], // 注意：这里是右下角
        rotate_anchor_pos: [0.0, 0.0],
        next_anchor: [-0.44, -0.42], // 注意：这里是左上角
        rotate: 0.0,
        center: [0.0, 0.0],
      },
      {
        part: "arm",
        size: [32.0, 163.0],
        rotate_anchor: [0.0, 0.4], // 注意：这里是上边中点
        rotate_anchor_pos: [0.0, 0.0],
        next_anchor: [0.0, -0.45], // 注意：这里是下边中点
        rotate: 0.0,
        center: [0.0, 0.0],
      },
      {
        part: "bucket",
        size: [74.0, 74.0],
        rotate_anchor: [-0.16, 0.38], // 注意：这里是左上方
        rotate_anchor_pos: [0.0, 0.0],
        next_anchor: [0.476, -0.44], // 注意：这里是右下方
        rotate: 0.0,
        center: [0.0, 0.0],
      },
    ];

    // 备份原始锚点设置
    originalAnchors = excavatorParts.map((part) => ({
      part: part.part,
      rotate_anchor: [...part.rotate_anchor],
      next_anchor: [...part.next_anchor],
    }));

    console.log("使用的部件配置:", excavatorParts);

    // 加载图片
    await Promise.all(
      excavatorParts.map(async (partConfig) => {
        const img = new Image();
        const partName = partConfig.part;
        img.src = `./assets/${partName}.png`;

        return new Promise((resolve) => {
          img.onload = () => {
            excavatorImages[partName] = img;
            resolve();
          };
        });
      })
    );

    // 设置初始位置
    setupExcavator();

    // 添加事件监听器
    setupControlEvents();

    // 渲染初始视图
    renderExcavator();
  } catch (error) {
    console.error("Error initializing excavator renderer:", error);
  }
}

// 设置挖掘机初始位置
function setupExcavator() {
  const canvas = document.getElementById("excavator-canvas");
  const centerX = canvas.width / 3;
  const centerY = canvas.height / 2 + 50;

  // 设置主体部分的初始位置
  excavatorParts[0].rotate_anchor_pos = [centerX, centerY];
  excavatorParts[0].center = [centerX, centerY]; // 对于主体，中心就是旋转锚点位置

  // 计算其他部件的位置
  updatePartsPositions();
}

// 更新所有部件的位置
function updatePartsPositions() {
  // 从Rust代码中的update_center方法，对每个部件执行calc_next_anchor
  for (let idx = 0; idx < excavatorParts.length - 1; idx++) {
    calcNextAnchor(idx);
  }

  // 更新测量信息显示
  updatePartMeasurements();
}

// 严格按照Rust代码实现的calc_next_anchor函数
// 这个函数的目的是计算下一个部件的旋转点和中心位置
function calcNextAnchor(idx) {
  const currentPart = excavatorParts[idx];
  const nextPart = excavatorParts[idx + 1];

  // 1. 将角度转换为弧度
  const currentRotateRad = (currentPart.rotate * Math.PI) / 180;

  // 2. 计算从rotate_anchor到next_anchor的相对向量
  // 特别注意: 在图片坐标系中，Y轴向上为正，但Canvas坐标系Y轴向下为正，需要翻转Y分量
  const translatedPoint = [
    (currentPart.next_anchor[0] - currentPart.rotate_anchor[0]) *
      currentPart.size[0],
    (currentPart.rotate_anchor[1] - currentPart.next_anchor[1]) *
      currentPart.size[1], // 翻转Y
  ];

  // 3. 应用旋转变换
  const rotatedPoint = [
    translatedPoint[0] * Math.cos(currentRotateRad) -
      translatedPoint[1] * Math.sin(currentRotateRad),
    translatedPoint[0] * Math.sin(currentRotateRad) +
      translatedPoint[1] * Math.cos(currentRotateRad),
  ];

  // 4. 计算全局next_anchor位置
  const nextAnchorPos = [
    rotatedPoint[0] + currentPart.rotate_anchor_pos[0],
    rotatedPoint[1] + currentPart.rotate_anchor_pos[1],
  ];

  // 5. 更新下一个部件的rotate_anchor_pos
  nextPart.rotate_anchor_pos = nextAnchorPos;

  // 6. 为下一个部件计算中心点
  const nextRotateRad = (nextPart.rotate * Math.PI) / 180;
  const nextTranslatedPoint = [
    -nextPart.rotate_anchor[0] * nextPart.size[0],
    nextPart.rotate_anchor[1] * nextPart.size[1], // 应用Y翻转
  ];

  // 7. 应用旋转变换
  const nextRotatedPoint = [
    nextTranslatedPoint[0] * Math.cos(nextRotateRad) -
      nextTranslatedPoint[1] * Math.sin(nextRotateRad),
    nextTranslatedPoint[0] * Math.sin(nextRotateRad) +
      nextTranslatedPoint[1] * Math.cos(nextRotateRad),
  ];

  // 8. 计算中心点
  nextPart.center = [
    nextRotatedPoint[0] + nextAnchorPos[0],
    nextRotatedPoint[1] + nextAnchorPos[1],
  ];

  if (debugMode) {
    console.log(
      `[${idx}] ${currentPart.part} -> [${idx + 1}] ${nextPart.part}`
    );
    console.log(
      `  current_rotate:`,
      currentPart.rotate,
      "°, radians:",
      currentRotateRad
    );
    console.log(`  current_anchor:`, currentPart.rotate_anchor);
    console.log(`  current_next_anchor:`, currentPart.next_anchor);
    console.log(`  translated_point:`, translatedPoint);
    console.log(`  rotated_point:`, rotatedPoint);
    console.log(`  next_anchor_pos:`, nextAnchorPos);
    console.log(`  next_part.rotate_anchor:`, nextPart.rotate_anchor);
    console.log(`  next_translated_point:`, nextTranslatedPoint);
    console.log(`  next_rotated_point:`, nextRotatedPoint);
    console.log(`  next_center:`, nextPart.center);
  }
}

// 计算铲斗头部位置
function calcBucketHeadPos() {
  const bucketPart = excavatorParts[3]; // 铲斗是第4个部件（索引3）

  // 获取基于next_anchor的偏移
  const offset = {
    x: bucketPart.next_anchor[0] * bucketPart.size[0],
    y: -bucketPart.next_anchor[1] * bucketPart.size[1], // 翻转Y
  };

  // 应用旋转
  const bucketRotateRad = (bucketPart.rotate * Math.PI) / 180;
  const rotatedOffset = {
    x:
      offset.x * Math.cos(bucketRotateRad) -
      offset.y * Math.sin(bucketRotateRad),
    y:
      offset.x * Math.sin(bucketRotateRad) +
      offset.y * Math.cos(bucketRotateRad),
  };

  // 计算最终位置
  return {
    x: bucketPart.center[0] + rotatedOffset.x,
    y: bucketPart.center[1] + rotatedOffset.y,
  };
}

// 渲染挖掘机
function renderExcavator() {
  const canvas = document.getElementById("excavator-canvas");
  const ctx = canvas.getContext("2d");

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 获取机身部件和旋转角度
  const bodyPart = excavatorParts.find((p) => p.part === "body");
  const bodyRotateRad = (bodyPart.rotate * Math.PI) / 180; // 转换为弧度

  // 计算旋转中心到机身底部的距离
  const h = bodyPart.size[1] / 2; // 旋转中心到机身底部的距离

  // 计算旋转中心在下边沿上的垂直落点
  const rotationCenterX = bodyPart.rotate_anchor_pos[0] + globalOffset.x;
  const rotationCenterY = bodyPart.rotate_anchor_pos[1] + globalOffset.y;

  // 使用公式计算地面线的起点和终点
  // 地面线应该通过点(rotationCenterX - h*sin(bodyRotateRad), rotationCenterY + h*cos(bodyRotateRad))
  // 这个点就是机身底部与地面的接触点
  const groundPointX = rotationCenterX - h * Math.sin(bodyRotateRad);
  const groundPointY = rotationCenterY + h * Math.cos(bodyRotateRad);

  // 更新chassisLevel为地面线的高度，这样只会有一条线
  // 计算地面线的方向向量（平行于机身底部）
  const groundLineAngle = bodyRotateRad; // 平行于机身底部
  const lineLength = canvas.width * 2; // 足够长的线

  // 计算地面线的起点和终点
  const startX = groundPointX - (Math.cos(groundLineAngle) * lineLength) / 2;
  const startY = groundPointY - (Math.sin(groundLineAngle) * lineLength) / 2;
  const endX = groundPointX + (Math.cos(groundLineAngle) * lineLength) / 2;
  const endY = groundPointY + (Math.sin(groundLineAngle) * lineLength) / 2;

  groundLine.start = { x: startX, y: startY };
  groundLine.end = { x: endX, y: endY };

  // 绘制地面线
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = "#8B4513"; // 深棕色
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制地面纹理（沿着地面线方向）
  const textureSpacing = 20; // 纹理间距
  const textureLength = 10; // 纹理长度

  // 计算纹理的方向向量（与地面线呈现固定夹角）
  const textureAngle = bodyRotateRad + Math.PI / 4; // 45度夹角
  const textureVectorX = Math.cos(textureAngle);
  const textureVectorY = Math.sin(textureAngle);

  // 计算纹理的数量
  const textureCount = Math.floor(lineLength / textureSpacing);

  // 确保纹理均匀分布在地面线上
  for (let i = 0; i < textureCount; i++) {
    // 计算纹理在地面线上的位置（均匀分布）
    const t = i / (textureCount - 1); // 归一化参数 [0,1]
    const posX = startX + t * (endX - startX);
    const posY = startY + t * (endY - startY);

    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(
      posX + textureLength * textureVectorX,
      posY + textureLength * textureVectorY
    );
    ctx.strokeStyle = "#A0522D"; // 棕色
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 添加地面线标签
  ctx.font = "12px Arial";
  ctx.fillStyle = "#8B4513";
  ctx.fillText("地面线", groundPointX + 15, groundPointY - 5);
  ctx.restore();

  // 按照正确的顺序绘制部件（先背景部件，后前景部件）
  const renderOrder = ["body", "boom", "arm", "bucket"];

  for (let i = 0; i < renderOrder.length; i++) {
    const partName = renderOrder[i];
    const part = excavatorParts.find((p) => p.part === partName);

    // 检查部件是否应该显示
    if (part && excavatorImages[partName] && partsVisibility[partName]) {
      drawPart(ctx, part, excavatorImages[partName]);
    }
  }

  // 绘制铲斗头部位置标记 (当铲斗显示时)
  if (partsVisibility.bucket) {
    const headPos = calcBucketHeadPos();
    ctx.save();
    ctx.fillStyle = "#FF6600"; // 橙色
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      headPos.x + globalOffset.x,
      headPos.y + globalOffset.y,
      7,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 在全局坐标系中绘制连接点，用于检查对齐情况
  if (debugMode) {
    drawConnectionPoints(ctx);
    // 完全移除高度线绘制，只保留地面线
  }

  // 调试模式下显示额外信息
  if (debugMode) {
    drawDebugInfo(ctx, headPos);
  }

  // 始终更新测量信息显示（无论是否在调试模式）
  updatePartMeasurements();
}

// 绘制单个部件
function drawPart(ctx, part, image) {
  ctx.save();

  // 移动到旋转锚点位置（应用全局偏移）
  ctx.translate(
    part.rotate_anchor_pos[0] + globalOffset.x,
    part.rotate_anchor_pos[1] + globalOffset.y
  );

  // 旋转
  ctx.rotate((part.rotate * Math.PI) / 180);

  // 计算图片的尺寸
  const width = part.size[0];
  const height = part.size[1];

  // 计算图片左上角的位置
  // 在图片坐标系中，左上角是(-0.5, 0.5)，原点(0,0)在中心
  // 从旋转锚点到左上角的向量是：(-0.5-rotate_anchor[0], 0.5-rotate_anchor[1])
  // 由于Canvas坐标系Y轴向下为正，与图片坐标系Y轴向上为正相反，
  // 所以Y轴方向需要取反，变成(0.5-rotate_anchor[1])取负 -> (rotate_anchor[1]-0.5)
  const offsetX = (-0.5 - part.rotate_anchor[0]) * width;
  const offsetY = (part.rotate_anchor[1] - 0.5) * height;

  // 调试信息
  if (debugMode) {
    console.log(`绘制 ${part.part}:`);
    console.log(
      `  rotate_anchor: [${part.rotate_anchor[0]}, ${part.rotate_anchor[1]}]`
    );
    console.log(`  size: [${width}, ${height}]`);
    console.log(`  offsetX: ${offsetX}, offsetY: ${offsetY}`);
  }

  // 绘制图片
  ctx.drawImage(image, offsetX, offsetY, width, height);

  // 调试模式下绘制辅助线和点
  if (debugMode) {
    drawDebugPoints(ctx, part, width, height, offsetX, offsetY);
  }

  ctx.restore();
}

// 绘制调试点
function drawDebugPoints(ctx, part, width, height, offsetX, offsetY) {
  // 绘制旋转锚点（红色）
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // 绘制图片中心（黄色）
  // 中心相对于旋转锚点的向量：-rotate_anchor * size
  // 在转换到Canvas坐标系时，需要对Y轴取反
  const centerX = -part.rotate_anchor[0] * width;
  const centerY = part.rotate_anchor[1] * height; // Y轴方向取反（这是关键）
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 绘制下一个锚点（绿色）
  // next_anchor相对于rotate_anchor的向量：(next_anchor - rotate_anchor) * size
  // 在转换到Canvas坐标系时，需要对Y轴取反
  const nextAnchorX = (part.next_anchor[0] - part.rotate_anchor[0]) * width;
  const nextAnchorY = (part.rotate_anchor[1] - part.next_anchor[1]) * height; // Y轴方向取反（修正）

  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(nextAnchorX, nextAnchorY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 显示坐标（调试用）
  if (debugMode) {
    ctx.fillStyle = "black";
    ctx.font = "9px Arial";
    ctx.fillText(
      `(${nextAnchorX.toFixed(0)},${nextAnchorY.toFixed(0)})`,
      nextAnchorX + 5,
      nextAnchorY - 5
    );
  }

  // 绘制边界框
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, width, height);

  // 显示部件名称
  ctx.fillStyle = "black";
  ctx.font = "10px Arial";
  ctx.fillText(part.part, 10, 10);
  ctx.fillText(`rotate: ${part.rotate.toFixed(1)}°`, 10, 25);
}

// 绘制调试信息
function drawDebugInfo(ctx, headPos) {
  ctx.save();
  ctx.font = "12px monospace";
  ctx.fillStyle = "#000";

  let y = 20;
  const x = 10;
  const lineHeight = 16;

  // 显示角度信息
  ctx.fillText(`调试模式开启`, x, y);
  y += lineHeight;

  // 计算相对角度
  const cabSlider = document.getElementById("cab-rotate");
  const boomSlider = document.getElementById("boom-rotate");
  const armSlider = document.getElementById("arm-rotate");
  const bucketSlider = document.getElementById("bucket-rotate");

  const cabRelative = parseInt(cabSlider.value);
  const boomRelative = parseInt(boomSlider.value);
  const armRelative = parseInt(armSlider.value);
  const bucketRelative = parseInt(bucketSlider.value);

  ctx.fillText(
    `驾驶舱: ${cabRelative}° (绝对: ${excavatorParts[0].rotate.toFixed(1)}°)`,
    x,
    y
  );
  y += lineHeight;
  ctx.fillText(
    `大臂: ${boomRelative}° (绝对: ${excavatorParts[1].rotate.toFixed(1)}°)`,
    x,
    y
  );
  y += lineHeight;
  ctx.fillText(
    `小臂: ${armRelative}° (绝对: ${excavatorParts[2].rotate.toFixed(1)}°)`,
    x,
    y
  );
  y += lineHeight;
  ctx.fillText(
    `铲斗: ${bucketRelative}° (绝对: ${excavatorParts[3].rotate.toFixed(1)}°)`,
    x,
    y
  );
  y += lineHeight * 1.5;

  // 显示铲斗头部位置（当铲斗显示时）
  if (partsVisibility.bucket) {
    ctx.fillText(
      `铲斗头部位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`,
      x,
      y
    );
  } else {
    ctx.fillText(`铲斗未显示`, x, y);
  }
  y += lineHeight * 1.5;

  // 计算并显示部件长度比例
  const partRatios = calculatePartsRatio();
  const bodyHeight = partRatios.bodyHeight;

  ctx.fillText(`部件长度分析`, x, y);
  y += lineHeight;
  ctx.fillText(`基准单位(车身到地面): ${bodyHeight.toFixed(1)}px`, x, y);
  y += lineHeight;
  ctx.fillText(`地面线高度: ${groundLine.start.y.toFixed(1)}px`, x, y);
  y += lineHeight;

  for (let i = 0; i < excavatorParts.length; i++) {
    const part = excavatorParts[i];
    const info = partRatios.ratios[part.part];

    // 只显示激活的部件信息
    if (partsVisibility[part.part]) {
      const height = calculateHeightToChassis(part).toFixed(1);
      ctx.fillText(
        `${part.part}: ${info.pixelDistance.toFixed(
          1
        )}px (比例: ${info.ratio.toFixed(2)}, 高度: ${height}px)`,
        x,
        y
      );
      y += lineHeight;
    }
  }
  y += lineHeight;

  // 显示各部件的rotate_anchor_pos和center
  ctx.fillText(`部件位置信息:`, x, y);
  y += lineHeight;

  for (let i = 0; i < excavatorParts.length; i++) {
    const part = excavatorParts[i];

    // 只显示已启用的部件信息
    if (partsVisibility[part.part]) {
      ctx.fillText(
        `${part.part} anchor_pos: (${part.rotate_anchor_pos[0].toFixed(
          1
        )}, ${part.rotate_anchor_pos[1].toFixed(1)})`,
        x,
        y
      );
      y += lineHeight;
      ctx.fillText(
        `${part.part} center: (${part.center[0].toFixed(
          1
        )}, ${part.center[1].toFixed(1)})`,
        x,
        y
      );
      y += lineHeight;
    } else {
      ctx.fillText(`${part.part}: 未显示`, x, y);
      y += lineHeight;
    }
  }
  y += lineHeight;

  // 显示颜色图例
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(`  - 红色点: 旋转锚点 (rotate_anchor)`, x + 15, y + 8);
  y += lineHeight;

  ctx.fillStyle = "green";
  ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(`  - 绿色点: 下一个部件连接点 (next_anchor)`, x + 15, y + 8);
  y += lineHeight;

  ctx.fillStyle = "yellow";
  ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(`  - 黄色点: 图片中心点`, x + 15, y + 8);
  y += lineHeight;

  ctx.fillStyle = "#FF6600";
  ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(`  - 橙色点: 铲斗末端点`, x + 15, y + 8);
  y += lineHeight;

  ctx.fillStyle = "#4682B4";
  ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(`  - 蓝色虚线: 到底盘高度`, x + 15, y + 8);

  ctx.restore();

  // 绘制全局偏移点
  ctx.save();
  ctx.beginPath();
  ctx.arc(globalOffset.x, globalOffset.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
  ctx.fill();
  ctx.restore();
}

// 更新挖掘机角度
function updateExcavatorAngles() {
  const cabRotate = document.getElementById("cab-rotate");
  const boomRotate = document.getElementById("boom-rotate");
  const armRotate = document.getElementById("arm-rotate");
  const bucketRotate = document.getElementById("bucket-rotate");

  const cabAngleValue = document.getElementById("cab-angle-value");
  const boomAngleValue = document.getElementById("boom-angle-value");
  const armAngleValue = document.getElementById("arm-angle-value");
  const bucketAngleValue = document.getElementById("bucket-angle-value");

  // 获取角度值
  const cabAngle = parseInt(cabRotate.value);
  const boomAngle = parseInt(boomRotate.value);
  const armAngle = parseInt(armRotate.value);
  const bucketAngle = parseInt(bucketRotate.value);

  // 更新角度，考虑关节角度的叠加关系
  // 驾驶舱角度
  excavatorParts[0].rotate = cabAngle;

  // 大臂角度 = 驾驶舱角度 + 大臂相对角度
  const boomRelativeAngle = -30 + boomAngle;
  excavatorParts[1].rotate = cabAngle + boomRelativeAngle;

  // 小臂角度 = 大臂角度 + 小臂相对角度
  const armRelativeAngle = -90 + armAngle;
  excavatorParts[2].rotate = excavatorParts[1].rotate + armRelativeAngle;

  // 铲斗角度 = 小臂角度 + 铲斗相对角度
  const bucketRelativeAngle = -125 + bucketAngle;
  excavatorParts[3].rotate = excavatorParts[2].rotate + bucketRelativeAngle;

  // 显示角度值（展示相对角度和绝对角度）
  cabAngleValue.textContent = `${cabAngle}° (绝对: ${excavatorParts[0].rotate.toFixed(
    1
  )}°)`;
  boomAngleValue.textContent = `${boomAngle}° (绝对: ${excavatorParts[1].rotate.toFixed(
    1
  )}°)`;
  armAngleValue.textContent = `${armAngle}° (绝对: ${excavatorParts[2].rotate.toFixed(
    1
  )}°)`;
  bucketAngleValue.textContent = `${bucketAngle}° (绝对: ${excavatorParts[3].rotate.toFixed(
    1
  )}°)`;

  // 重置主体位置的center（保持不变）
  const bodyCenter = excavatorParts[0].center.slice();

  // 重新计算所有部件的位置
  updatePartsPositions();

  // 渲染更新后的挖掘机
  renderExcavator();
}

// 设置控制事件监听器
function setupControlEvents() {
  // 角度控制
  const cabRotate = document.getElementById("cab-rotate");
  const boomRotate = document.getElementById("boom-rotate");
  const armRotate = document.getElementById("arm-rotate");
  const bucketRotate = document.getElementById("bucket-rotate");

  cabRotate.addEventListener("input", updateExcavatorAngles);
  boomRotate.addEventListener("input", updateExcavatorAngles);
  armRotate.addEventListener("input", updateExcavatorAngles);
  bucketRotate.addEventListener("input", updateExcavatorAngles);

  // 部件显示控制
  const showBody = document.getElementById("show-body");
  const showBoom = document.getElementById("show-boom");
  const showArm = document.getElementById("show-arm");
  const showBucket = document.getElementById("show-bucket");

  showBody.addEventListener("change", updatePartsVisibility);
  showBoom.addEventListener("change", updatePartsVisibility);
  showArm.addEventListener("change", updatePartsVisibility);
  showBucket.addEventListener("change", updatePartsVisibility);

  // 锚点设置相关
  const anchorPartSelect = document.getElementById("anchor-part");
  const updateRotateAnchorBtn = document.getElementById("update-rotate-anchor");
  const updateNextAnchorBtn = document.getElementById("update-next-anchor");

  // 选择部件时更新锚点设置显示
  anchorPartSelect.addEventListener("change", updateAnchorInputs);

  // 更新锚点按钮
  updateRotateAnchorBtn.addEventListener("click", updateRotateAnchor);
  updateNextAnchorBtn.addEventListener("click", updateNextAnchor);

  // 初始化锚点输入框
  updateAnchorInputs();
}

// 更新部件显示状态
function updatePartsVisibility() {
  partsVisibility.body = document.getElementById("show-body").checked;
  partsVisibility.boom = document.getElementById("show-boom").checked;
  partsVisibility.arm = document.getElementById("show-arm").checked;
  partsVisibility.bucket = document.getElementById("show-bucket").checked;

  renderExcavator();
}

// 更新锚点输入框显示
function updateAnchorInputs() {
  const selectedPart = document.getElementById("anchor-part").value;
  const part = excavatorParts.find((p) => p.part === selectedPart);

  if (part) {
    // 设置旋转锚点输入框
    document.getElementById("rotate-anchor-x").value = part.rotate_anchor[0];
    document.getElementById("rotate-anchor-y").value = part.rotate_anchor[1];

    // 设置连接点输入框
    document.getElementById("next-anchor-x").value = part.next_anchor[0];
    document.getElementById("next-anchor-y").value = part.next_anchor[1];
  }
}

// 更新旋转锚点
function updateRotateAnchor() {
  const selectedPart = document.getElementById("anchor-part").value;
  const part = excavatorParts.find((p) => p.part === selectedPart);

  if (part) {
    const x = parseFloat(document.getElementById("rotate-anchor-x").value);
    const y = parseFloat(document.getElementById("rotate-anchor-y").value);

    if (!isNaN(x) && !isNaN(y)) {
      part.rotate_anchor = [x, y];
      updatePartsPositions();
      renderExcavator();
    }
  }
}

// 更新连接点
function updateNextAnchor() {
  const selectedPart = document.getElementById("anchor-part").value;
  const part = excavatorParts.find((p) => p.part === selectedPart);

  if (part) {
    const x = parseFloat(document.getElementById("next-anchor-x").value);
    const y = parseFloat(document.getElementById("next-anchor-y").value);

    if (!isNaN(x) && !isNaN(y)) {
      part.next_anchor = [x, y];
      updatePartsPositions();
      renderExcavator();
    }
  }
}

// 重置到原始锚点设置
function resetToOriginalAnchors() {
  originalAnchors.forEach((originalPart) => {
    const part = excavatorParts.find((p) => p.part === originalPart.part);
    if (part) {
      part.rotate_anchor = [...originalPart.rotate_anchor];
      part.next_anchor = [...originalPart.next_anchor];
    }
  });

  updateAnchorInputs();
  updatePartsPositions();
  renderExcavator();
}

// 应用当前锚点设置
function applyCurrentAnchors() {
  const anchorsJSON = JSON.stringify(
    excavatorParts.map((part) => ({
      part: part.part,
      rotate_anchor: part.rotate_anchor,
      next_anchor: part.next_anchor,
    })),
    null,
    2
  );

  console.log("\u5f53\u524d\u951a\u70b9\u8bbe\u7f6e:\n", anchorsJSON);
  alert(
    "\u5f53\u524d\u951a\u70b9\u8bbe\u7f6e\u5df2\u8f93\u51fa\u5230\u63a7\u5236\u53f0"
  );
}

// 重置挖掘机到默认位置
function resetExcavator() {
  // 重置角度
  document.getElementById("cab-rotate").value = "0";
  document.getElementById("boom-rotate").value = "30";
  document.getElementById("arm-rotate").value = "45";
  document.getElementById("bucket-rotate").value = "35";

  // 重置部件显示状态
  document.getElementById("show-body").checked = true;
  document.getElementById("show-boom").checked = true;
  document.getElementById("show-arm").checked = true;
  document.getElementById("show-bucket").checked = true;

  partsVisibility = {
    body: true,
    boom: true,
    arm: true,
    bucket: true,
  };

  // 重置锚点设置
  resetToOriginalAnchors();

  // 更新角度和渲染
  updateExcavatorAngles();
}

function calculateVerticalDistanceToLine(x, y, startX, startY, endX, endY) {
  // 计算直线方程 Ax + By + C = 0
  const A = endY - startY;
  const B = startX - endX;
  const C = endX * startY - startX * endY;

  // 计算分子绝对值
  const numerator = A * x + B * y + C;
  // 计算分母（直线长度）
  const denominator = Math.sqrt(A * A + B * B);

  // 返回带符号的距离（线上为正，线下为负）
  return numerator / denominator;
}
