import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';

type ItemActionsProps = {
  label: string;
  isDisabled?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

const ItemActions = ({ label, isDisabled = false, onEdit, onDelete }: ItemActionsProps) => (
  <div className="flex shrink-0 items-center gap-1">
    {onEdit && (
      <button
        type="button"
        disabled={isDisabled}
        onClick={onEdit}
        className="rounded-full p-2 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Edit ${label}`}
        title={`Edit ${label}`}
      >
        <Pencil size={15} />
      </button>
    )}
    {onDelete && (
      <button
        type="button"
        disabled={isDisabled}
        onClick={onDelete}
        className="rounded-full p-2 text-ink-faint transition-colors hover:bg-mist-200 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-mist-950/40"
        aria-label={`Delete ${label}`}
        title={`Delete ${label}`}
      >
        <Trash2 size={15} />
      </button>
    )}
  </div>
);

export default ItemActions;
