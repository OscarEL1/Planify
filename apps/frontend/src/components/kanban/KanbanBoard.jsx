import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Calendar, Link2, AlertTriangle, MessageSquare, CheckSquare } from 'lucide-react';
import { useActivitiesQuery, useUpdateActivityMutation } from '../../hooks/useActivities';
import { useToast } from '../common/ToastProvider';

const columns = [
  { id: 'PENDIENTE', title: 'Pendiente', color: '#94A3B8', bgColor: '#F1F5F9' },
  { id: 'EN_PROCESO', title: 'En proceso', color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'EN_REVISION', title: 'En revisión', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { id: 'COMPLETADA', title: 'Completada', color: '#22C55E', bgColor: '#F0FDF4' },
];

const priorityStyles = {
  ALTA: { bg: '#FEF2F2', text: '#EF4444', label: 'Alta' },
  MEDIA: { bg: '#FFFBEB', text: '#F59E0B', label: 'Media' },
  BAJA: { bg: '#F0FDF4', text: '#22C55E', label: 'Baja' },
};

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

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'COMPLETADA') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function KanbanCard({ activity, onClick }) {
  const priority = priorityStyles[activity.priority] || priorityStyles.MEDIA;
  const overdue = isOverdue(activity.dueDate, activity.status);
  const completedSubtasks = activity.subtasks?.filter((s) => s.done).length || 0;
  const totalSubtasks = activity.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(activity)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(activity); }}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-[#E4E7EC] text-left hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: priority.bg, color: priority.text }}
        >
          {priority.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[#1D2433] mb-2 line-clamp-2">{activity.title}</h3>

      {activity.assignee && (
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: getAvatarColor(activity.assignee.name) }}
          >
            {getInitials(activity.assignee.name)}
          </div>
          <span className="text-xs text-[#64748B]">{activity.assignee.name}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-[#64748B] mb-2">
        {activity.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? 'text-[#EF4444] font-medium' : ''}`}>
            {overdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
            {formatDate(activity.dueDate)}
          </span>
        )}
        {activity.evidenceUrl && (
          <span className="flex items-center gap-1">
            <Link2 size={12} />
          </span>
        )}
        {activity.comments?.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {activity.comments.length}
          </span>
        )}
      </div>

      {totalSubtasks > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare size={12} />
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] rounded-full transition-all"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard({ activities: filteredActivities }) {
  const navigate = useNavigate();
  const { data: allActivities, isLoading, isError } = useActivitiesQuery();
  const activities = filteredActivities || allActivities;
  const updateMutation = useUpdateActivityMutation();
  const { showToast } = useToast();

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    try {
      await updateMutation.mutateAsync({
        id: draggableId,
        payload: { status: destination.droppableId },
      });
      showToast('Actividad movida correctamente.', 'success');
    } catch {
      showToast('No fue posible mover la actividad.', 'error');
    }
  };

  const goToDetail = (activity) => {
    navigate(`/activities/${activity.id}`);
  };

  const getColumnActivities = (status) =>
    activities?.filter((a) => a.status === status) || [];

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center text-sm text-[#64748B]">
        Cargando tablero...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-8 text-center text-sm text-[#EF4444]">
        No se pudieron cargar las actividades.
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnActivities = getColumnActivities(column.id);
            return (
              <div key={column.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                  <h3 className="text-sm font-semibold text-[#1D2433]">{column.title}</h3>
                  <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                    {columnActivities.length}
                  </span>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[#EEF2FF]' : ''
                      }`}
                      style={{ backgroundColor: snapshot.isDraggingOver ? '#EEF2FF' : column.bgColor }}
                    >
                      <div className="flex flex-col gap-3">
                        {columnActivities.map((activity, index) => (
                          <Draggable key={activity.id} draggableId={activity.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <KanbanCard activity={activity} onClick={goToDetail} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

    </>
  );
}
