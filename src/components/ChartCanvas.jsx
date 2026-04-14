import { useRef, useEffect } from 'react';
import { Chart } from 'chart.js/auto';

export default function ChartCanvas({ id, config, height = "200px" }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    chartRef.current = new Chart(canvasRef.current, config);
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [JSON.stringify(config)]);

  return (
    <div style={{ position: "relative", height }}>
      <canvas ref={canvasRef} id={id} role="img" aria-label={`Chart: ${id}`} />
    </div>
  );
}
