


import React, { useState, useRef, useMemo, useEffect } from 'react';

// --- Reusable UI Components ---
const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
    if (!data || data.length < 2) return null;
    const width = 100;
    const height = 30;
    const padding = 2;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = (height - padding) - ((d - minVal) / (range || 1)) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const isUpward = data.length > 1 && data[data.length - 1] > data[0];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8">
            <polyline
                fill="none"
                stroke={isUpward ? '#10b981' : '#ef4444'}
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
};


export const KPICard: React.FC<{ 
    title: string; 
    value: number; 
    format?: (val: number) => string; 
    comparisonValue?: number;
    comparisonLabel?: string;
    icon?: React.ReactNode;
    iconBgColor?: string;
    onClick?: () => void;
    trendData?: number[];
}> = ({ title, value, format, comparisonValue, comparisonLabel, icon, iconBgColor, onClick, trendData }) => {
    const isPositive = comparisonValue !== undefined && value >= comparisonValue;
    const isNegative = comparisonValue !== undefined && value < comparisonValue;
    
    return (
        <button onClick={onClick} disabled={!onClick} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col text-left w-full h-full disabled:cursor-default transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-start gap-3">
                 {icon && (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
                        {icon}
                    </div>
                )}
                <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-semibold text-zinc-600 truncate">{title}</p>
                    <p className="text-2xl font-bold text-zinc-900 truncate">
                        {format && typeof value === 'number' ? format(value) : (value?.toLocaleString() || 0)}
                    </p>
                </div>
            </div>
            <div className="flex-grow mt-2 flex flex-col justify-end">
                {trendData && trendData.length > 1 && <Sparkline data={trendData} />}
                {comparisonValue !== undefined && (
                    <div className={`text-xs mt-1 font-semibold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        <span>{isPositive ? '▲' : '▼'}</span>
                        <span>{comparisonLabel}: {format ? format(comparisonValue) : comparisonValue.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </button>
    );
};

export const ChartCard: React.FC<{ title: React.ReactNode; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="text-xl font-semibold text-zinc-800 mb-4">{title}</div>
        <div className="flex-grow relative">{children}</div>
    </div>
);


const Tooltip: React.FC<{ content: string; x: number; y: number }> = ({ content, x, y }) => (
  <div className="absolute p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg pointer-events-none" style={{ left: x, top: y, transform: 'translate(-50%, -110%)' }} dangerouslySetInnerHTML={{ __html: content }}
  />
);

export const BarChart: React.FC<{ data: any[]; dataKey: string; nameKey: string; format?: (val: number) => string; }> = ({ data, dataKey, nameKey, format }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-zinc-500">No data to display</div>;
    const maxValue = Math.max(...data.map(item => item[dataKey] || 0));
    if (maxValue === 0) return <div className="flex items-center justify-center h-full text-zinc-500">No data to display</div>;
    
    return (
        <div className="w-full h-full flex flex-col space-y-2">
            {data.map((item, index) => {
                const value = item[dataKey] || 0;
                const percentage = (value / maxValue) * 100;
                const isTooShort = percentage < 35; 

                return (
                    <div key={`${item[nameKey]}-${index}`} className="bg-gray-200 rounded-full h-7 w-full group relative" title={`${item[nameKey]}: ${format ? format(value) : value}`}>
                        <div
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-7 rounded-full text-white text-sm flex items-center justify-between px-3 font-semibold transition-all duration-300 ease-out"
                            style={{ width: `${percentage}%` }}>
                            {!isTooShort && (
                                <>
                                    <span className="truncate pr-2">{item[nameKey]}</span>
                                    <span className="whitespace-nowrap">{format ? format(value) : value.toLocaleString()}</span>
                                </>
                            )}
                        </div>
                         {isTooShort && (
                            <div className="absolute inset-y-0 left-3 flex items-center text-sm font-semibold">
                                <span className="truncate pr-2 text-zinc-700">{item[nameKey]}</span>
                                <span className="whitespace-nowrap text-zinc-700">{format ? format(value) : value.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const PieChart: React.FC<{ data: { name: string, value: number }[], onSliceClick?: (name: string) => void }> = ({ data, onSliceClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ content: string, x: number, y: number } | null>(null);
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-zinc-500">No data to display</div>;
    
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full text-zinc-500">No data to display</div>;

    const colors = ['#f97316', '#3b82f6', '#6366f1', '#14b8a6', '#f59e0b', '#84cc16', '#ef4444', '#8b5cf6', '#ec4899', '#22d3ee'];
    let cumulativeAngle = 0;

    const getCoords = (angle: number, radius: number = 50) => [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];

    return (
        <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4" ref={containerRef}>
            <div className="w-48 h-48 relative flex-shrink-0">
                {tooltip && <Tooltip {...tooltip} />}
                <svg viewBox="0 0 100 100" onMouseLeave={() => setTooltip(null)}>
                    {data.map((item, index) => {
                        const angle = (item.value / total) * 2 * Math.PI;
                        const startAngle = cumulativeAngle;
                        cumulativeAngle += angle;
                        const endAngle = cumulativeAngle;
                        
                        const [startX, startY] = getCoords(startAngle, 40);
                        const [endX, endY] = getCoords(endAngle, 40);
                        const largeArcFlag = angle > Math.PI ? 1 : 0;
                        
                        const pathData = `M 50,50 L ${startX},${startY} A 40,40 0 ${largeArcFlag},1 ${endX},${endY} z`;
                        
                        return <path 
                                key={item.name} 
                                d={pathData} 
                                fill={colors[index % colors.length]} 
                                className={onSliceClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                                onClick={() => onSliceClick && onSliceClick(item.name)}
                                onMouseMove={(e) => {
                                    if (!containerRef.current) return;
                                    const containerRect = containerRef.current.getBoundingClientRect();
                                    const x = e.clientX - containerRect.left;
                                    const y = e.clientY - containerRect.top;
                                    setTooltip({ content: `${item.name}: ${((item.value/total)*100).toFixed(1)}%`, x, y });
                                }}
                               />
                    })}
                </svg>
            </div>
            <div className="flex-grow overflow-y-auto h-full w-full">
                <ul className="space-y-1">
                    {data.slice(0, 10).map((item, index) => (
                        <li key={item.name} className="flex items-center text-sm">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className="text-zinc-600 truncate flex-grow" title={item.name}>{item.name}</span>
                            <span className="font-semibold text-zinc-800 ml-2">{((item.value/total) * 100).toFixed(1)}%</span>
                        </li>
                    ))}
                    {data.length > 10 && <li className="text-xs text-zinc-500 mt-2">... and {data.length - 10} more</li>}
                </ul>
            </div>
        </div>
    );
};

export const LineChart: React.FC<{ data: { name: string; [key: string]: any }[] }> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

    const keys = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]).filter(k => typeof data[0][k] === 'number' && k !== 'monthIndex');
    }, [data]);
    
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => new Set(keys));
    
    useEffect(() => {
        setVisibleKeys(new Set(keys));
    }, [keys]);

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-zinc-500">No data available</div>;
    }

    const colors: { [key: string]: string } = { Sales: '#10b981', Target: '#a78bfa' };
    
    const width = 600;
    const height = 250;
    const padding = { top: 10, right: 20, bottom: 30, left: 40 };

    const allValues = data.flatMap(d => keys.filter(k => visibleKeys.has(k)).map(k => d[k] as number));
    const maxVal = allValues.length > 0 ? Math.max(...allValues, 1) : 1;
    const yTicks = 5;

    const getPathData = (key: string) => {
        if (data.length < 2) return "";
        const points = data.map((item, i) => {
            const x = padding.left + i * ((width - padding.left - padding.right) / (data.length - 1));
            const y = height - padding.bottom - (((item[key] as number) / maxVal) * (height - padding.top - padding.bottom));
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        if (!containerRef.current) return;
        const svg = e.currentTarget;
        const point = new DOMPoint(e.clientX, e.clientY);
        const transformedPoint = point.matrixTransform((svg.getScreenCTM() as DOMMatrix).inverse());
        
        const index = Math.min(data.length - 1, Math.max(0, Math.round(((transformedPoint.x - padding.left) / (width - padding.left - padding.right)) * (data.length - 1))));

        if (index >= 0 && index < data.length) {
            const item = data[index];
            const tooltipContent = `<div class="font-bold mb-1">${item.name}</div>${keys.filter(k => visibleKeys.has(k)).map(key => `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center">
                       <span class="w-2 h-2 rounded-full mr-1.5" style="background-color: ${colors[key]}"></span>
                       <span>${key}:</span>
                    </div>
                    <span class="font-semibold">${(item[key] as number).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
            `).join('')}`;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltip({ content: tooltipContent, x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
        }
    };

    const toggleKey = (key: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <div className="w-full h-full relative flex flex-col" ref={containerRef}>
            <div className="flex-grow" onMouseLeave={() => setTooltip(null)}>
                {tooltip && <Tooltip {...tooltip} />}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                    {/* Grid Lines and Y-Axis */}
                    {Array.from({ length: yTicks }).map((_, i) => {
                        const y = height - padding.bottom - (i * (height - padding.top - padding.bottom) / (yTicks - 1));
                        const val = (maxVal / (yTicks - 1)) * i;
                        return (
                            <g key={i} className="text-gray-400">
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor">
                                    {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                                </text>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 2" />
                            </g>
                        );
                    })}

                    {/* X-Axis */}
                    {data.map((item, i) => (
                        <text key={item.name} x={padding.left + i * ((width - padding.left - padding.right) / (data.length - 1))} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10" fill="#6b7280">
                            {item.name}
                        </text>
                    ))}

                    {/* Lines */}
                    {keys.map(key => visibleKeys.has(key) && (
                        <path
                            key={key}
                            d={getPathData(key)}
                            fill="none"
                            stroke={colors[key] || '#000'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={key.toLowerCase() === 'target' ? '6 6' : 'none'}
                            className="transition-all duration-300"
                        />
                    ))}
                    
                    <rect x="0" y="0" width={width} height={height} fill="transparent" onMouseMove={handleMouseMove} />
                </svg>
            </div>
            <div className="flex justify-center gap-6 text-sm mt-2">
                {keys.map(key => (
                    <button key={key} onClick={() => toggleKey(key)} className={`flex items-center gap-2 transition-opacity ${!visibleKeys.has(key) && 'opacity-40'}`}>
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[key] || '#000'}}></span>
                        <span>{key}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const DetailedComparisonCard: React.FC<{ title: string; current: number; previous: number; isPercentage?: boolean }> = ({ title, current, previous, isPercentage }) => {
    const format = (val: number) => {
        if (isPercentage) return `${val.toFixed(1)}%`;
        if (val >= 1000) {
           return val.toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
        }
        return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    const difference = current - previous;
    const percentageChange = previous !== 0 ? (difference / Math.abs(previous)) * 100 : current > 0 ? 100 : 0;
    const isPositive = difference >= 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{format(current)}</p>
            <div className="text-xs text-zinc-400">vs {format(previous)} last year</div>
            <div className={`mt-2 flex items-center text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '▲' : '▼'}
                <span className="ml-1">{format(Math.abs(difference))}</span>
                <span className="ml-2">({Math.abs(percentageChange).toFixed(1)}%)</span>
            </div>
        </div>
    );
};

export const AchievementBar: React.FC<{ percentage: number }> = ({ percentage }) => {
  const cappedPercentage = Math.min(Math.max(percentage, 0), 100);
  const barColor = cappedPercentage < 20 ? 'bg-red-500' : 'bg-orange-500';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-500`} 
          style={{ width: `${cappedPercentage}%` }}
        ></div>
      </div>
      <span className="text-sm font-medium text-zinc-700 w-12 text-right">{percentage.toFixed(1)}%</span>
    </div>
  );
};