import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, Link2, AlertTriangle, MessageSquare, CheckSquare } from 'lucide-react';
import { useUpdateActivityStatusMutation } from '../../hooks/useActivities';
import { useToast } from '../common/useToast';

const columns = [
  { id: 'PENDIENTE', title: 'Pendiente', color: '#94A3B8', bgClass: 'bg-[#F1F5F9] dark:bg-[#1E293B]' },
  { id: 'EN_PROCESO', title: 'En proceso', color: '#3B82F6', bgClass: 'bg-[#EFF6FF] dark:bg-[#172554]' },
  { id: 'EN_REVISION', title: 'En revisión', color: '#8B5CF6', bgClass: 'bg-[#F5F3FF] dark:bg-[#2E1065]' },
  { id: 'COMPLETADA', title: 'Completada', color: '#22C55E', bgClass: 'bg-[#F0FDF4] dark:bg-[#052E16]' },
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
      className="w-full bg-white dark:bg-[#1F2937] rounded-xl p-4 shadow-sm border border-[#E4E7EC] dark:border-[#374151] text-left hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: priority.bg, color: priority.text }}
        >
          {priority.label}
        </span>
      </div>

      <h3 className="text-[13px] font-semibold text-[#1D2433] dark:text-white mb-3 line-clamp-2 leading-snug">{activity.title}</h3>

      {activity.assignee && (
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
            style={{ backgroundColor: getAvatarColor(activity.assignee.name) }}
          >
            {getInitials(activity.assignee.name)}
          </div>
          <span className="text-[11px] text-[#64748B] dark:text-[#9CA3AF]">{activity.assignee.name}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#9CA3AF] mb-2">
        {activity.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? 'text-[#EF4444] font-medium' : ''}`}>
            {overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {formatDate(activity.dueDate)}
          </span>
        )}
        {activity.evidenceUrl && (
          <span className="flex items-center gap-1">
            <Link2 size={11} />
          </span>
        )}
        {activity.comments?.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {activity.comments.length}
          </span>
        )}
      </div>

      {totalSubtasks > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-[#F1F5F9] dark:border-[#374151]">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#9CA3AF] mb-1.5">
            <span className="flex items-center gap-1">
              <CheckSquare size={11} />
              {completedSubtasks}/{totalSubtasks}
            </span>
            <span className="font-medium">{Math.round(subtaskProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#E4E7EC] dark:bg-[#4B5563] rounded-full overflow-hidden">
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

export default function KanbanBoard({ activities: filteredActivities, isObserver = false }) {
  const navigate = useNavigate();
  const activities = filteredActivities || [];
  const updateStatusMutation = useUpdateActivityStatusMutation();
  const { showToast } = useToast();

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: draggableId,
        status: destination.droppableId,
      });
      showToast('Actividad movida correctamente.', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.message || 'No fue posible mover la actividad.',
        'error',
      );
    }
  };

  const goToDetail = (activity) => {
    navigate(`/activities/${activity.id}`);
  };

  const getColumnActivities = (status) =>
    activities?.filter((a) => a.status === status) || [];

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center text-sm text-[#64748B] dark:text-[#9CA3AF]">
        No hay actividades para mostrar.
      </div>
    );
  }

  const boardContent = (
    <div className="grid grid-cols-4 gap-3">
      {columns.map((column) => {
        const columnActivities = getColumnActivities(column.id);
        return (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
              <h3 className="text-xs font-bold text-[#1D2433] dark:text-white uppercase tracking-wide">{column.title}</h3>
              <span className="text-[10px] font-bold text-[#64748B] dark:text-[#9CA3AF] bg-[#F1F5F9] dark:bg-[#374151] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {columnActivities.length}
              </span>
            </div>
            <Droppable droppableId={column.id} isDropDisabled={isObserver}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${column.bgClass} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-[#4F46E5]/30' : ''
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {columnActivities.map((activity, index) => (
                      <Draggable key={activity.id} draggableId={activity.id} index={index} isDragDisabled={isObserver}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.9 : 1,
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
  );

  return (
    <DragDropContext onDragEnd={isObserver ? () => {} : handleDragEnd}>
      {boardContent}
    </DragDropContext>
  );
}
