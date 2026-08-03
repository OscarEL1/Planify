import { useNavigate } from "react-router-dom";
import { TrendingUp, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import {
  useActivitiesQuery,
  useUsersQuery,
  useActivityStatsQuery,
} from "../hooks/useActivities";

const statusColors = {
  PENDIENTE: "#94A3B8",
  EN_PROCESO: "#3B82F6",
  EN_REVISION: "#8B5CF6",
  COMPLETADA: "#22C55E",
};

const statusLabels = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  EN_REVISION: "En revisión",
  COMPLETADA: "Completada",
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

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0)
    return (
      <div className="w-[140px] h-[140px] rounded-full border-8 border-[#E4E7EC]" />
    );

  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const visibleData = data.filter((d) => d.value > 0);

  const segments = visibleData.map((d, index) => {
    const percent = d.value / total;

    const accumulated = visibleData
      .slice(0, index)
      .reduce((sum, item) => sum + item.value / total, 0);

    return {
      ...d,
      dashArray: percent * circumference,
      dashOffset: -accumulated * circumference,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E4E7EC"
          strokeWidth="12"
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
            strokeDashoffset={seg.dashOffset}
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: activities } = useActivitiesQuery();
  const { data: users } = useUsersQuery();
  const { data: stats } = useActivityStatsQuery();

  const total = stats?.total ?? 0;
  const completed = stats?.byStatus?.COMPLETADA ?? 0;
  const inProgress = stats?.byStatus?.EN_PROCESO ?? 0;
  const inReview = stats?.byStatus?.EN_REVISION ?? 0;
  const pending = stats?.byStatus?.PENDIENTE ?? 0;
  const progressPercent = stats?.completionPercentage ?? 0;

  const donutData = [
    { label: "Pendiente", value: pending, color: statusColors.PENDIENTE },
    { label: "En proceso", value: inProgress, color: statusColors.EN_PROCESO },
    { label: "En revisión", value: inReview, color: statusColors.EN_REVISION },
    { label: "Completada", value: completed, color: statusColors.COMPLETADA },
  ];

  const memberProgress =
    users
      ?.map((u) => {
        const userActivities =
          activities?.filter((a) => a.assigneeId === u.id) || [];
        const userCompleted = userActivities.filter(
          (a) => a.status === "COMPLETADA",
        ).length;
        const userTotal = userActivities.length;
        const userPercent =
          userTotal > 0 ? Math.round((userCompleted / userTotal) * 100) : 0;
        return {
          ...u,
          total: userTotal,
          completed: userCompleted,
          percent: userPercent,
        };
      })
      .filter((u) => u.total > 0)
      .sort((a, b) => b.percent - a.percent) || [];

  const recentActivities = activities?.slice(0, 4) || [];

  return (
    <div
      className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors"
    >
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] dark:text-white mb-8">
          Progreso del equipo
        </h1>

        {/* 4 tarjetas principales */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">
                Total de actividades
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <BarChart3 size={16} className="text-[#4F46E5]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1D2433] dark:text-white">{total}</p>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1">en todos los estados</p>
          </div>

          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">
                Completadas
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center">
                <CheckCircle2 size={16} className="text-[#22C55E]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1D2433] dark:text-white">{completed}</p>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1">
              de {total} actividades
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">
                En proceso
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                <Clock size={16} className="text-[#3B82F6]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1D2433] dark:text-white">{inProgress}</p>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1">actualmente en curso</p>
          </div>

          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">
                Tasa de finalización
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <TrendingUp size={16} className="text-[#4F46E5]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#E4E7EC"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="4"
                    strokeDasharray={`${(progressPercent / 100) * 125.6} ${125.6}`}
                    transform="rotate(-90 24 24)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#4F46E5]">
                  {progressPercent}%
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D2433] dark:text-white">
                  {progressPercent}%
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">
                  de todas las actividades
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico dona + Progreso por integrante */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Actividades por estado */}
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#1D2433] dark:text-white mb-6">
              Actividades por estado
            </h2>
            <div className="flex items-center justify-center gap-8">
              <DonutChart data={donutData} />
              <div className="flex flex-col gap-3">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm text-[#1D2433] dark:text-white w-24">
                      {d.label}
                    </span>
                    <span className="text-sm font-semibold text-[#1D2433] dark:text-white w-6 text-right">
                      {d.value}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#9CA3AF] w-10 text-right">
                      {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progreso por integrante */}
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#1D2433] dark:text-white mb-6">
              Progreso por integrante
            </h2>
            <div className="flex flex-col gap-4">
              {memberProgress.length === 0 && (
                <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">
                  No hay actividades asignadas.
                </p>
              )}
              {memberProgress.map((member) => (
                <div key={member.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: getAvatarColor(member.name) }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <span className="text-sm font-medium text-[#1D2433] dark:text-white">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#1D2433] dark:text-white">
                      {member.percent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#E4E7EC] dark:bg-[#4B5563] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${member.percent}%`,
                          backgroundColor: getAvatarColor(member.name),
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#64748B] dark:text-[#9CA3AF] w-28 text-right">
                      {member.completed} de {member.total} completadas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividades recientes */}
        {recentActivities.length > 0 && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#1D2433] dark:text-white mb-4">
              Actividades recientes
            </h2>
            <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
              {recentActivities.map((activity) => {
                const priority =
                  priorityStyles[activity.priority] || priorityStyles.MEDIA;
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-[#F8F9FB] dark:hover:bg-[#374151] transition"
                  >
                    <div className="flex items-center gap-3">
                      {activity.assignee && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{
                            backgroundColor: getAvatarColor(
                              activity.assignee.name,
                            ),
                          }}
                        >
                          {getInitials(activity.assignee.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#1D2433] dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">
                          {activity.assignee?.name || "Sin asignar"}
                          {activity.dueDate &&
                            ` · Vence el ${formatDate(activity.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: priority.bg,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${statusColors[activity.status]}20`,
                          color: statusColors[activity.status],
                        }}
                      >
                        {statusLabels[activity.status]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
