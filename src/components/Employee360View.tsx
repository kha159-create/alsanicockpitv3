import React, { useState, useMemo } from 'react';
import { KPICard, ChartCard, BarChart, PieChart } from './DashboardComponents.js';
import { SparklesIcon } from './Icons.js';
import { calculateEffectiveTarget, getCategory } from '../utils/calculator.js';
import type { EmployeeSummary, DailyMetric, SalesTransaction, StoreSummary, DateFilter, ModalState } from '../types.js';
import { useLocale } from '../context/LocaleContext.js';
import AiEmployeeSummaryCard from './AiEmployeeSummaryCard.js';

interface Employee360ViewProps {
    employee: EmployeeSummary;
    allMetrics: DailyMetric[];
    salesTransactions: SalesTransaction[];
    kingDuvetSales: SalesTransaction[];
    storeSummary: StoreSummary[];
    dateFilter: DateFilter;
    setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
    allEmployeeSummaries: EmployeeSummary[];
}

const Employee360View: React.FC<Employee360ViewProps> = ({ employee, allMetrics, salesTransactions, kingDuvetSales, storeSummary, dateFilter, setModalState, allEmployeeSummaries }) => {
    const { t } = useLocale();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const trendData = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMetrics = allMetrics.filter(m => {
            if (m.employee !== employee.name) return false;
            const metricDate = m.date.toDate();
            return metricDate >= thirtyDaysAgo;
        });
        
        const recentSales = salesTransactions.filter(s => {
            if (s['SalesMan Name'] !== employee.name) return false;
            const saleDate = s['Bill Dt.'].toDate();
            return saleDate >= thirtyDaysAgo;
        });

        const metricsByDay = recentMetrics.reduce((acc, metric) => {
            const day = metric.date.toDate().toISOString().split('T')[0];
            if (!acc[day]) {
                acc[day] = { totalSales: 0, totalTransactions: 0, totalItemsSold: 0 };
            }
            acc[day].totalSales += metric.totalSales || 0;
            acc[day].totalTransactions += metric.transactionCount || 0;
            return acc;
        }, {} as { [key: string]: { totalSales: number, totalTransactions: number, totalItemsSold: number } });
        
        const itemsByDay = recentSales.reduce((acc, sale) => {
            const day = sale['Bill Dt.'].toDate().toISOString().split('T')[0];
            acc[day] = (acc[day] || 0) + (sale['Sold Qty'] || 0);
            return acc;
        }, {} as {[key: string]: number});
        
        Object.keys(itemsByDay).forEach(day => {
            if(metricsByDay[day]) {
                metricsByDay[day].totalItemsSold = itemsByDay[day];
            }
        });

        const sortedDays = Object.keys(metricsByDay).sort();
        
        const atvTrend = sortedDays.map(day => {
            const data = metricsByDay[day];
            return data.totalTransactions > 0 ? data.totalSales / data.totalTransactions : 0;
        });
    
        const uptTrend = sortedDays.map(day => {
            const data = metricsByDay[day];
            return data.totalTransactions > 0 ? data.totalItemsSold / data.totalTransactions : 0;
        });

        return { atvTrend, uptTrend };
    }, [allMetrics, salesTransactions, employee.name]);

    const employeeData = useMemo(() => {
        const metrics = allMetrics.filter(m => m.employee === employee.name);
        const totalSales = metrics.reduce((sum, m) => sum + (m.totalSales || 0), 0);
        const totalTransactions = metrics.reduce((sum, m) => sum + (m.transactionCount || 0), 0);
        const atv = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        const effectiveTarget = calculateEffectiveTarget(employee.targets, dateFilter);
        const achievement = effectiveTarget > 0 ? (totalSales / effectiveTarget) * 100 : 0;
        const combinedSales = [...salesTransactions, ...kingDuvetSales].filter(s => s['SalesMan Name'] === employee.name);
        const totalItemsSold = combinedSales.reduce((sum, sale) => sum + (sale['Sold Qty'] || 0), 0);
        const avgItemsPerBill = totalTransactions > 0 ? totalItemsSold / totalTransactions : 0;

        // FIX: Add explicit type to the callback to help TypeScript inference and complete the logic.
        const store = storeSummary.find((s: StoreSummary) => s.name === employee.store);
        const contributionPercentage = store?.totalSales && store.totalSales > 0 ? (totalSales / store.totalSales) * 100 : 0;
        const storeAvgAtv = store?.atv || 0;
        const storeAllSales = [...salesTransactions, ...kingDuvetSales].filter(s => s['Outlet Name'] === employee.store);
        const storeTotalItems = storeAllSales.reduce((sum, s) => sum + (s['Sold Qty'] || 0), 0);
        const storeTotalTransactions = store?.transactionCount || 0;
        const storeAvgUpt = storeTotalTransactions > 0 ? storeTotalItems / storeTotalTransactions : 0;
        
        // FIX: Explicitly typed the accumulator in the `reduce` function to resolve a TypeScript type inference issue where `acc` was being treated as `unknown`.
        const productsByCategory = combinedSales.reduce((acc: {[key: string]: {totalSales: number, products: {[key: string]: number}}}, sale) => {
            const category = getCategory({ name: sale['Item Name'], alias: sale['Item Alias'] });
            const entry = acc[category] || { totalSales: 0, products: {} };
            const salesValue = (sale['Sold Qty'] || 0) * (sale['Item Rate'] || 0);
            entry.totalSales += salesValue;
            const productName = sale['Item Name'];
            entry.products[productName] = (entry.products[productName] || 0) + (sale['Sold Qty'] || 0);
            acc[category] = entry;
            return acc;
        }, {} as { [key: string]: { totalSales: number, products: {[key: string]: number} } });
        
        const categoryData = Object.entries(productsByCategory).map(([name, data]) => ({ name, value: data.totalSales }));

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayDate = now.getDate();
        const monthlyTarget = calculateEffectiveTarget(employee.targets, { year, month, day: 'all' });
        const salesThisMonth = allMetrics.filter(m => {
            if (m.employee !== employee.name || !m.date || typeof m.date.toDate !== 'function') return false;
            const metricDate = m.date.toDate();
            return metricDate.getFullYear() === year && metricDate.getMonth() === month;
        }).reduce((sum, m) => sum + (m.totalSales || 0), 0);
        const remainingTarget = monthlyTarget - salesThisMonth;
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const remainingDays = Math.max(0, totalDaysInMonth - todayDate);
        const requiredDailyAverage = remainingDays > 0 ? Math.max(0, remainingTarget) / remainingDays : 0;
        const dynamicTarget = { salesMTD: salesThisMonth, monthlyTarget, remainingTarget, remainingDays, requiredDailyAverage };

        return { totalSales, atv, achievement, contributionPercentage, avgItemsPerBill, storeAvgAtv, storeAvgUpt, categoryData, productsByCategory, dynamicTarget };

    }, [employee, allMetrics, salesTransactions, kingDuvetSales, storeSummary, dateFilter]);

    const topProductsInCategory = selectedCategory ? Object.entries(employeeData.productsByCategory[selectedCategory]?.products || {})
        .sort(([, qtyA], [, qtyB]) => Number(qtyB) - Number(qtyA))
        .slice(0, 5)
        .map(([name, soldQty]) => ({ name, soldQty })) : [];
        
    const handleCompare = () => {
        setModalState({
            type: 'aiComparison',
            data: {
                item: employee,
                allItems: allEmployeeSummaries,
                type: 'employee'
            }
        });
    };

    return (
            <div className="bg-gray-50 p-4 m-2 border-l-4 border-orange-500 rounded-r-lg">
                <div className="flex justify-end mb-4">
                    <button onClick={handleCompare} className="btn-secondary text-sm flex items-center gap-1 py-1 px-2">
                        <SparklesIcon /> {t('compare_with_ai')}
                    </button>
                </div>

                <AiEmployeeSummaryCard employee={employee} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
                    <KPICard 
                        title={t('avg_transaction_value')} 
                        value={employeeData.atv} 
                        format={v => v.toLocaleString('en-US', {style: 'currency', currency: 'SAR'})}
                        comparisonValue={employeeData.storeAvgAtv}
                        comparisonLabel={`vs Store Avg`}
                        trendData={trendData.atvTrend}
                    />
                     <KPICard 
                        title={t('items_per_bill')} 
                        value={employeeData.avgItemsPerBill} 
                        format={v => v.toFixed(2)}
                        comparisonValue={employeeData.storeAvgUpt}
                        comparisonLabel={`vs Store Avg`}
                        trendData={trendData.uptTrend}
                    />
                    <KPICard 
                        title={t('contribution_to_store_sales')} 
                        value={employeeData.contributionPercentage} 
                        format={v => `${v.toFixed(1)}%`}
                    />
                    <KPICard 
                        title={t('achievement')} 
                        value={employeeData.achievement} 
                        format={v => `${v.toFixed(1)}%`}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChartCard title={t('sales_by_product_category')}>
                        <PieChart data={employeeData.categoryData} onSliceClick={(category) => setSelectedCategory(prev => prev === category ? null : category)} />
                    </ChartCard>
                    <ChartCard title={selectedCategory ? `${t('top_products_in')} ${selectedCategory}` : t('top_products_overall')}>
                        <BarChart data={topProductsInCategory} dataKey="soldQty" nameKey="name" format={v => `${v} units`} />
                    </ChartCard>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border mt-4">
                     <h3 className="font-semibold text-lg text-zinc-700 mb-3">{t('dynamic_daily_target')}</h3>
                     <div className="space-y-3 text-sm">
                         <div className="flex justify-between"><span>{t('sales_this_month')} (MTD)</span><span className="font-semibold">{employeeData.dynamicTarget.salesMTD.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}</span></div>
                         <div className="flex justify-between"><span>{t('monthly_target')}</span><span className="font-semibold">{employeeData.dynamicTarget.monthlyTarget.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}</span></div>
                         <div className="flex justify-between"><span>{t('remaining_target')}</span><span className="font-semibold text-red-600">{employeeData.dynamicTarget.remainingTarget > 0 ? employeeData.dynamicTarget.remainingTarget.toLocaleString('en-US', { style: 'currency', currency: 'SAR' }) : t('achieved')}</span></div>
                         <div className="flex justify-between"><span>{t('remaining_days')}</span><span className="font-semibold">{employeeData.dynamicTarget.remainingDays}</span></div>
                         <div className="flex justify-between items-center bg-orange-50 p-2 rounded-lg mt-2"><span className="font-bold text-orange-700">{t('required_daily_avg')}</span><span className="font-bold text-orange-700 text-lg">{employeeData.dynamicTarget.requiredDailyAverage.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}</span></div>
                     </div>
                 </div>
            </div>
    );
};

// FIX: Added a default export to resolve the "no default export" error in the importing module.
export default Employee360View;