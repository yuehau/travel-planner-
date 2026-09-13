import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Circle from 'lucide-react/dist/esm/icons/circle.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import type { TripTodo, TripTodoPriority } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type TodoViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const priorities: TripTodoPriority[] = ['low', 'medium', 'high'];

const TodoView = ({ tripId, travelData }: TodoViewProps) => {
  const [items, setItems] = useState<TripTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'medium' as TripTodoPriority,
  });

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedItems = await travelData.listTodos(tripId);
        if (isMounted) setItems(loadedItems);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load tasks.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const completedCount = useMemo(() => items.filter((item) => item.is_completed).length, [items]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const item = await travelData.createTodo(tripId, formData);
      setItems((currentItems) => [...currentItems, item]);
      setFormData({ title: '', due_date: '', priority: 'medium' });
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add task.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (item: TripTodo) => {
    if (travelData.isReadOnly) {
      setError('Demo mode is read-only. Sign in to update tasks.');
      return;
    }

    setError(null);

    try {
      const updated = await travelData.updateTodoCompleted(item.id, !item.is_completed);
      setItems((currentItems) => currentItems.map((current) => (current.id === updated.id ? updated : current)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update task.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tighter">Trip To-Dos</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{completedCount} of {items.length} done</p>
        </div>
        <button
          type="submit"
          form="add-todo"
          disabled={isAdding || travelData.isReadOnly}
          className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form id="add-todo" onSubmit={handleAdd} className="mb-10 grid gap-3 md:grid-cols-[1fr_160px_130px]">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.title}
          onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Task'}
          className="rounded-xl border border-stone-200 bg-transparent px-4 py-2 outline-none ring-stone-900 focus:ring-2 dark:border-stone-800 dark:ring-stone-100"
        />
        <input
          disabled={isAdding || travelData.isReadOnly}
          type="date"
          value={formData.due_date}
          onChange={(event) => setFormData((current) => ({ ...current, due_date: event.target.value }))}
          className="rounded-xl border border-stone-200 bg-transparent px-4 py-2 outline-none ring-stone-900 focus:ring-2 dark:border-stone-800 dark:ring-stone-100"
        />
        <select
          disabled={isAdding || travelData.isReadOnly}
          value={formData.priority}
          onChange={(event) => setFormData((current) => ({ ...current, priority: event.target.value as TripTodoPriority }))}
          className="rounded-xl border border-stone-200 bg-transparent px-4 py-2 outline-none ring-stone-900 focus:ring-2 dark:border-stone-800 dark:ring-stone-100"
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">Loading tasks...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">No tasks yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left transition-all hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600"
            >
              <span className="flex items-center gap-3">
                {item.is_completed ? <Check size={18} className="text-green-500" /> : <Circle size={18} className="text-stone-400" />}
                <span>
                  <span className={`block text-sm font-medium ${item.is_completed ? 'text-stone-400 line-through dark:text-stone-600' : ''}`}>{item.title}</span>
                  {item.due_date && <span className="text-xs text-stone-500 dark:text-stone-400">Due {item.due_date}</span>}
                </span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">{item.priority}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoView;
