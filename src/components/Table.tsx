
import React from 'react';
import { useTable } from '../hooks/useTable.js';
import { useLocale } from '../context/LocaleContext.js';

export interface Column<T> {
  key: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  initialSortKey?: keyof T;
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
  renderExpandedRow?: (item: T) => React.ReactNode | false;
}

const SortIcon: React.FC<{ direction?: 'asc' | 'desc' }> = ({ direction }) => {
    if (!direction) return <span className="text-gray-300">↕</span>;
    return <span>{direction === 'asc' ? '▲' : '▼'}</span>;
};

export const Table = <T extends { id: string }>({ columns, data, initialSortKey, rowClassName, onRowClick, renderExpandedRow }: TableProps<T>) => {
  const { t } = useLocale();
  const {
    paginatedData,
    sortConfig,
    requestSort,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useTable(data, 10, initialSortKey);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="th cursor-pointer"
                  onClick={() => col.sortable && requestSort(col.key as keyof T)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && <SortIcon direction={sortConfig?.key === col.key ? sortConfig.direction : undefined} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
                <tr>
                    <td colSpan={columns.length} className="text-center py-10 text-gray-500">
                        {t('no_data_to_display')}
                    </td>
                </tr>
            ) : (
                paginatedData.map((item) => {
                  const expandedContent = renderExpandedRow ? renderExpandedRow(item) : null;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => onRowClick && onRowClick(item)}
                        className={`transition-colors duration-150 ${rowClassName ? rowClassName(item) : ''} ${onRowClick ? 'cursor-pointer hover:bg-gray-100' : (rowClassName ? 'hover:brightness-95' : 'hover:bg-gray-50')}`}
                      >
                        {columns.map((col) => (
                          <td key={`${item.id}-${String(col.key)}`} className="td">
                            {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                          </td>
                        ))}
                      </tr>
                      {expandedContent && (
                        <tr>
                          <td colSpan={columns.length} className="p-0 bg-gray-50 border-t-2 border-orange-200">
                            {expandedContent}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
          >
            {t('previous')}
          </button>
          <span>{t('page_of', { current: currentPage, total: totalPages })}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
};