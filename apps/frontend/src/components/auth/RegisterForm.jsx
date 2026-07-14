import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CircleUserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register as registerUser } from '../../services/authService';

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'El nombre es obligatorio'),
    email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setServerError('');
    setIsSubmitting(true);
    try {
      // 🔧 AJUSTAR payload cuando el backend confirme el contrato de POST /auth/register
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      navigate('/login');
    } catch (error) {
      if (error.response) {
        setServerError(
          error.response.status === 409
            ? 'Este correo ya está registrado.'
            : error.response.data?.message || 'Ocurrió un error al crear la cuenta.'
        );
      } else if (error.request) {
        setServerError('No se pudo conectar con el servidor. Intenta de nuevo.');
      } else {
        setServerError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" aria-label="Formulario de registro">
      {/* Badge de rol */}
      <div className="flex items-center gap-2.5 bg-[#EEF2FF] text-[#4F46E5] text-[13px] font-medium px-4 py-2.5 rounded-2xl">
        <CircleUserRound size={18} strokeWidth={2} />
        <span>
          Te unirás como <span className="font-bold">Integrante del equipo</span>
        </span>
      </div>

      {/* Nombre completo */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-[13px] font-medium text-[#1D2433]">
          Nombre completo
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          placeholder="Ej. Lucía Ramírez"
          className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
            errors.fullName ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
          }`}
          {...register('fullName')}
        />
        {errors.fullName && <p role="alert" className="text-[11px] text-[#EF4444]">{errors.fullName.message}</p>}
      </div>

      {/* Correo escolar */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-[#1D2433]">
          Correo escolar
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          placeholder="tu@colegio.edu"
          className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
            errors.email ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
          }`}
          {...register('email')}
        />
        {errors.email && <p role="alert" className="text-[11px] text-[#EF4444]">{errors.email.message}</p>}
      </div>

      {/* Contraseña */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-[#1D2433]">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            placeholder="Mínimo 8 caracteres"
            className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
              errors.password ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#64748B]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p role="alert" className="text-[11px] text-[#EF4444]">{errors.password.message}</p>}
      </div>

      {/* Confirmar contraseña */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#1D2433]">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            placeholder="Repite tu contraseña"
            className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
              errors.confirmPassword ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#64748B]"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && <p role="alert" className="text-[11px] text-[#EF4444]">{errors.confirmPassword.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="text-[13px] text-[#EF4444] bg-[#FEF2F2] border border-red-200 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 mt-1"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  );
}