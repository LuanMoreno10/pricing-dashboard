import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, Button, EmptyState, IconButton, PageHeader } from '../components/ui';
import { CategoryFormModal } from '../components/forms/ItemForms';
import { useConfirm, useToast } from '../components/feedback';
import type { Category } from '../types';

export default function Categories() {
  const { data, t, addCategory, renameCategory, deleteCategory } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<{ category?: Category } | null>(null);

  const count = (id: string) => data.services.filter((s) => s.categoryId === id).length;

  async function remove(c: Category) {
    const ok = await confirm({ title: `Delete “${c.name}”?`, message: 'This empty category will be removed.', confirmLabel: 'Delete category' });
    if (ok) {
      deleteCategory(c.id);
      toast('Category deleted');
    }
  }

  return (
    <>
      <PageHeader
        title={t('categories.title')}
        description={t('categories.subtitle')}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setForm({})}>
            New category
          </Button>
        }
      />

      {data.categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories" text="Create a category to organise your services." action={<Button icon={Plus} onClick={() => setForm({})}>New category</Button>} />
      ) : (
        <ul className="card divide-y divide-border">
          {data.categories.map((c) => {
            const n = count(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <FolderTree size={18} className="shrink-0 text-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{n === 0 ? 'No services' : `${n} service${n === 1 ? '' : 's'}`}</div>
                </div>
                {n > 0 && (
                  <Link to="/services" className="hidden text-xs text-accent hover:underline sm:block">
                    View services
                  </Link>
                )}
                <IconButton icon={Pencil} label={`Rename ${c.name}`} onClick={() => setForm({ category: c })} />
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label={n > 0 ? `Cannot delete ${c.name}: it still has services` : `Delete ${c.name}`}
                  disabled={n > 0}
                  onClick={() => remove(c)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        <Badge>Tip</Badge> A category can be deleted once it has no services. Move or delete its services first.
      </p>

      {form && (
        <CategoryFormModal
          category={form.category}
          existing={data.categories}
          onClose={() => setForm(null)}
          onSave={(name) => {
            if (form.category) renameCategory(form.category.id, name);
            else addCategory(name);
            setForm(null);
            toast(form.category ? 'Category renamed' : 'Category added');
          }}
        />
      )}
    </>
  );
}
