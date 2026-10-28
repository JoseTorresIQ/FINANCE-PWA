// js/charts.js - Motor de Gráficos Financieros Nativos en Canvas (100% Offline-First)

const FinanceCharts = {
  // Ajustar resolución Retina / Alta densidad para que se vea ultra nítido
  setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Ancho y alto CSS
    const width = rect.width || canvas.parentElement.clientWidth || 400;
    const height = rect.height || 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height, dpr };
  },

  // Paleta de colores armoniosa para categorías
  palette: [
    '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#14b8a6', '#ef4444', '#f97316', '#6366f1',
    '#84cc16', '#a855f7', '#64748b'
  ],

  /**
   * Gráfico de Flujo de Efectivo (Ingresos vs Gastos por Mes/Día)
   */
  renderCashFlowChart(canvasId, data, isDark = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = this.setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 55;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 40;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    if (!data || !data.labels || data.labels.length === 0) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos suficientes para graficar el flujo de efectivo', width / 2, height / 2);
      return;
    }

    const { labels, incomeSeries, expenseSeries } = data;
    const maxVal = Math.max(...incomeSeries, ...expenseSeries, 500) * 1.15;

    // Colores de tema
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Dibujar líneas de guía horizontales
    const gridSteps = 4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridSteps; i++) {
      const yVal = (maxVal / gridSteps) * i;
      const yPos = padTop + chartH - (yVal / maxVal) * chartH;

      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(width - padRight, yPos);
      ctx.stroke();

      // Formato abreviado K
      const formattedVal = yVal >= 1000 ? (yVal / 1000).toFixed(1) + 'k' : Math.round(yVal);
      ctx.fillText(formattedVal, padLeft - 8, yPos + 3);
    }

    // Dibujar Barras Agrupadas: Ingresos (Esmeralda) vs Gastos (Rosa/Coral)
    const groupCount = labels.length;
    const groupWidth = chartW / groupCount;
    const barWidth = Math.min(26, groupWidth * 0.35);

    labels.forEach((label, idx) => {
      const centerX = padLeft + idx * groupWidth + groupWidth / 2;
      const incVal = incomeSeries[idx] || 0;
      const expVal = expenseSeries[idx] || 0;

      const incH = (incVal / maxVal) * chartH;
      const expH = (expVal / maxVal) * chartH;

      const incX = centerX - barWidth - 3;
      const expX = centerX + 3;

      const basePos = padTop + chartH;

      // Barra Ingreso (Verde Esmeralda)
      if (incH > 0) {
        const incGrad = ctx.createLinearGradient(0, basePos - incH, 0, basePos);
        incGrad.addColorStop(0, '#10b981');
        incGrad.addColorStop(1, 'rgba(16, 185, 129, 0.4)');
        ctx.fillStyle = incGrad;
        this.roundRect(ctx, incX, basePos - incH, barWidth, incH, 4);
      }

      // Barra Gasto (Rosa / Coral)
      if (expH > 0) {
        const expGrad = ctx.createLinearGradient(0, basePos - expH, 0, basePos);
        expGrad.addColorStop(0, '#f43f5e');
        expGrad.addColorStop(1, 'rgba(244, 63, 94, 0.4)');
        ctx.fillStyle = expGrad;
        this.roundRect(ctx, expX, basePos - expH, barWidth, expH, 4);
      }

      // Etiqueta del Eje X
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(label, centerX, height - 12);
    });

    // Leyenda superior derecha
    this.drawLegend(ctx, width - padRight - 160, 16, [
      { label: 'Ingresos', color: '#10b981' },
      { label: 'Gastos', color: '#f43f5e' }
    ], isDark);
  },

  /**
   * Gráfico Donut de Gastos por Categoría
   */
  renderCategoryDonut(canvasId, categoryData, isDark = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = this.setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!categoryData || categoryData.length === 0) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No hay gastos registrados en este período', width / 2, height / 2);
      return;
    }

    const total = categoryData.reduce((acc, c) => acc + (c.amount || 0), 0);
    if (total === 0) return;

    const centerX = width * 0.42;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) * 0.82;
    const innerRadius = outerRadius * 0.58;

    let currentAngle = -0.5 * Math.PI;

    categoryData.forEach((item, idx) => {
      const sliceAngle = (item.amount / total) * (2 * Math.PI);
      const endAngle = currentAngle + sliceAngle;
      const color = item.color || this.palette[idx % this.palette.length];

      // Dibujar rebanada Donut
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Borde sutil para separar rebanadas
      ctx.strokeStyle = isDark ? '#0b0f19' : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      currentAngle = endAngle;
    });

    // Texto central en el Donut
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Total Gastado', centerX, centerY - 10);

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(Storage.formatMoney(total), centerX, centerY + 12);

    // Leyenda interactiva al costado derecho
    this.renderDonutLegend('category-legend-list', categoryData, total);
  },

  renderDonutLegend(containerId, data, total) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    // Ordenar de mayor a menor gasto
    const sorted = [...data].sort((a, b) => b.amount - a.amount);

    sorted.slice(0, 6).forEach((item, idx) => {
      const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0;
      const color = item.color || this.palette[idx % this.palette.length];

      const itemEl = document.createElement('div');
      itemEl.className = 'donut-legend-item';
      itemEl.innerHTML = `
        <div class="legend-color-tag" style="background-color: ${color}"></div>
        <div class="legend-info">
          <span class="legend-name" title="${item.name}">${item.name}</span>
          <span class="legend-meta">${Storage.formatMoney(item.amount)} <b class="legend-pct">(${pct}%)</b></span>
        </div>
      `;
      container.appendChild(itemEl);
    });
  },

  drawLegend(ctx, x, y, items, isDark) {
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let curX = x;
    items.forEach(item => {
      // Cuadradito de color
      ctx.fillStyle = item.color;
      this.roundRect(ctx, curX, y - 4, 12, 12, 3);

      // Texto
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.fillText(item.label, curX + 18, y + 2);
      curX += ctx.measureText(item.label).width + 36;
    });
  },

  roundRect(ctx, x, y, width, height, radius) {
    if (height < radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
};
