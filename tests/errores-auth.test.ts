import { describe, expect, it } from 'vitest';
import { traducirErrorAuth } from '../src/features/auth/errores';

describe('traducirErrorAuth', () => {
  it('traduce credenciales inválidas', () => {
    expect(traducirErrorAuth({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
    expect(traducirErrorAuth({ code: 'invalid_credentials' })).toBe('Correo o contraseña incorrectos.');
  });
  it('traduce correo sin confirmar y usuario existente', () => {
    expect(traducirErrorAuth({ code: 'email_not_confirmed' })).toContain('confirmado');
    expect(traducirErrorAuth({ message: 'User already registered' })).toContain('Ya existe una cuenta');
  });
  it('traduce el límite de intentos', () => {
    expect(traducirErrorAuth({ status: 429 })).toContain('demasiados intentos');
    expect(traducirErrorAuth({ code: 'over_email_send_rate_limit' })).toContain('demasiados intentos');
  });
  it('traduce errores de red', () => {
    expect(traducirErrorAuth({ message: 'Failed to fetch' })).toContain('conexión');
  });
  it('devuelve un mensaje genérico para errores desconocidos y vacío si no hay error', () => {
    expect(traducirErrorAuth({ message: 'algo raro' })).toContain('error inesperado');
    expect(traducirErrorAuth(null)).toBe('');
  });
});
