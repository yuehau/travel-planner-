import React, { useEffect, useMemo, useState } from 'react';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Circle from 'lucide-react/dist/esm/icons/circle.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import type { PackingItem } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type ChecklistViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const ChecklistView: React.FC<ChecklistViewProps> = ({ tripId, travelData }) => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'Essentials',
    item: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedItems = await travelData.listPackingItems(tripId);
        if (isMounted) {
          setItems(loadedItems);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load packing list.');
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

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const item = await travelData.createPackingItem(tripId, {
        category: formData.category,
        item: formData.item,
      });
      setItems((currentItems) => [...currentItems, item]);
      setFormData((current) => ({ ...current, item: '' }));
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add packing item.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleTogglePacked = async (item: PackingItem) => {
    if (travelData.isReadOnly) {
      setError('Demo mode is read-only. Sign in to update packing items.');
      return;
    }

    setError(null);

    try {
      const updated = await travelData.updatePackingItemPacked(item.id, !item.is_packed);
      setItems((currentItems) => currentItems.map((current) => (current.id === updated.id ? updated : current)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update packing item.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-display font-bold tracking-tighter">Packing List</h2>
        <button
          type="submit"
          form="add-packing-item"
          disabled={isAdding || travelData.isReadOnly}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form id="add-packing-item" onSubmit={handleAdd} className="grid gap-3 md:grid-cols-[180px_1fr] mb-10">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.category}
          onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
          placeholder="Category"
          className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.item}
          onChange={(event) => setFormData((current) => ({ ...current, item: event.target.value }))}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Item'}
          className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">Loading packing list...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">No packing items yet.</div>
      ) : (
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-4">{category}</h3>
              <div className="space-y-2">
                {items.filter((item) => item.category === category).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleTogglePacked(item)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all text-left group"
                  >
                    <span className="flex items-center gap-3">
                      {item.is_packed ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Circle size={18} className="text-stone-300 dark:text-stone-700 group-hover:text-stone-400" />
                      )}
                      <span className={`text-sm ${item.is_packed ? 'text-stone-400 dark:text-stone-600 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                        {item.item}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistView;
