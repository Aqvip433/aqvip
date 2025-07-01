let selectedStyle = 'style1';

window.addEventListener('DOMContentLoaded', function() {
  // Мини-превью таблиц
  drawAllPreviews();

  // Lightbox
  window.openStyleLightbox = function(idx) {
    drawLightboxPreview(idx);
    document.getElementById('styleLightbox').style.display = 'flex';
  };
  window.closeStyleLightbox = function(e) {
    if (e.target.id === 'styleLightbox' || e.target.id === 'lightboxCanvas') {
      document.getElementById('styleLightbox').style.display = 'none';
    }
  };

  // Кнопка выбрать стиль
  document.getElementById('chooseStyleBtn').onclick = function() {
    const checked = document.querySelector('input[name="tableStyle"]:checked');
    selectedStyle = checked ? checked.value : 'style1';
    document.getElementById('styleSelector').style.display = 'none';
    document.getElementById('mainInput').style.display = 'block';
  };
  // Кнопка назад
  document.getElementById('backToStyleBtn').onclick = function() {
    document.getElementById('mainInput').style.display = 'none';
    document.getElementById('styleSelector').style.display = 'block';
  };
});

// Для интеграции с основной логикой генерации
function getSelectedStyle() {
  return selectedStyle;
}
// Для использования: getSelectedStyle()

function drawAllPreviews() {
  for (let i = 1; i <= 4; i++) {
    drawPreviewTable(document.getElementById('preview'+i), 'style'+i);
  }
}
function drawLightboxPreview(idx) {
  drawPreviewTable(document.getElementById('lightboxCanvas'), 'style'+idx, true);
}

function drawPreviewTable(canvas, style, isLarge) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  // Стили
  let bg, border, text, accent, shadow;
  if (style === 'style1') { // Apple Light
    bg = '#f8f9fa'; border = '#e5e5ea'; text = '#222'; accent = '#007AFF'; shadow = 'rgba(0,0,0,0.07)';
  } else if (style === 'style2') { // Apple Dark
    bg = '#23272e'; border = '#444'; text = '#fff'; accent = '#0A84FF'; shadow = 'rgba(0,0,0,0.18)';
  } else if (style === 'style3') { // Apple Glass
    bg = 'rgba(255,255,255,0.7)'; border = '#d1d1d6'; text = '#222'; accent = '#5AC8FA'; shadow = 'rgba(90,200,250,0.10)';
  } else { // style4 Apple Minimal
    bg = '#fff'; border = '#007AFF'; text = '#007AFF'; accent = '#007AFF'; shadow = 'rgba(0,122,255,0.07)';
  }
  // Фон
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(12, 0); ctx.lineTo(w-12, 0); ctx.quadraticCurveTo(w,0,w,12);
  ctx.lineTo(w, h-12); ctx.quadraticCurveTo(w,h,w-12,h);
  ctx.lineTo(12,h); ctx.quadraticCurveTo(0,h,0,h-12);
  ctx.lineTo(0,12); ctx.quadraticCurveTo(0,0,12,0);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  // Заголовок
  ctx.font = (isLarge ? 'bold 22px' : 'bold 13px') + " -apple-system, 'Segoe UI', Arial";
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.fillText('Суббота', w/2, (isLarge ? 38 : 22));
  // Ячейки
  ctx.font = (isLarge ? '16px' : '10px') + " -apple-system, 'Segoe UI', Arial";
  ctx.fillStyle = text;
  ctx.textAlign = 'left';
  ctx.fillText('1. Физика', 18, (isLarge ? 70 : 38));
  ctx.fillText('2. Математика', 18, (isLarge ? 100 : 54));
  ctx.fillText('3. Английский', 18, (isLarge ? 130 : 70));
  // Линии
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(12, (isLarge ? 38+30*i : 22+16*i));
    ctx.lineTo(w-12, (isLarge ? 38+30*i : 22+16*i));
    ctx.stroke();
  }
}

async function generateImage() {
  const textArea = document.getElementById("inputText");
  const text = textArea.value;
  if (!text.trim()) {
    alert("Пожалуйста, вставьте текст расписания.");
    return;
  }
  document.body.style.justifyContent = 'flex-start';
  const scheduleData = parseScheduleText(text);
  const daysInSchedule = Object.keys(scheduleData);
  if (daysInSchedule.length === 0) {
      alert("Не удалось найти расписание в тексте. Убедитесь, что дни недели написаны заглавными буквами (например, ПОНЕДЕЛЬНИК).");
      return;
  }
  let callScheduleData = null;
  try {
    const response = await fetch('ras.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    callScheduleData = await response.json();
  } catch (error) {
    console.error('Failed to fetch call schedule:', error);
    alert('Не удалось загрузить расписание звонков. Проверьте, что файл ras.json доступен.');
    return;
  }
  const callScheduleColWidth = 300;
  const callScheduleHeight = estimateCallScheduleHeight(callScheduleData, callScheduleColWidth);
  const headerHeight = 70;
  const lessonRowHeight =  (1050 - headerHeight) / 6;
  const minTableHeight = headerHeight + 6 * lessonRowHeight;
  const canvasHeight = Math.max(minTableHeight, callScheduleHeight);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let style = (typeof getSelectedStyle === 'function') ? getSelectedStyle() : 'style1';
  if (style === 'style3') {
    try {
      drawScheduleGlassStyle(ctx, canvas, scheduleData, callScheduleData);
    } catch (e) {
      alert('Ошибка генерации (style3): ' + e.message);
      return;
    }
  } else {
    drawScheduleGrid(ctx, canvas, scheduleData, callScheduleData, canvasHeight, style);
  }
  const imgURL = canvas.toDataURL("image/png");
  document.getElementById("outputImg").src = imgURL;
  const downloadButton = document.getElementById("downloadButton");
  downloadButton.style.display = "inline-block";
  downloadButton.onclick = () => {
      const link = document.createElement('a');
      link.download = 'schedule.bmp';
      link.href = imgURL;
      link.click();
  };
  document.getElementById("preview").style.display = "flex";
  document.getElementById("outputImg").onclick = function() {
    openLightbox(imgURL);
  };
}

// Новый стиль glassmorphism для style3
function drawScheduleGlassStyle(ctx, canvas, scheduleData, callScheduleData) {
  // Проверки на существование всех нужных данных
  if (!callScheduleData || !callScheduleData.weekday_schedule || !callScheduleData.weekday_lunch || !callScheduleData.saturday_schedule || !callScheduleData.saturday_lunch) {
    alert('Ошибка: не удалось загрузить расписание звонков. Проверьте файл ras.json.');
    return;
  }
  // Размеры и стили
  const padding = 48;
  const blockRadius = 40;
  const blockShadow = 'rgba(0,0,0,0.10)';
  const blockBg = 'rgba(255,255,255,0.82)';
  const borderColor = '#e5e5ea';
  const accent = '#007AFF';
  const textColor = '#222';
  const days = Object.keys(scheduleData);
  const lessonsCount = 6;
  // Динамическая ширина колонки
  let minColW = 130;
  let maxDayLen = Math.max(...days.map(d => d.length));
  if (maxDayLen > 8) minColW += (maxDayLen-8)*10;
  // Если длинные предметы, увеличиваем ширину
  let maxSubjectLen = 0;
  let maxCellLines = 1;
  for (const day of days) {
    for (let l=1;l<=6;l++) {
      const lesson = scheduleData[day][String(l)];
      if (lesson && lesson.subject) {
        maxSubjectLen = Math.max(maxSubjectLen, lesson.subject.join(' ').length);
        // Оценка количества строк в ячейке
        let lines = Math.ceil(lesson.subject.join(' ').length / 18);
        if (lesson.teacher) lines++;
        if (lesson.cabinet) lines++;
        maxCellLines = Math.max(maxCellLines, lines);
      }
    }
  }
  if (maxSubjectLen > 18) minColW += (maxSubjectLen-18)*7;
  // Размеры блоков
  const colW = minColW;
  const baseRowH = 78;
  const rowH = baseRowH + (maxCellLines-1)*22;
  const tableW = 70 + days.length * colW;
  const tableH = 70 + lessonsCount * rowH;
  // Два отдельных блока звонков
  const callsW = 390;
  const callsGap = 32;
  const callsH1 = getCallsBlockHeight(callScheduleData.weekday_schedule, callScheduleData.weekday_lunch);
  const callsH2 = getCallsBlockHeight(callScheduleData.saturday_schedule, callScheduleData.saturday_lunch);
  const gap = 80;
  // Высота canvas — по максимальному из всех блоков
  canvas.width = tableW + callsW + gap + padding*2;
  canvas.height = Math.max(tableH, callsH1+callsH2+callsGap) + padding*2;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Фон
  let grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0, '#f3f6fa');
  grad.addColorStop(1, '#e9eef3');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Таблица расписания
  drawGlassBlock(ctx, padding, padding, tableW, tableH, blockRadius, blockBg, blockShadow, borderColor);
  drawGlassScheduleTable(ctx, padding, padding, tableW, tableH, scheduleData, accent, textColor, colW, baseRowH);
  // Блок звонков ПН-ПТ
  drawGlassBlock(ctx, padding+tableW+gap, padding, callsW, callsH1, blockRadius, blockBg, blockShadow, borderColor);
  drawGlassCallsBlock(ctx, padding+tableW+gap, padding, callsW, callsH1, callScheduleData.weekday_schedule, callScheduleData.weekday_lunch, accent, textColor);
  // Блок звонков Сб
  drawGlassBlock(ctx, padding+tableW+gap, padding+callsH1+callsGap, callsW, callsH2, blockRadius, blockBg, blockShadow, borderColor);
  drawGlassCallsBlock(ctx, padding+tableW+gap, padding+callsH1+callsGap, callsW, callsH2, callScheduleData.saturday_schedule, callScheduleData.saturday_lunch, accent, textColor);
}
function drawGlassBlock(ctx, x, y, w, h, r, bg, shadow, border) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
function drawGlassScheduleTable(ctx, x, y, w, h, scheduleData, accent, textColor, colW, baseRowH) {
  const days = Object.keys(scheduleData);
  ctx.font = 'bold 26px -apple-system,Segoe UI,Arial';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  // --- Вычисляем высоту каждой строки ---
  let rowHeights = [];
  for (let l = 1; l <= 6; l++) {
    let maxLines = 1;
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      const lesson = scheduleData[day][String(l)];
      if (lesson) {
        let subjectLines = wrapTextLines(ctx, lesson.subject ? lesson.subject.join(' ') : '', colW-24, 22).length;
        let teacherLines = lesson.teacher ? wrapTextLines(ctx, lesson.teacher, colW-24, 20).length : 0;
        let cabinetLine = lesson.cabinet ? 1 : 0;
        let totalLines = subjectLines + teacherLines + cabinetLine;
        maxLines = Math.max(maxLines, totalLines);
      }
    }
    rowHeights[l-1] = baseRowH + (maxLines-1)*22;
  }
  // --- Заголовки дней ---
  let headerH = 70;
  days.forEach((day, i) => {
    ctx.font = 'bold 26px -apple-system,Segoe UI,Arial';
    ctx.fillText(day.charAt(0)+day.slice(1).toLowerCase(), x+40+colW*i+colW/2, y+headerH/2);
  });
  // --- Римские номера ---
  ctx.font = 'bold 22px -apple-system,Segoe UI,Arial';
  let yCursor = y + headerH;
  for(let i=0;i<6;i++) {
    let rowH = rowHeights[i];
    ctx.fillText(['I','II','III','IV','V','VI'][i], x+28, yCursor + rowH/2);
    yCursor += rowH;
  }
  // --- Ячейки ---
  yCursor = y + headerH;
  ctx.font = '18px -apple-system,Segoe UI,Arial';
  ctx.textAlign = 'center';
  for(let l=1;l<=6;l++) {
    let rowH = rowHeights[l-1];
    for(let d=0;d<days.length;d++) {
      const day = days[d];
      const lesson = scheduleData[day][String(l)];
      if (!lesson) continue;
      let cellX = x+40+colW*d;
      let cellY = yCursor;
      let cellW = colW;
      let cellH = rowH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cellX+6, cellY+6, cellW-12, cellH-12);
      ctx.clip();
      ctx.fillStyle = textColor;
      let y0 = cellY+28+6;
      let subjectLines = wrapTextLines(ctx, lesson.subject ? lesson.subject.join(' ') : '', cellW-24, 22);
      let teacherLines = lesson.teacher ? wrapTextLines(ctx, lesson.teacher, cellW-24, 20) : [];
      let cabinetLine = lesson.cabinet ? [lesson.cabinet] : [];
      let startY = y0;
      ctx.font = 'bold 19px -apple-system,Segoe UI,Arial';
      subjectLines.forEach((line, idx) => {
        ctx.fillText(line, cellX+cellW/2, startY + idx*22);
      });
      startY += subjectLines.length*22;
      ctx.font = '17px -apple-system,Segoe UI,Arial';
      teacherLines.forEach((line, idx) => {
        ctx.fillText(line, cellX+cellW/2, startY + idx*20);
      });
      startY += teacherLines.length*20;
      cabinetLine.forEach((line, idx) => {
        ctx.fillText(line, cellX+cellW/2, startY + idx*20);
      });
      ctx.restore();
    }
    yCursor += rowH;
  }
  // --- Сетка ---
  ctx.strokeStyle = '#e5e5ea';
  ctx.lineWidth = 1.2;
  // Горизонтальные линии
  yCursor = y + headerH;
  ctx.beginPath();
  ctx.moveTo(x+40, y);
  ctx.lineTo(x+40+colW*days.length, y);
  ctx.stroke();
  for(let i=0;i<=6;i++) {
    let yLine = y + headerH + rowHeights.slice(0,i).reduce((a,b)=>a+b,0);
    ctx.beginPath();
    ctx.moveTo(x+40, yLine);
    ctx.lineTo(x+40+colW*days.length, yLine);
    ctx.stroke();
  }
  // Вертикальные линии
  for(let d=0;d<=days.length;d++) {
    ctx.beginPath();
    ctx.moveTo(x+40+colW*d, y);
    ctx.lineTo(x+40+colW*d, y+headerH+rowHeights.reduce((a,b)=>a+b,0));
    ctx.stroke();
  }
  // --- Белый фон до 6 строк ---
  let minTableH = headerH + baseRowH*6;
  let realTableH = headerH + rowHeights.reduce((a,b)=>a+b,0);
  if (realTableH < minTableH) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x+40, y+realTableH, colW*days.length, minTableH-realTableH);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
}
function wrapTextCenter(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}
function drawGlassCallsBlock(ctx, x, y, w, h, scheduleData, lunchData, accent, textColor) {
  ctx.font = 'bold 23px -apple-system,Segoe UI,Arial';
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.fillText(scheduleData.icon+' '+scheduleData.title, x+28, y+44);
  ctx.font = '18px -apple-system,Segoe UI,Arial';
  ctx.fillStyle = textColor;
  let y0 = y+70;
  scheduleData.pairs.forEach((pair,i)=>{
    ctx.font = 'bold 17px -apple-system,Segoe UI,Arial';
    ctx.fillStyle = textColor;
    ctx.fillText(pair.name, x+28, y0);
    ctx.font = '17px -apple-system,Segoe UI,Arial';
    pair.times.forEach((t,j)=>{
      ctx.fillText(t, x+140, y0+22*j);
    });
    y0+=62;
  });
  y0+=18;
  // Обеденный перерыв ПН-ПТ
  ctx.font = 'bold 18px -apple-system,Segoe UI,Arial';
  ctx.fillStyle = accent;
  ctx.fillText(lunchData.icon+' '+lunchData.title, x+28, y0);
  ctx.font = '17px -apple-system,Segoe UI,Arial';
  ctx.fillStyle = textColor;
  lunchData.times.forEach((t,j)=>{
    ctx.fillText(t, x+28, y0+22*(j+1));
  });
}

function getCallsBlockHeight(schedule, lunch) {
  // 44 на заголовок, 62 на каждую пару, 18 на отступ, 22 на каждую строку времени обеда, 32 на отступ после пар
  let h = 44 + (schedule.pairs.length * 62) + 18 + (lunch.times.length * 22) + 32;
  return h;
}

function wrapTextLines(ctx, text, maxWidth, lineHeight) {
  if (!text) return [];
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}
