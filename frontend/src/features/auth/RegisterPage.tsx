import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import * as api from '../../services/api';

const registerSchema = z.object({
  displayName: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Introduce un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await api.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      toast.success('Cuenta creada correctamente');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(
        err?.message ?? 'Error al crear la cuenta. Inténtalo de nuevo.'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
        Crear cuenta
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Nombre
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            className="input-field"
            {...register('displayName')}
          />
          {errors.displayName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="input-field"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 caracteres"
              className="input-field pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-2.5"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          Inicia sesión
        </Link>
      </p>
    </motion.div>
  );
}
