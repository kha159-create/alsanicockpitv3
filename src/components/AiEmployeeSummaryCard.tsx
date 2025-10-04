import React, { useState, useEffect } from 'react';
import { generateEmployeeCoachingSummary } from '../services/geminiService.ts';
import { SparklesIcon } from './Icons.tsx';
import type { EmployeeSummary } from '../types.ts';
import { useLocale } from '../context/LocaleContext.tsx';

interface AiEmployeeSummaryCardProps {
    employee: EmployeeSummary;
}

const AiEmployeeSummaryCard: React.FC<AiEmployeeSummaryCardProps> = ({ employee }) => {
    const { t, locale } = useLocale();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generate = async () => {
            setIsLoading(true);
            try {
                const result = await generateEmployeeCoachingSummary(employee, locale);
                setSummary(result);
            } catch (e) {
                setSummary(t('error_generating_summary'));
            } finally {
                setIsLoading(false);
            }
        };
        generate();
    // FIX: Added dependency array to useEffect to ensure it re-runs when employee or locale changes. This also closes the hook properly.
    }, [employee, locale, t]);

    // FIX: Added a return statement to render the component's UI, which resolves the 'void' return type error.
    return (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg mb-4">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2"><SparklesIcon /> {t('ai_coaching_summary')}</h4>
            {isLoading ? (
                <div className="mt-2 text-sm text-blue-700 animate-pulse">{t('generating_summary')}...</div>
            ) : (
                <div className="mt-2 prose prose-sm max-w-none text-blue-900" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
            )}
        </div>
    );
};

// FIX: Added a default export to resolve the "no default export" error in the importing module.
export default AiEmployeeSummaryCard;
