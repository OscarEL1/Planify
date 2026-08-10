import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MessageSquare,
  Calendar,
  Link2,
  Loader2,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import {
  useActivityByIdQuery,
  useDeleteActivityMutation,
  useAddCommentMutation,
} from "../hooks/useActivities";
import { useToast } from "../components/common/useToast";
import { useAuth } from "../context/useAuth";
import ActivityFormModal from "../components/activities/ActivityFormModal";
import { getInitials, getAvatarColor } from "../utils/avatarColors";

const statusStyles = {
  PENDIENTE: {
    bg: "#FFFBEB",
    color: "#F59E0B",
    label: "Pendiente",
    dot: "#F59E0B",
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
  const deleteMutation = useDeleteActivityMutation();
  const addCommentMutation = useAddCommentMutation();

  const [commentDraft, setCommentDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const status = statusStyles[activity?.status] || statusStyles.PENDIENTE;
  const priority = priorityStyles[activity?.priority] || priorityStyles.MEDIA;

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
        className="flex min-h-screen w-full bg-[#F9FAFB] transition-colors"
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
        className="flex min-h-screen w-full bg-[#F9FAFB] transition-colors"
      >
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[#64748B]">Actividad no encontrada.</p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-full bg-[#F9FAFB] transition-colors"
    >
      <Navbar />

      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E7EC]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/kanban")}
              className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1D2433] transition"
            >
              <ArrowLeft size={16} />
              Tablero
            </button>
            <span className="text-[#A0AEC0]">/</span>
            <span className="text-xs font-medium text-[#1D2433]">
              Detalle de actividad
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isObserver && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#1D2433] hover:bg-[#F8F9FB] transition"
                >
                  <Edit2 size={12} />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                    confirmingDelete
                      ? "bg-[#EF4444] border-[#EF4444] text-white"
                      : "border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2]"
                  }`}
                >
                  <Trash2 size={12} />
                  {confirmingDelete ? "¿Confirmar?" : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ID, categoría y estado + sidebar alineado */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded">
                ACT-{activity.id?.slice(0, 4).toUpperCase()}
              </span>
              <span className="text-xs text-[#64748B]">·</span>
              <span className="text-xs text-[#64748B]">Actividad Escolar</span>
              <span className="text-xs text-[#64748B]">·</span>
              <span
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: status.dot }}
                />
                {status.label}
              </span>
            </div>

            {/* Título y descripción */}
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] mb-2">
              {activity.title}
            </h1>
            {activity.description && (
              <p className="text-sm text-[#64748B] mb-6">
                {activity.description}
              </p>
            )}
            {!activity.description && <div className="mb-6" />}

            {/* Evidencia */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-[#1D2433] mb-3">
                Evidencia
              </h2>
              {activity.evidenceUrl ? (
                <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 size={14} className="text-[#22C55E] flex-shrink-0" />
                    <a
                      href={activity.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4F46E5] hover:underline truncate"
                    >
                      {activity.evidenceUrl}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(activity.evidenceUrl)}
                      className="p-1.5 rounded hover:bg-[#DCFCE7] transition"
                      title="Copiar enlace"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#64748B]">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <a
                      href={activity.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-[#DCFCE7] transition"
                      title="Abrir enlace"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#64748B]">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#A0AEC0] bg-[#F8F9FB] rounded-lg px-4 py-3">
                  <Link2 size={14} />
                  Aún no se ha registrado evidencia de entrega
                </div>
              )}
            </div>

            {/* Comentarios */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-[#1D2433]" />
                <h2 className="text-sm font-semibold text-[#1D2433]">
                  Comentarios
                </h2>
                <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
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

                        <div className="flex-1 bg-[#F8F9FB] rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#1D2433]">
                              {comment.user?.name || "Usuario"}
                            </span>

                            <span className="text-xs text-[#A0AEC0]">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>

                          <p className="text-sm text-[#1D2433]">
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
                        className="w-full bg-white border border-[#E4E7EC] rounded-lg px-4 py-3 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-80 flex-shrink-0 pl-6 border-l border-[#E4E7EC] flex flex-col gap-5">
            {/* Información */}
            <div className="bg-[#F8F9FB] border border-[#E4E7EC] rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Información
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Estado</span>
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
                  <span className="text-sm text-[#64748B]">Prioridad</span>
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
                  <span className="text-sm text-[#64748B]">Responsable</span>
                  {activity.assignee ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: getAvatarColor(
                            activity.assignee.name,
                          ),
                        }}
                      >
                        {getInitials(activity.assignee.name)}
                      </div>
                      <span className="text-sm text-[#1D2433] truncate">
                        {activity.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#A0AEC0]">
                      Sin asignar
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Fecha límite</span>
                  <span className="flex items-center gap-1 text-sm text-[#1D2433]">
                    <Calendar size={12} />
                    {activity.dueDate
                      ? formatDate(activity.dueDate)
                      : "Sin fecha"}
                  </span>
                </div>
              </div>
            </div>

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
