import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import './Dashboard.css';
import CustomTooltip from '../components/CustomTooltip';

const COLORS = ['#FFBB28', '#FF8042', '#FFB347', '#FFA07A'];

const timeRanges = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 15 Days', value: 15 },
  { label: 'Last 1 Month', value: 30 },
  { label: 'Last 6 Months', value: 180 },
  { label: 'Last 1 Year', value: 365 },
];

const trafficSources = [
  { name: 'Direct Traffic', value: 40 },
  { name: 'Organic Search', value: 30 },
  { name: 'Social Media', value: 15 },
  { name: 'Referral Traffic', value: 10 },
  { name: 'Email Campaigns', value: 5 },
];

const topCategories = [
  { name: 'Electronics', value: 1200000 },
  { name: 'Fashion', value: 950000 },
  { name: 'Home & Kitchen', value: 750000 },
  { name: 'Beauty & Personal Care', value: 500000 },
];

const conversionData = [
  { name: 'Product Views', value: 25000, change: 9 },
  { name: 'Add to Cart', value: 12000, change: 6 },
  { name: 'Proceed to Checkout', value: 8500, change: 4 },
  { name: 'Completed Purchases', value: 6200, change: 7 },
  { name: 'Abandoned Carts', value: 3000, change: -5 },
];

const activeUsersByCountry = [
  { country: 'United States', percent: 36 },
  { country: 'United Kingdom', percent: 24 },
  { country: 'Indonesia', percent: 17.5 },
  { country: 'Russia', percent: 15 },
];

const Dashboard = ({ products = [] }) => {
  const [totalSales, setTotalSales] = useState(0);
  const [previousTotalSales, setPreviousTotalSales] = useState(0);
  const [totalDeliveredSales, setTotalDeliveredSales] = useState(0);
  const [previousTotalDeliveredSales, setPreviousTotalDeliveredSales] = useState(0);
  const [previousProductCount, setPreviousProductCount] = useState(0);
  const [productChangePercentage, setProductChangePercentage] = useState(0);
  const [totalSalesChange, setTotalSalesChange] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [previousTotalOrders, setPreviousTotalOrders] = useState(0);
  const [totalOrdersChange, setTotalOrdersChange] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [previousTotalVisitors, setPreviousTotalVisitors] = useState(0);
  const [totalVisitorsChange, setTotalVisitorsChange] = useState(0);
  const [totalDeliveredSalesChange, setTotalDeliveredSalesChange] = useState(0);
  const [fullRevenueData, setFullRevenueData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(7);

  // Store full revenue data when received from server
  useEffect(() => {
    if (revenueData.length > 0 && fullRevenueData.length === 0) {
      setFullRevenueData(revenueData);
    }
  }, [revenueData, fullRevenueData]);

  // Filter fullRevenueData based on selectedRange
  useEffect(() => {
    if (fullRevenueData.length > 0) {
      const filteredData = fullRevenueData.slice(-selectedRange);
      setRevenueData(filteredData);
    }
  }, [selectedRange, fullRevenueData]);
  const [monthlyTarget, setMonthlyTarget] = useState({ percent: 0, change: 0, target: 0, revenue: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUsersChange, setActiveUsersChange] = useState(0);
  const [activeUsersByCountry, setActiveUsersByCountry] = useState([]);
  const [conversionRateData, setConversionRateData] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [trafficData, setTrafficData] = useState([]);

  // Calculate product change percentage whenever products change
  useEffect(() => {
    const currentProductCount = products.length;
    if (previousProductCount !== 0) {
      const change = ((currentProductCount - previousProductCount) / previousProductCount) * 100;
      setProductChangePercentage(change);
    }
    setPreviousProductCount(currentProductCount);
  }, [products]);

  // Calculate percentage change function
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Real-time updates simulation using SSE
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/api/realtime-dashboard');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      // Store previous values before updating
      setPreviousTotalSales(totalSales);
      setPreviousTotalDeliveredSales(totalDeliveredSales);
      setPreviousTotalOrders(totalOrders);
      setPreviousTotalVisitors(totalVisitors);

      // Update current values
      if (data.totalSales !== undefined) setTotalSales(data.totalSales);
      if (data.totalDeliveredSales !== undefined) setTotalDeliveredSales(data.totalDeliveredSales);
      if (data.totalOrders !== undefined) setTotalOrders(data.totalOrders);
      if (data.totalVisitors !== undefined) setTotalVisitors(data.totalVisitors);
      if (data.revenueData !== undefined) setRevenueData(data.revenueData);
      if (data.monthlyTarget !== undefined) setMonthlyTarget(data.monthlyTarget);
      if (data.activeUsers !== undefined) setActiveUsers(data.activeUsers);
      if (data.activeUsersByCountry !== undefined) setActiveUsersByCountry(data.activeUsersByCountry);
      if (data.conversionRateData !== undefined) setConversionRateData(data.conversionRateData);
      if (data.topCategories !== undefined) setTopCategories(data.topCategories);
      if (data.trafficData !== undefined) setTrafficData(data.trafficData);

      // Calculate percentage changes dynamically
      if (data.totalSales !== undefined && previousTotalSales !== 0) {
        setTotalSalesChange(calculatePercentageChange(data.totalSales, previousTotalSales));
      }
      if (data.totalDeliveredSales !== undefined && previousTotalDeliveredSales !== 0) {
        setTotalDeliveredSalesChange(calculatePercentageChange(data.totalDeliveredSales, previousTotalDeliveredSales));
      }
      if (data.totalOrders !== undefined && previousTotalOrders !== 0) {
        setTotalOrdersChange(calculatePercentageChange(data.totalOrders, previousTotalOrders));
      }
      if (data.totalVisitors !== undefined && previousTotalVisitors !== 0) {
        setTotalVisitorsChange(calculatePercentageChange(data.totalVisitors, previousTotalVisitors));
      }
      if (data.activeUsers !== undefined && activeUsers !== 0) {
        setActiveUsersChange(calculatePercentageChange(data.activeUsers, activeUsers));
      }

      // Fix: Ensure values update correctly even if 0
      if (data.activeUsers === 0) setActiveUsers(0);
    };
    return () => {
      eventSource.close();
    };
  }, [totalSales, totalDeliveredSales, totalOrders, totalVisitors, activeUsers, previousTotalSales, previousTotalDeliveredSales, previousTotalOrders, previousTotalVisitors]);

  const handleRangeChange = (e) => {
    const days = parseInt(e.target.value, 10);
    setSelectedRange(days);
  };

  const monthlyProgress = (monthlyTarget.revenue / monthlyTarget.target) * 100;

  // Filter revenueData based on selectedRange
  const filteredRevenueData = revenueData.slice(-selectedRange);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Total Products</div>
          <div className="metric-value">{products.length}</div>
          <div className="metric-change">{productChangePercentage.toFixed(2)}% change</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Sales</div>
          <div className="metric-value">${totalSales.toLocaleString()}</div>
          <div className={`metric-change ${totalSalesChange >= 0 ? '' : 'negative'}`}>
            {totalSalesChange >= 0 ? '+' : ''}{totalSalesChange.toFixed(2)}% vs last week
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Delivered Sales</div>
          <div className="metric-value">{totalDeliveredSales.toLocaleString()}</div>
          <div className={`metric-change ${totalDeliveredSalesChange >= 0 ? '' : 'negative'}`}>
            {totalDeliveredSalesChange >= 0 ? '+' : ''}{totalDeliveredSalesChange.toFixed(2)}% vs last week
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Orders</div>
          <div className="metric-value">{totalOrders.toLocaleString()}</div>
          <div className={`metric-change ${totalOrdersChange >= 0 ? '' : 'negative'}`}>
            {totalOrdersChange >= 0 ? '+' : ''}{totalOrdersChange.toFixed(2)}% vs last week
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Visitors</div>
          <div className="metric-value">{totalVisitors.toLocaleString()}</div>
          <div className={`metric-change ${totalVisitorsChange >= 0 ? '' : 'negative'}`}>
            {totalVisitorsChange >= 0 ? '+' : ''}{totalVisitorsChange.toFixed(2)}% vs last week
          </div>
        </div>
      </div>

      <div className="revenue-analytics">
        <div className="revenue-analytics-header">
          <div className="revenue-analytics-title">Revenue Analytics</div>
          <select className="time-range-selector-enhanced" value={selectedRange} onChange={handleRangeChange}>
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={filteredRevenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff8042" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffbb28" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffbb28" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff8042" stopOpacity={0.2}/>
              </linearGradient>
              <filter id="shadow" height="130%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#888" floodOpacity="0.5"/>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#colorRevenue)"
              strokeWidth={4}
              dot={{ stroke: '#ffbb28', strokeWidth: 3, r: 6, fill: '#ff8042' }}
              activeDot={{ r: 10, stroke: '#ffbb28', strokeWidth: 3, fill: '#ff8042' }}
              animationDuration={2000}
              animationEasing="ease-in-out"
              filter="url(#shadow)"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="url(#colorOrders)"
              strokeDasharray="5 5"
              strokeWidth={4}
              dot={{ stroke: '#ff8042', strokeWidth: 3, r: 6, fill: '#ffbb28' }}
              activeDot={{ r: 10, stroke: '#ff8042', strokeWidth: 3, fill: '#ffbb28' }}
              animationDuration={2000}
              animationEasing="ease-in-out"
              filter="url(#shadow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="progress-section">
        <div className="progress-card">
          <h3 className="progress-title">Active Users</h3>
          <div className="progress-value">{activeUsers.toLocaleString()}</div>
          <div className={`progress-change ${activeUsersChange >= 0 ? '' : 'negative'}`}>
            {activeUsersChange >= 0 ? '+' : ''}{activeUsersChange.toFixed(2)}% from last month
          </div>
          {activeUsersByCountry.map((country, index) => (
            <div key={country.country} className="progress-item">
              <div className="progress-label">
                <span className="progress-label-text">{country.country}</span>
                <span className="progress-label-percent">{country.percent}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${country.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="progress-card">
          <h3 className="progress-title">Monthly Target</h3>
          <div className="progress-value">{monthlyProgress.toFixed(0)}%</div>
          <div className={`progress-change ${monthlyTarget.change >= 0 ? '' : 'negative'}`}>
            {monthlyTarget.change >= 0 ? '+' : ''}{monthlyTarget.change.toFixed(2)}% from last month
          </div>
          <div className="progress-message">
            Great Progress! 🎉<br />
            Our achievement increased by $200,000; let's reach 100% next month.
          </div>
          <div className="target-container">
            <div className="target-item">
              <div>Target</div>
              <div className="target-value">${monthlyTarget.target.toLocaleString()}</div>
            </div>
            <div className="target-item">
              <div>Revenue</div>
              <div className="target-value">${monthlyTarget.revenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="conversion-grid">
        {conversionRateData.map(item => (
          <div className="conversion-item" key={item.name}>
            <div className="conversion-value">{item.value.toLocaleString()}</div>
            <div className="conversion-label">{item.name}</div>
            <div className={`conversion-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
              {item.change >= 0 ? '+' : ''}{item.change}%
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="pie-chart-container">
          <h3 className="chart-title">Top Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#ff8042"
                label
              >
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="categories-list">
            {topCategories.map(cat => (
              <div key={cat.name} className="category-item">
                <div>{cat.name}</div>
                <div>${cat.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bar-chart-container">
          <h3 className="chart-title">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trafficData}>
            <Bar dataKey="value" fill="#ff8042" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            </BarChart>
          </ResponsiveContainer>
          <div className="traffic-list">
            {trafficData.map(source => (
              <div key={source.name} className="traffic-item">
                <div>{source.name}</div>
                <div>{source.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
