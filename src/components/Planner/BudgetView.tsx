import React, { useEffect, useState } from 'react';
import CheckCircle2 from 'lucide-react/dist/esm/icons/circle-check.mjs';
import Circle from 'lucide-react/dist/esm/icons/circle.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import type { BudgetItem } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type BudgetViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount);
};

const BudgetView: React.FC<BudgetViewProps> = ({ tripId, travelData }) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    currency: 'USD',
  });

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedItems = await travelData.listBudgetItems(tripId);
        if (isMounted) {
          setItems(loadedItems);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load budget.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const item = await travelData.createBudgetItem(tripId, {
        category: formData.category,
        amount: Number(formData.amount),
        currency: formData.currency,
      });
      setItems((currentItems) => [...currentItems, item]);
      setFormData({ category: '', amount: '', currency: 'USD' });
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add expense.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleTogglePaid = async (item: BudgetItem) => {
    if (travelData.isReadOnly) {
      setError('Demo mode is read-only. Sign in to update expenses.');
      return;
    }

    setError(null);

    try {
      const updated = await travelData.updateBudgetItemPaid(item.id, !item.is_paid);
      setItems((currentItems) => currentItems.map((current) => (current.id === updated.id ? updated : current)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update expense.');
    }
  };

  const total = items.reduce((acc, item) => acc + item.amount, 0);
  const paid = items.filter((item) => item.is_paid).reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tighter">Budget Tracker</h2>
        <button
          type="submit"
          form="add-budget-item"
          disabled={isAdding || travelData.isReadOnly}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form id="add-budget-item" onSubmit={handleAdd} className="grid gap-3 md:grid-cols-[1fr_140px_100px] mb-8">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.category}
          onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Category'}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 ring-zinc-900 dark:ring-zinc-100"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          type="number"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
          placeholder="Amount"
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 ring-zinc-900 dark:ring-zinc-100"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.currency}
          onChange={(event) => setFormData((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
          maxLength={3}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 ring-zinc-900 dark:ring-zinc-100"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Total Budget</p>
          <p className="text-3xl font-bold">{formatMoney(total, items[0]?.currency ?? 'USD')}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Amount Paid</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatMoney(paid, items[0]?.currency ?? 'USD')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Loading budget...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">No expenses yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.category}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatMoney(item.amount, item.currency)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(item)}
                        className="text-zinc-300 dark:text-zinc-700 hover:text-green-500 transition-colors"
                        aria-label={item.is_paid ? `Mark ${item.category} as planned` : `Mark ${item.category} as paid`}
                      >
                        {item.is_paid ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BudgetView;
