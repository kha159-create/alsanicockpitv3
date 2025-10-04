
import React from 'react';
import type { EmployeeSummary, StoreSummary, SalesTransaction, BusinessRule, UserProfile } from '../types.js';
import DataExporter from '../components/DataExporter.js';
import CustomBusinessRules from '../components/CustomBusinessRules.js';
import UserManagement from '../components/UserManagement.js';

interface SettingsPageProps {
    employeeSummary: EmployeeSummary[];
    storeSummary: StoreSummary[];
    kingDuvetSales: SalesTransaction[];
    onAddMonthlyData: () => void;
    onDeleteAllData: () => void;
    isProcessing: boolean;
    businessRules: BusinessRule[];
    onSaveRule: (rule: string) => void;
    onDeleteRule: (id: string) => void;
    profile: UserProfile | null;
    allUsers: (UserProfile & { id: string })[];
    onUpdateUser: (userId: string, data: Partial<UserProfile>) => void;
    setModalState: (state: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    employeeSummary, storeSummary, kingDuvetSales, onAddMonthlyData, onDeleteAllData, isProcessing,
    businessRules, onSaveRule, onDeleteRule, profile, allUsers, onUpdateUser, setModalState
}) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-semibold text-zinc-700 mb-4">Administrative Tools</h3>
                 <button onClick={onAddMonthlyData} className="btn-primary">Add Historical Monthly Data</button>
                <p className="text-xs text-zinc-500 mt-2">Use this to enter aggregated data for a full month retrospectively.</p>
            </div>
            
            <CustomBusinessRules
                rules={businessRules}
                onSave={onSaveRule}
                onDelete={onDeleteRule}
                isProcessing={isProcessing}
            />

            <UserManagement 
                profile={profile}
                allUsers={allUsers}
                setModalState={setModalState}
            />

            <DataExporter 
                employeeSummary={employeeSummary} 
                storeSummary={storeSummary} 
                kingDuvetSales={kingDuvetSales}
            />

            {profile?.role === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-xl font-semibold text-zinc-700 mb-4">Data Management</h3>
                    <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                        <h4 className="font-bold text-red-800">Danger Zone</h4>
                        <p className="text-red-700 mt-1 text-sm">This action will permanently delete all data in the database. This cannot be undone.</p>
                        <div className="mt-4">
                            <button onClick={onDeleteAllData} disabled={isProcessing} className="btn-danger">
                                {isProcessing ? 'Deleting...' : 'Delete All Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;