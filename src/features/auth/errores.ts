// Traduce los errores de Supabase Auth a mensajes claros en español.

interface ErrorAuthLike {
  message?: string;
  code?: string;
  status?: number;
}

export function traducirErrorAuth(error: ErrorAuthLike | null | undefined): string {
  if (!error) return '';
  const codigo = error.code ?? '';
  const mensaje = (error.message ?? '').toLowerCase();

  if (codigo === 'invalid_credentials' || mensaje.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (codigo === 'email_not_confirmed' || mensaje.includes('email not confirmed')) {
    return 'Aún no has confirmado tu correo. Revisa tu bandeja de entrada.';
  }
  if (codigo === 'user_already_exists' || mensaje.includes('already registered')) {
    return 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.';
  }
  if (codigo === 'weak_password' || mensaje.includes('password should be at least')) {
    return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';
  }
  if (
    codigo === 'over_email_send_rate_limit' ||
    codigo === 'over_request_rate_limit' ||
    error.status === 429 ||
    mensaje.includes('rate limit')
  ) {
    return 'Has hecho demasiados intentos. Espera un momento y vuelve a probar.';
  }
  if (codigo === 'validation_failed' || mensaje.includes('invalid format') || mensaje.includes('unable to validate email')) {
    return 'El correo no tiene un formato válido.';
  }
  if (mensaje.includes('failed to fetch') || mensaje.includes('network')) {
    return 'No hay conexión con el servidor. Comprueba tu internet.';
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}
