import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login } from '../../services/authService';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export default function LoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onBlur' });

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setServerError('');
    setIsSubmitting(true);
    try {
      await login(data);
      queryClient.clear();
      navigate('/dashboard');
    } catch (error) {
      if (error.response) {
        setServerError(
          error.response.status === 401
            ? 'Correo o contraseña incorrectos.'
            : error.response.data?.message || 'Ocurrió un error al iniciar sesión.'
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" aria-label="Formulario de inicio de sesión">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-[#1D2433]">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          placeholder="tu@colegio.edu"
          className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
            errors.email ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
          }`}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-[11px] text-[#EF4444]">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-[#1D2433]">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            placeholder="••••••••"
            className={`w-full bg-[#F8F9FB] border rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-[#1D2433] placeholder-[#A0AEC0] outline-none transition focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent ${
              errors.password ? 'border-[#EF4444]' : 'border-[#E4E7EC]'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#64748B]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="text-[11px] text-[#EF4444]">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end -mt-1">
        <a href="/forgot-password" className="text-[13px] font-medium text-[#4F46E5] hover:text-[#4338CA]">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {serverError && (
        <p role="alert" className="text-[13px] text-[#EF4444] bg-[#FEF2F2] border border-red-200 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}