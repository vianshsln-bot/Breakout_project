
'use client';
import React from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
  Treemap,
  ScatterChart, Scatter, ZAxis, ResponsiveContainer,
} from 'recharts';

type ChartCardProps = {
  title: string;
  chartType:
    | 'line'
    | 'bar'
    | 'bar-line'
    | 'funnel'
    | 'pie'
    | 'area'
    | 'horizontal-bar'
    | 'dual-bar'
    | 'donut'
    | 'call-sentiment'
    | 'treemap'
    | 'bubble';
  data: any[];
  isLoading?: boolean;
  error?: string | null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6F91'];

const renderFunnel = (data: any[]) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="w-full flex flex-col items-center gap-0">
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.count / data[0].count) * 100 : 0;
        return (
          <div
            key={item.stage}
            className="relative flex items-center justify-center text-center transition-all duration-300 bg-primary border-b-2 border-background"
            style={{
              width: `${Math.max(percentage, 20)}%`,
              minHeight: '40px',
              clipPath: index === data.length - 1 
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' 
                : 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
            }}
          >
            <div className="px-2 py-1">
              <div className="text-sm font-semibold text-primary-foreground">{item.stage}</div>
              <div className="text-xs font-bold text-primary-foreground/90">{item.count.toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  chartType,
  data,
  isLoading,
  error,
}) => {
  if (isLoading)
    return (
      <div className="animate-pulse p-6 bg-white rounded-xl shadow-md h-72 flex items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-xl shadow-md h-72 flex items-center justify-center">
        {error}
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div className="p-6 bg-gray-100 rounded-xl shadow-md h-72 flex items-center justify-center">
        No data
      </div>
    );

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={data[0]?.date ? "date" : "name"} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={data[0]?.total_calls ? "total_calls" : "value"} stroke="#8884d8" />
          </LineChart>
        );
       case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={data[0]?.date ? "date" : "name"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={data[0]?.bookings ? "bookings" : "value"} fill="#8884d8" />
          </BarChart>
        );
      case 'bar-line':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#FF8042" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="total_customers"
              stroke="#8884d8"
              fill="url(#colorArea)"
            />
          </AreaChart>
        );
      case 'pie':
      case 'donut':
      case 'call-sentiment':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 60 : 0}
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'horizontal-bar':
        return (
          <BarChart layout="vertical" data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey={data[0]?.stage ? "stage" : "name"} type="category" width={80} interval={0} />
            <Tooltip />
            <Bar dataKey={data[0]?.count ? "count" : "value"} fill="#8884d8" />
          </BarChart>
        );
      case 'dual-bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#82ca9d" />
            <Bar dataKey="refunds" fill="#FF8042" />
          </BarChart>
        );
      case 'funnel':
        return renderFunnel(data);
      case 'treemap':
        return (
          <Treemap
            data={data}
            dataKey="value"
            ratio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
          >
            <Tooltip/>
          </Treemap>
        );
      case 'bubble':
        return (
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="category" dataKey="name" name="source" />
            <YAxis type="number" dataKey="value" name="conversions" />
            <ZAxis dataKey="value" range={[100, 1000]} name="conversions" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Lead Sources" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="flex-1 -mx-4">
        <ResponsiveContainer width="100%" height={250}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
