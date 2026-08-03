import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MessageSquare,
  CheckSquare,
  Calendar,
  Link2,
  Loader2,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import {
  useActivityByIdQuery,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useAddCommentMutation,
} from "../hooks/useActivities";
import { useToast } from "../components/common/useToast";
import { useAuth } from "../context/useAuth";
import ActivityFormModal from "../components/activities/ActivityFormModal";

const statusStyles = {
  PENDIENTE: {
    bg: "#F1F5F9",
    color: "#64748B",
    label: "Pendiente",
    dot: "#94A3B8",
  },
  EN_PROCESO: {
    bg: "#EFF6FF",
    color: "#3B82F6",
    label: "En proceso",
    dot: "#3B82F6",
  },
  EN_REVISION: {
    bg: "#F5F3FF",
    color: "#8B5CF6",
    label: "En revisión",
    dot: "#8B5CF6",
  },
  COMPLETADA: {
    bg: "#F0FDF4",
    color: "#22C55E",
    label: "Completada",
    dot: "#22C55E",
  },
};

const priorityStyles = {
  ALTA: { bg: "#FEF2F2", color: "#EF4444", label: "Alta" },
  MEDIA: { bg: "#FFFBEB", color: "#F59E0B", label: "Media" },
  BAJA: { bg: "#F0FDF4", color: "#22C55E", label: "Baja" },
};

const avatarColors = [
  "#4F46E5",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#DB2777",
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isObserver } = useAuth();
  const { data: activity, isLoading, isError } = useActivityByIdQuery(id);
  const updateMutation = useUpdateActivityMutation();
  const deleteMutation = useDeleteActivityMutation();
  const addCommentMutation = useAddCommentMutation();

  const [commentDraft, setCommentDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const status = statusStyles[activity?.status] || statusStyles.PENDIENTE;
  const priority = priorityStyles[activity?.priority] || priorityStyles.MEDIA;
  const completedSubtasks =
    activity?.subtasks?.filter((s) => s.done).length || 0;
  const totalSubtasks = activity?.subtasks?.length || 0;
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleSendComment = async () => {
    if (!commentDraft.trim()) return;
    const text = commentDraft.trim();
    setCommentDraft("");
    try {
      await addCommentMutation.mutateAsync({ activityId: id, text });
    } catch {
      showToast("No fue posible agregar el comentario.", "error");
    }
  };

  const handleToggleSubtask = async (subtask) => {
    if (isObserver) return;

    const updatedSubtasks = activity.subtasks.map((s) =>
      s.id === subtask.id ? { ...s, done: !s.done } : s,
    );

    try {
      await updateMutation.mutateAsync({
        id,
        payload: { subtasks: updatedSubtasks },
      });
    } catch {
      showToast("No fue posible actualizar la subtarea.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      showToast("Actividad eliminada.", "success");
      navigate("/kanban");
    } catch {
      showToast("No fue posible eliminar la actividad.", "error");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors"
      >
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
        </main>
      </div>
    );
  }

  if (isError || !activity) {
    return (
      <div
        className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors"
      >
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[#64748B] dark:text-[#9CA3AF]">Actividad no encontrada.</p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors"
    >
      <Navbar />

      <main className="flex-1 px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/kanban")}
              className="flex items-center gap-1 text-sm text-[#64748B] dark:text-[#9CA3AF] hover:text-[#1D2433] transition"
            >
              <ArrowLeft size={16} />
              Tablero
            </button>
            <span className="text-[#A0AEC0] dark:text-[#6B7280]">/</span>
            <span className="text-sm font-medium text-[#1D2433] dark:text-white">
              Detalle de actividad
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isObserver && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E4E7EC] dark:border-[#374151] text-sm font-medium text-[#1D2433] dark:text-white hover:bg-[#F8F9FB] dark:hover:bg-[#374151] transition"
                >
                  <Edit2 size={14} />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    confirmingDelete
                      ? "bg-[#EF4444] border-[#EF4444] text-white"
                      : "border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2]"
                  }`}
                >
                  <Trash2 size={14} />
                  {confirmingDelete ? "¿Confirmar?" : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex gap-6 items-start">
          {/* Comments */}
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-[#1D2433] dark:text-white" />
                <h2 className="text-sm font-semibold text-[#1D2433] dark:text-white">
                  Comentarios
                </h2>
                <span className="text-xs text-[#64748B] dark:text-[#9CA3AF] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                  {activity.comments?.length || 0}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {[...(activity.comments || [])]
                  .sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
                  )
                  .map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: getAvatarColor(comment.user?.name),
                        }}
                      >
                        {getInitials(comment.user?.name)}
                      </div>

                        <div className="flex-1 bg-[#F8F9FB] dark:bg-[#374151] rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#1D2433] dark:text-white">
                              {comment.user?.name || "Usuario"}
                            </span>

                            <span className="text-xs text-[#A0AEC0] dark:text-[#6B7280]">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>

                          <p className="text-sm text-[#1D2433] dark:text-white">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Campo para agregar comentarios — oculto para OBSERVADOR */}
                {!isObserver && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      TÚ
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                        disabled={addCommentMutation.isPending}
                        placeholder={
                          addCommentMutation.isPending
                            ? "Publicando comentario..."
                            : "Escribe un comentario y presiona Enter..."
                        }
                        className="w-full bg-white dark:bg-[#374151] border border-[#E4E7EC] dark:border-[#4B5563] rounded-lg px-4 py-3 text-sm text-[#1D2433] dark:text-white placeholder-[#A0AEC0] dark:placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 flex-shrink-0">
            {/* Información */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5 mb-4">
              <h3 className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide mb-4">
                Información
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Estado</span>
                  <span
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: status.color }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.dot }}
                    />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Prioridad</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: priority.bg,
                      color: priority.color,
                    }}
                  >
                    {priority.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Responsable</span>
                  {activity.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                        style={{
                          backgroundColor: getAvatarColor(
                            activity.assignee.name,
                          ),
                        }}
                      >
                        {getInitials(activity.assignee.name)}
                      </div>
                      <span className="text-sm text-[#1D2433] dark:text-white">
                        {activity.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#A0AEC0] dark:text-[#6B7280]">
                      Sin asignar
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Fecha límite</span>
                  <span className="flex items-center gap-1 text-sm text-[#1D2433] dark:text-white">
                    <Calendar size={12} />
                    {activity.dueDate
                      ? formatDate(activity.dueDate)
                      : "Sin fecha"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Subtareas</span>
                  <span className="text-sm text-[#1D2433] dark:text-white">
                    {completedSubtasks}/{totalSubtasks} completadas
                  </span>
                </div>
                {totalSubtasks > 0 && (
                  <div className="w-full h-1.5 bg-[#E4E7EC] dark:bg-[#4B5563] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] rounded-full"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Subtareas */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare size={16} className="text-[#1D2433] dark:text-white" />
                <h3 className="text-sm font-semibold text-[#1D2433] dark:text-white">
                  Subtareas
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {activity.subtasks?.map((subtask) => (
                  <label
                    key={subtask.id}
                    className={`flex items-center gap-2.5 ${
                      isObserver ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.done}
                      disabled={isObserver}
                      onChange={() => handleToggleSubtask(subtask)}
                      className={`w-4 h-4 rounded accent-[#4F46E5] ${
                        isObserver
                          ? "cursor-default opacity-70"
                          : "cursor-pointer"
                      }`}
                    />
                    <span
                      className={`text-sm ${subtask.done ? "line-through text-[#A0AEC0] dark:text-[#6B7280]" : "text-[#1D2433] dark:text-white"}`}
                    >
                      {subtask.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Evidencia */}
            {activity.evidenceUrl && (
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 size={16} className="text-[#1D2433] dark:text-white" />
                  <h3 className="text-sm font-semibold text-[#1D2433] dark:text-white">
                    Evidencia
                  </h3>
                </div>
                <a
                  href={activity.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#4F46E5] hover:underline break-all"
                >
                  {activity.evidenceUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      {showEditModal && (
        <ActivityFormModal
          mode="edit"
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => setShowEditModal(false)}
          initialData={activity}
        />
      )}
    </div>
  );
}
