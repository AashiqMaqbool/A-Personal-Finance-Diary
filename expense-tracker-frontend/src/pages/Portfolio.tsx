import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, PieChart, Plus, DollarSign, Percent } from 'lucide-react';
import { investmentService, stockService } from '../services/investmentService';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { Investment, StockHolding } from '../types';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Portfolio() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'mutual-funds' | 'other'>('all');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const [investmentsData, stocksData] = await Promise.all([
        investmentService.getInvestments(),
        stockService.getStocks(),
      ]);
      setInvestments(investmentsData);
      setStocks(stocksData);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0) +
                        stocks.reduce((sum, stock) => sum + stock.totalInvested, 0);
  const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0) +
                       stocks.reduce((sum, stock) => sum + stock.currentValue, 0);
  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const assetAllocation = [
    { name: 'Stocks', value: stocks.reduce((sum, s) => sum + s.currentValue, 0), color: '#3b82f6' },
    { name: 'Mutual Funds', value: investments.filter(i => i.assetType === 'Mutual Funds').reduce((sum, i) => sum + i.currentValue, 0), color: '#8b5cf6' },
    { name: 'Fixed Deposit', value: investments.filter(i => i.assetType === 'Fixed Deposit').reduce((sum, i) => sum + i.currentValue, 0), color: '#10b981' },
    { name: 'Gold', value: investments.filter(i => i.assetType === 'Gold').reduce((sum, i) => sum + i.currentValue, 0), color: '#f59e0b' },
    { name: 'Other', value: investments.filter(i => !['Mutual Funds', 'Fixed Deposit', 'Gold'].includes(i.assetType)).reduce((sum, i) => sum + i.currentValue, 0), color: '#6b7280' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Investment Portfolio</h1>
            <p className="text-slate-600 mt-2">Track your investments and portfolio performance</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-5 h-5" />
            Add Investment
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">Total Invested</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalInvested)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">Current Value</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(currentValue)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                totalGainLoss >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {totalGainLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <p className="text-sm text-slate-600">Total Gain/Loss</p>
            </div>
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalGainLoss))}
            </p>
            <p className={`text-sm mt-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : '-'}{formatPercentage(Math.abs(totalGainLossPercentage))}
            </p>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Asset Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {assetAllocation.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: asset.color }} />
                    <span className="font-medium text-slate-900">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(asset.value)}</p>
                    <p className="text-sm text-slate-600">
                      {formatPercentage((asset.value / currentValue) * 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-2">
          {(['all', 'stocks', 'mutual-funds', 'other'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Holdings */}
        <div className="space-y-4">
          {/* Stocks */}
          {(activeTab === 'all' || activeTab === 'stocks') && stocks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Stock Holdings</h3>
              <div className="grid grid-cols-1 gap-4">
                {stocks.map((stock) => (
                  <StockCard key={stock.stockId} stock={stock} />
                ))}
              </div>
            </div>
          )}

          {/* Other Investments */}
          {(activeTab === 'all' || activeTab !== 'stocks') && investments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Other Investments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investments
                  .filter(inv => activeTab === 'all' || 
                    (activeTab === 'mutual-funds' && inv.assetType === 'Mutual Funds') ||
                    (activeTab === 'other' && inv.assetType !== 'Mutual Funds'))
                  .map((investment) => (
                    <InvestmentCard key={investment.investmentId} investment={investment} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StockCard({ stock }: { stock: StockHolding }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{stock.symbol}</h3>
          <p className="text-sm text-slate-600">{stock.name}</p>
          <p className="text-xs text-slate-500 mt-1">{stock.sector} • {stock.exchange}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          stock.totalPL >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {stock.totalPL >= 0 ? '+' : ''}{formatPercentage(stock.totalPLPercentage)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Quantity</p>
          <p className="text-sm font-semibold text-slate-900">{stock.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Avg Price</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(stock.avgBuyPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Current</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(stock.currentPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Value</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(stock.currentValue)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Total P&L</p>
          <p className={`text-lg font-bold ${stock.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stock.totalPL >= 0 ? '+' : ''}{formatCurrency(stock.totalPL)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Day P&L</p>
          <p className={`text-sm font-semibold ${stock.dayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stock.dayPL >= 0 ? '+' : ''}{formatCurrency(stock.dayPL)}
          </p>
        </div>
      </div>
    </div>
  );
}

function InvestmentCard({ investment }: { investment: Investment }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{investment.name}</h3>
          <p className="text-sm text-slate-600">{investment.assetType}</p>
          {investment.isSIP && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              SIP: {formatCurrency(investment.sipAmount || 0)}/{investment.sipFrequency}
            </span>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          investment.gainLoss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {investment.gainLoss >= 0 ? '+' : ''}{formatPercentage(investment.gainLossPercentage)}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Invested</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(investment.totalInvested)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Current Value</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(investment.currentValue)}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-sm text-slate-600">Gain/Loss</span>
          <span className={`text-lg font-bold ${investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {investment.gainLoss >= 0 ? '+' : ''}{formatCurrency(investment.gainLoss)}
          </span>
        </div>
      </div>
    </div>
  );
}
