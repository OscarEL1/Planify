import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X, Paperclip, MessageSquare, Link2, Calendar, Loader2, Send, Trash2, CircleUserRound, CheckSquare, Plus, ChevronDown, Check,
} from 'lucide-react';
import {
  useUsersQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} from '../../hooks/useActivities';
import { useToast } from '../common/ToastProvider';

const priorities = [
  { value: 'ALTA', label: 'Alta', dot: '#EF4444' },
  { value: 'MEDIA', label: 'Media', dot: '#F59E0B' },
  { value: 'BAJA', label: 'Baja', dot: '#22C55E' },
];

const statusOptions = [
  { value: 'PENDIENTE', label: 'Pendiente', dot: '#94A3B8' },
  { value: 'EN_PROCESO', label: 'En proceso', dot: '#3B82F6' },
  { value: 'EN_REVISION', label: 'En revisión', dot: '#8B5CF6' },
  { value: 'COMPLETADA', label: 'Completada', dot: '#22C55E' },
];

const avatarColors = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function UserAvatar({ name, size = 24 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}

const activitySchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  dueDate: z.string().min(1, 'La fecha límite es obligatoria').refine((val) => {
    const [year, month, day] = val.split('-').map(Number);
    const today = new Date();
    const dateOnly = new Date(year, month - 1, day);
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly >= todayOnly;
  }, 'La fecha límite no puede ser en el pasado'),
  status: z.enum(['PENDIENTE', 'EN_PROCESO', 'EN_REVISION', 'COMPLETADA']),
  evidenceUrl: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'Ingresa una URL válida (https://...)'),
});

export default function ActivityFormModal({
  mode = 'create',
  initialData = null,
  currentUserRole = 'Integrante del equipo',
  isOpen,
  onClose,
  onSuccess,
}) {
  const { showToast } = useToast();
  const { data: users, isLoading: usersLoading, isError: usersError } = useUsersQuery();
  const createMutation = useCreateActivityMutation();
  const updateMutation = useUpdateActivityMutation();
  const deleteMutation = useDeleteActivityMutation();

  const [subtasks, setSubtasks] = useState([]); // 🔧 campo no confirmado en backend
  const [newSubtask, setNewSubtask] = useState('');
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '', description: '', assigneeId: '', priority: 'MEDIA',
      dueDate: '', status: 'PENDIENTE', evidenceUrl: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setConfirmingDelete(false);

    if (mode === 'edit' && initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        assigneeId: initialData.assigneeId || '',
        priority: initialData.priority || 'MEDIA',
        dueDate: initialData.dueDate ? initialData.dueDate.slice(0, 10) : '',
        status: initialData.status || 'PENDIENTE',
        evidenceUrl: initialData.evidenceUrl || '',
      });
      setSubtasks(initialData.subtasks || []);
      setComments(initialData.comments || []);
    } else {
      reset({
        title: '', description: '', assigneeId: '', priority: 'MEDIA',
        dueDate: '', status: 'PENDIENTE', evidenceUrl: '',
      });
      setSubtasks([]);
      setComments([]);
    }
    setNewSubtask('');
    setCommentDraft('');
  }, [isOpen, mode, initialData, reset]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  const completedCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const toggleSubtask = (id) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const handleSendComment = () => {
    if (!commentDraft.trim()) return;
    // 🔧 Backend aún no expone POST /activities/:id/comments — se
    // agrega solo en el estado local mientras tanto.
    setComments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), authorName: 'Tú', authorInitials: 'YO', timeAgo: 'Ahora', text: commentDraft.trim() },
    ]);
    setCommentDraft('');
  };

  const onSubmit = async (formData) => {
    const payload = { ...formData, subtasks };
    try {
      if (mode === 'edit') {
        await updateMutation.mutateAsync({ id: initialData.id, payload });
        showToast('Actividad actualizada correctamente.', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Actividad creada correctamente.', 'success');
      }
      onSuccess?.();
      onClose();
    } catch {
      showToast('No fue posible guardar la actividad.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync(initialData.id);
      showToast('Actividad eliminada correctamente.', 'success');
      onSuccess?.();
      onClose();
    } catch {
      showToast('No fue posible eliminar la actividad.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col font-['Inter']">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#E4E7EC]">
          <div className="flex-1 min-w-0">
            {mode === 'edit' && (
              <div className="flex items-center gap-1.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium w-fit px-3 py-1 rounded-full mb-2.5">
                <CircleUserRound size={14} />
                Editando como: <span className="font-semibold">{currentUserRole}</span>
              </div>
            )}
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1D2433] truncate">
              {mode === 'edit' ? initialData?.title : 'Nueva actividad'}
            </h2>
            {mode === 'create' && (
              <p className="text-sm text-[#64748B] mt-0.5">Agrega una nueva tarea al tablero de tu equipo</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[#64748B] hover:bg-[#F8F9FB] transition flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Título — solo visible/editable en modo creación; en edición el título va en el header */}
          {mode === 'create' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-[#1D2433]">
                Título <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="Ej. Diseñar afiche para el evento"
                aria-invalid={!!errors.title}
                className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
                  errors.title ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
                }`}
                {...register('title')}
              />
              {errors.title && <p role="alert" className="text-xs text-[#EF4444]">{errors.title.message}</p>}
            </div>
          )}

          {/* Estado + Prioridad (pills) — layout de edición */}
          {mode === 'edit' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(({ value, label, dot }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('status', value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                        selectedStatus === value
                          ? 'bg-[#F1F5F9] border-[#94A3B8] text-[#1D2433]'
                          : 'bg-white border-[#E4E7EC] text-[#A0AEC0] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Prioridad</label>
                <div className="flex gap-2">
                  {priorities.map(({ value, label, dot }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('priority', value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        selectedPriority === value
                          ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#1D2433]'
                          : 'bg-white border-[#E4E7EC] text-[#1D2433] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Responsable + Fecha límite */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                Responsable
              </label>
              {usersError ? (
                <p className="text-xs text-[#EF4444]">No se pudo cargar la lista de responsables.</p>
              ) : (
                <div className="relative" ref={assigneeDropdownRef}>
                  <button
                    type="button"
                    disabled={usersLoading}
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                    className="w-full flex items-center gap-2 bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-3.5 py-2.5 text-sm text-[#1D2433] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent disabled:opacity-60 text-left"
                  >
                    {watch('assigneeId') ? (
                      <>
                        <UserAvatar name={users?.find((u) => u.id === watch('assigneeId'))?.name} size={22} />
                        <span className="truncate">{users?.find((u) => u.id === watch('assigneeId'))?.name}</span>
                      </>
                    ) : (
                      <span className="text-[#A0AEC0]">{usersLoading ? 'Cargando...' : 'Sin asignar'}</span>
                    )}
                    <ChevronDown size={14} className="ml-auto text-[#A0AEC0] flex-shrink-0" />
                  </button>
                  {assigneeDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E4E7EC] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setValue('assigneeId', ''); setAssigneeDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-[#F8F9FB] transition ${!watch('assigneeId') ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
                      >
                        <div className="w-[22px] h-[22px] rounded-full bg-[#E4E7EC] flex items-center justify-center text-[#64748B] text-[10px] font-bold">?</div>
                        <span>Sin asignar</span>
                        {!watch('assigneeId') && <Check size={14} className="ml-auto text-[#4F46E5]" />}
                      </button>
                      {users?.length === 0 && !usersLoading && (
                        <div className="px-3.5 py-2.5 text-sm text-[#A0AEC0]">No hay integrantes disponibles</div>
                      )}
                      {users?.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setValue('assigneeId', u.id); setAssigneeDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-[#F8F9FB] transition ${watch('assigneeId') === u.id ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
                        >
                          <UserAvatar name={u.name} size={22} />
                          <span className="truncate">{u.name}</span>
                          {watch('assigneeId') === u.id && <Check size={14} className="ml-auto text-[#4F46E5]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dueDate" className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                Fecha límite {mode === 'create' && <span className="text-[#EF4444]">*</span>}
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] pointer-events-none" />
                <input
                  id="dueDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  aria-invalid={!!errors.dueDate}
                  className={`w-full bg-[#F8F9FB] border rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#1D2433] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
                    errors.dueDate ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
                  }`}
                  {...register('dueDate')}
                />
              </div>
              {errors.dueDate && <p role="alert" className="text-xs text-[#EF4444]">{errors.dueDate.message}</p>}
            </div>
          </div>

          {/* Estado + Prioridad en modo creación (select simple, layout anterior) */}
          {mode === 'create' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1D2433]">Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {priorities.map(({ value, label, dot }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('priority', value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                        selectedPriority === value
                          ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#1D2433]'
                          : 'bg-white border-[#E4E7EC] text-[#1D2433] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-sm font-medium text-[#1D2433]">Estado</label>
                <select
                  id="status"
                  className="w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-3.5 py-2.5 text-sm text-[#1D2433] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                  {...register('status')}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe la actividad, entregables o contexto..."
              className="w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-3.5 py-2.5 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

          {/* Subtareas — solo edición. 🔧 campo no confirmado en backend */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-3 pt-2 border-t border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#1D2433]" />
                <span className="text-sm font-semibold text-[#1D2433]">Subtareas</span>
                <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {completedCount}/{subtasks.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4F46E5] rounded-full transition-all"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              <div className="flex flex-col gap-2">
                {subtasks.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSubtask(s.id)}
                      className="w-4 h-4 rounded accent-[#4F46E5]"
                    />
                    <span className={`text-sm ${s.done ? 'line-through text-[#A0AEC0]' : 'text-[#1D2433]'}`}>
                      {s.text}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Añadir subtarea..."
                  className="flex-1 bg-white border border-dashed border-[#E4E7EC] rounded-lg px-3.5 py-2 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center hover:bg-[#E0E7FF] transition flex-shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Enlace de evidencia */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="evidenceUrl" className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Enlace de evidencia
            </label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] pointer-events-none" />
              <input
                id="evidenceUrl"
                type="text"
                placeholder="https://..."
                aria-invalid={!!errors.evidenceUrl}
                className={`w-full bg-[#F8F9FB] border rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
                  errors.evidenceUrl ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
                }`}
                {...register('evidenceUrl')}
              />
            </div>
            {errors.evidenceUrl ? (
              <p role="alert" className="text-xs text-[#EF4444]">{errors.evidenceUrl.message}</p>
            ) : (
              <p className="text-xs text-[#A0AEC0]">Pega un enlace al trabajo entregado</p>
            )}
          </div>

          {/* Comentarios — solo edición */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-3 pt-2 border-t border-[#E4E7EC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1D2433]">
                <MessageSquare size={16} />
                Comentarios
                <span className="bg-[#F1F5F9] text-[#64748B] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </div>

              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#5B50D6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {comment.authorInitials}
                  </div>
                  <div className="bg-[#F8F9FB] rounded-lg px-3.5 py-2.5 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-[#1D2433]">{comment.authorName}</span>{' '}
                      <span className="text-xs text-[#A0AEC0]">{comment.timeAgo}</span>
                    </p>
                    <p className="text-sm text-[#1D2433] mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))}

              <div className="relative">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  placeholder="Agregar un comentario..."
                  className="w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  aria-label="Enviar comentario"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4F46E5] hover:text-[#4338CA]"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E7EC] bg-[#F8F9FB] rounded-b-2xl">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition disabled:opacity-60 ${
                confirmingDelete
                  ? 'bg-[#EF4444] border-[#EF4444] text-white hover:bg-[#DC2626]'
                  : 'border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2]'
              }`}
            >
              <Trash2 size={15} />
              {deleteMutation.isPending ? 'Eliminando...' : confirmingDelete ? '¿Confirmar?' : 'Eliminar actividad'}
            </button>
          ) : (
            <button type="button" title="Adjuntar archivo (próximamente)" disabled className="text-[#A0AEC0] disabled:opacity-60">
              <Paperclip size={18} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg border border-[#E4E7EC] text-sm font-semibold text-[#1D2433] hover:bg-white transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Guardar actividad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}