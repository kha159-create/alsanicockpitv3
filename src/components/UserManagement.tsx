
import React, { useMemo } from 'react';
import { useLocale } from '../context/LocaleContext.tsx';
import { Table, Column } from './Table.tsx';
import type { UserProfile, ModalState } from '../types.ts';
import { PencilIcon } from './Icons.tsx';

interface UserManagementProps {
    profile: UserProfile | null;
    allUsers: (UserProfile & { id: string })[];
    setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
}

const UserManagement: React.FC<UserManagementProps> = ({ profile, allUsers, setModalState }) => {
    const { t } = useLocale();

    const { pendingUsers, activeUsers } = useMemo(() => {
        const pending: (UserProfile & { id: string })[] = [];
        const active: (UserProfile & { id: string })[] = [];
        allUsers.forEach(user => {
            if (user.status === 'pending') {
                pending.push(user);
            } else {
                active.push(user);
            }
        });
        return { pendingUsers: pending, activeUsers: active };
    }, [allUsers]);

    if (profile?.role !== 'admin' && profile?.role !== 'general_manager') {
        return null;
    }

    const handleEditUser = (user: UserProfile & { id: string }) => {
        setModalState({ type: 'userEdit', data: user });
    };

    const baseColumns: Column<UserProfile & { id: string }>[] = [
        { key: 'name', label: t('name'), sortable: true },
        { key: 'email', label: t('email_or_id'), sortable: true },
        { key: 'employeeId', label: t('employee_id'), sortable: true },
    ];
    
    const pendingColumns: Column<UserProfile & { id: string }>[] = [
        ...baseColumns,
        {
            key: 'actions',
            label: 'Actions',
            render: (item) => (
                <button onClick={() => handleEditUser(item)} className="btn-primary text-sm py-1 px-3">
                    {t('approve')}
                </button>
            )
        }
    ];

    const activeColumns: Column<UserProfile & { id: string }>[] = [
        ...baseColumns,
        { key: 'role', label: t('role'), sortable: true },
        { key: 'store', label: t('store'), sortable: true },
        {
            key: 'actions',
            label: 'Actions',
            render: (item) => (
                 <button onClick={() => handleEditUser(item)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                    <PencilIcon />
                </button>
            )
        }
    ];


    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-8">
            <h3 className="text-xl font-semibold text-zinc-700">{t('user_management')}</h3>

            <div>
                <h4 className="font-semibold text-zinc-600 mb-2">{t('pending_approvals')}</h4>
                {pendingUsers.length > 0 ? (
                    <Table columns={pendingColumns} data={pendingUsers} />
                ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">No users are currently awaiting approval.</p>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-zinc-600 mb-2">{t('all_users')}</h4>
                <Table columns={activeColumns} data={activeUsers} initialSortKey="name"/>
            </div>
        </div>
    );
};
export default UserManagement;