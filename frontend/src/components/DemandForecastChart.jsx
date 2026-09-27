import React, { useState, useId } from 'react';
import { 
  TrendingUp, 
  Zap,
  Info
} from 'lucide-react';
import { GROCERY_CATALOG, WAREHOUSE_OPTIONS, CATEGORIES } from '../data/presets';
import { generateLiveForecast } from '../services/api';

// Helper to format dates cleanly and uniformly (e.g., "2026-09-13" -> "Sep 13")
function formatChartDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[monthIdx] || parts[1];
  return `${monthName} ${day < 10 ? '0' + day : day}`;
}

export default function DemandForecastChart({ onSelectSkuForStudio: _onSelectSkuForStudio, showHeader = true }) {
  const [selectedSku, setSelectedSku] = useState('SKU_1');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [horizonDays, setHorizonDays] = useState(7); // 7, 14, 30
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [livePredictions, setLivePredictions] = useState({});
  const [isInferring, setIsInferring] = useState(false);

  const filterId = useId();

  // Find currently selected item
  const currentItem = GROCERY_CATALOG.find(i => i.sku === selectedSku) || GROCERY_CATALOG[0];

  // Filtered SKUs for dropdown
  const filteredCatalog = GROCERY_CATALOG.filter(item => {
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchWarehouse = selectedWarehouse === 'ALL' || item.warehouse === selectedWarehouse;
    return matchCategory && matchWarehouse;
  });

  // Prepare chart series
  const historySeries = currentItem.history || [];
  
  // Future forecast: if live inference exists for this SKU & horizon, use it, else use baseline catalog projections
  const liveSeriesForSku = livePredictions[selectedSku];
  const fullFutureSeries = (liveSeriesForSku && liveSeriesForSku.length >= horizonDays)
    ? liveSeriesForSku.slice(0, horizonDays)
    : (currentItem.futureForecast || []).slice(0, horizonDays);

  // Trigger live multi-step XGBoost inference from FastAPI
  const handleRunLiveInference = async () => {
    setIsInferring(true);
    try {
      const res = await generateLiveForecast(currentItem, horizonDays);
      if (res && res.length > 0) {
        setLivePredictions(prev => ({
          ...prev,
          [selectedSku]: res,
        }));
      }
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setIsInferring(false);
    }
  };

  // Combine data for plotting
  const combinedPoints = [
    ...historySeries.map(p => ({
      date: p.date,
      formattedDate: formatChartDate(p.date),
      actual: p.actual,
      predicted: null,
      lower: null,
      upper: null,
      type: 'history',
    })),
    // Stitch connection point on current day
    ...(historySeries.length > 0 && fullFutureSeries.length > 0 ? [{
      date: fullFutureSeries[0].date,
      formattedDate: formatChartDate(fullFutureSeries[0].date),
      actual: historySeries[historySeries.length - 1].actual,
      predicted: fullFutureSeries[0].predicted,
      lower: fullFutureSeries[0].lower,
      upper: fullFutureSeries[0].upper,
      type: 'bridge',
    }] : []),
    ...fullFutureSeries.slice(1).map(p => ({
      date: p.date,
      formattedDate: formatChartDate(p.date),
      actual: null,
      predicted: p.predicted,
      lower: p.lower,
      upper: p.upper,
      type: 'forecast',
    })),
  ];

  // Calculate chart bounds
  const allValues = [
    ...historySeries.map(h => h.actual),
    ...fullFutureSeries.map(f => f.predicted),
    ...fullFutureSeries.map(f => f.upper || f.predicted),
  ];
  const maxVal = Math.ceil((Math.max(...allValues, 100) * 1.15) / 20) * 20;
  const minVal = Math.floor((Math.min(...allValues, 20) * 0.8) / 20) * 20;

  // SVG dimensions
  const svgWidth = 920;
  const svgHeight = 290;
  const padding = { top: 32, right: 35, bottom: 40, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / Math.max(1, combinedPoints.length - 1)) * plotWidth;
  const getY = (val) => padding.top + plotHeight - ((val - minVal) / Math.max(1, maxVal - minVal)) * plotHeight;

  // Build SVG Paths
  const historyIndices = combinedPoints
    .map((pt, i) => (pt.actual !== null ? { x: getX(i), y: getY(pt.actual), i } : null))
    .filter(Boolean);

  const historyPath = historyIndices.length > 0
    ? historyIndices.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const historyAreaPath = historyIndices.length > 0
    ? `${historyPath} L ${historyIndices[historyIndices.length - 1].x} ${padding.top + plotHeight} L ${historyIndices[0].x} ${padding.top + plotHeight} Z`
    : '';

  const forecastIndices = combinedPoints
    .map((pt, i) => (pt.predicted !== null ? { x: getX(i), y: getY(pt.predicted), i, lower: pt.lower, upper: pt.upper } : null))
    .filter(Boolean);

  const forecastPath = forecastIndices.length > 0
    ? forecastIndices.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const forecastUpper = forecastIndices.map(curr => `${curr.x} ${getY(curr.upper || curr.predicted)}`).join(' L ');
  const forecastLower = [...forecastIndices].reverse().map(curr => `${curr.x} ${getY(curr.lower || curr.predicted)}`).join(' L ');
  const forecastConfidenceBand = forecastIndices.length > 0
    ? `M ${forecastUpper} L ${forecastLower} Z`
    : '';

  // Forecast split index (where forecast starts)
  const splitPoint = historyIndices.length > 0 ? historyIndices[historyIndices.length - 1] : null;

  // Summary calculations
  const totalForecastUnits = fullFutureSeries.reduce((sum, item) => sum + item.predicted, 0);
  const avgForecastDaily = Math.round(totalForecastUnits / Math.max(1, fullFutureSeries.length));
  const recentHistoryAvg = Math.round(
    historySeries.slice(-7).reduce((sum, h) => sum + h.actual, 0) / Math.max(1, Math.min(7, historySeries.length))
  );
  const deltaPct = recentHistoryAvg > 0
    ? (((avgForecastDaily - recentHistoryAvg) / recentHistoryAvg) * 100).toFixed(1)
    : 0;
  const isIncreasing = deltaPct >= 0;

  return (
    <div className="pro-card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
      {/* 1. Header (when enabled) */}
      {showHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--cyan, #06b6d4)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Demand Forecast
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Historical daily sales actuals vs multi-day projected consumer demand.
            </p>
          </div>

          {/* Horizon Toggle & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Horizon:
            </span>
            <div className="toggle-pills">
              {[7, 14, 30].map(h => (
                <button
                  key={h}
                  type="button"
                  id={`forecast-horizon-${h}d`}
                  className={`toggle-pill-btn ${horizonDays === h ? 'active' : ''}`}
                  onClick={() => setHorizonDays(h)}
                >
                  {h} Days
                </button>
              ))}
            </div>

            <button
              type="button"
              className="submit-btn"
              style={{ width: 'auto', padding: '6px 14px', fontSize: '0.76rem', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={handleRunLiveInference}
              disabled={isInferring}
            >
              {isInferring ? (
                <>
                  <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                  <span>Forecasting...</span>
                </>
              ) : (
                <>
                  <Zap size={13} />
                  <span>Update Forecast</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Sleek Filter Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* SKU Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor={`sku-${filterId}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Select SKU:
            </label>
            <select
              id={`sku-${filterId}`}
              className="pro-select"
              style={{ width: '260px' }}
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
            >
              {filteredCatalog.map(item => (
                <option key={item.sku} value={item.sku}>
                  {item.sku} &ndash; {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor={`cat-${filterId}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Category:
            </label>
            <select
              id={`cat-${filterId}`}
              className="pro-select"
              style={{ width: '140px' }}
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const first = GROCERY_CATALOG.find(i => (e.target.value === 'ALL' || i.category === e.target.value) && (selectedWarehouse === 'ALL' || i.warehouse === selectedWarehouse));
                if (first) setSelectedSku(first.sku);
              }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Warehouse Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor={`wh-${filterId}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Warehouse:
            </label>
            <select
              id={`wh-${filterId}`}
              className="pro-select"
              style={{ width: '120px' }}
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                const first = GROCERY_CATALOG.find(i => (selectedCategory === 'ALL' || i.category === selectedCategory) && (e.target.value === 'ALL' || i.warehouse === e.target.value));
                if (first) setSelectedSku(first.sku);
              }}
            >
              <option value="ALL">All Hubs</option>
              {WAREHOUSE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.74rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '3px', background: '#06b6d4', borderRadius: '2px' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Historical Actuals</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '3px', borderTop: '2.5px dashed #818cf8' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Projected Forecast</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '10px', background: 'rgba(129, 140, 248, 0.15)', border: '1px solid rgba(129, 140, 248, 0.4)', borderRadius: '2px' }}></span>
            <span style={{ color: 'var(--text-tertiary)' }}>Confidence Band (&plusmn;10%)</span>
          </div>
        </div>
      </div>

      {/* 3. SVG High-Fidelity Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '700px' }}
        >
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="forecastBandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + plotHeight * ratio;
            const val = Math.round(maxVal - (maxVal - minVal) * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  opacity="0.45"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill="var(--text-tertiary)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Vertical "Today / Forecast Start" Dividing Marker Line */}
          {splitPoint && (
            <g>
              <line
                x1={splitPoint.x}
                y1={padding.top}
                x2={splitPoint.x}
                y2={padding.top + plotHeight}
                stroke="#818cf8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <rect
                x={splitPoint.x - 48}
                y={padding.top - 18}
                width="96"
                height="16"
                rx="3"
                fill="var(--bg-card)"
                stroke="#818cf8"
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={splitPoint.x}
                y={padding.top - 7}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                fill="#818cf8"
                letterSpacing="0.02em"
              >
                FORECAST START
              </text>
            </g>
          )}

          {/* Forecast Confidence Band */}
          {forecastConfidenceBand && (
            <path d={forecastConfidenceBand} fill="url(#forecastBandGradient)" />
          )}

          {/* Historical Shaded Area */}
          {historyAreaPath && (
            <path d={historyAreaPath} fill="url(#historyGradient)" />
          )}

          {/* Historical Demand Solid Line */}
          {historyPath && (
            <path
              d={historyPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Historical Data Points */}
          {historyIndices.map((pt) => (
            <circle
              key={pt.i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#06b6d4"
              stroke="var(--bg-card)"
              strokeWidth="1.5"
            />
          ))}

          {/* Forecasted Demand Dashed Line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Forecast Data Marker Points */}
          {forecastIndices.map((pt) => (
            <rect
              key={pt.i}
              x={pt.x - 3}
              y={pt.y - 3}
              width="6"
              height="6"
              fill="#818cf8"
              stroke="var(--bg-card)"
              strokeWidth="1"
              transform={`rotate(45 ${pt.x} ${pt.y})`}
            />
          ))}

          {/* Consistent, Professionally Formatted X-Axis Dates */}
          {combinedPoints.map((pt, i) => {
            const step = combinedPoints.length > 20 ? 4 : 2;
            if (i % step !== 0 && i !== combinedPoints.length - 1) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 14}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-sans)"
                fill="var(--text-tertiary)"
                fontWeight="500"
              >
                {pt.formattedDate}
              </text>
            );
          })}

          {/* Invisible Overlay for Mouse Hover */}
          {combinedPoints.map((pt, i) => {
            const x = getX(i);
            const width = plotWidth / combinedPoints.length;
            return (
              <rect
                key={i}
                x={x - width / 2}
                y={padding.top}
                width={width}
                height={plotHeight}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHoveredPoint({ ...pt, x, y: pt.actual !== null ? getY(pt.actual) : getY(pt.predicted) })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Hover Crosshair & Dot */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + plotHeight}
                stroke="var(--text-secondary)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#ffffff"
                stroke={hoveredPoint.actual !== null ? '#06b6d4' : '#818cf8'}
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px 14px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.78rem',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {hoveredPoint.formattedDate}
            </div>
            {hoveredPoint.actual !== null ? (
              <div style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }}></span>
                <span>Actual Demand: <strong>{hoveredPoint.actual} units</strong></span>
              </div>
            ) : (
              <div style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', transform: 'rotate(45deg)', background: '#818cf8' }}></span>
                <span>Projected Demand: <strong>{hoveredPoint.predicted} units</strong></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                  ({hoveredPoint.lower}&ndash;{hoveredPoint.upper} u)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Three Clean, Understandable Forecast Metric Cards */}
      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {/* Card 1: Forecast Horizon */}
          <div className="metric-pill-card" style={{ padding: '12px 14px' }}>
            <span className="metric-pill-title">Forecast Horizon</span>
            <div className="metric-pill-value" style={{ color: 'var(--text-primary)' }}>
              {horizonDays} Days
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Forward projected window
            </span>
          </div>

          {/* Card 2: Total Forecast Units */}
          <div className="metric-pill-card" style={{ padding: '12px 14px' }}>
            <span className="metric-pill-title">Total Projected Demand</span>
            <div className="metric-pill-value" style={{ color: 'var(--brand-primary, #0284c7)' }}>
              {totalForecastUnits}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>units</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Average {avgForecastDaily} units / day
            </span>
          </div>

          {/* Card 3: Demand Trend */}
          <div className="metric-pill-card" style={{ padding: '12px 14px' }}>
            <span className="metric-pill-title">Demand Trend</span>
            <div className="metric-pill-value" style={{ color: isIncreasing ? 'var(--success, #10b981)' : 'var(--warning, #f59e0b)' }}>
              {isIncreasing ? 'Increasing' : 'Decreasing'}
              <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                ({deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`})
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              vs 7-day historical baseline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
