import { ESTADOS, ETIQUETA_ESTADO, type Estado } from '../../lib/tipos';

interface Props {
  activa: Estado;
  cantidades: Record<Estado, number>;
  onElegir: (estado: Estado) => void;
}

/**
 * Selector de columna para el móvil: muestra cuál está a la vista y permite saltar
 * a otra con un toque (además de deslizar con el dedo). En pantallas grandes se oculta
 * porque se ven las tres columnas a la vez.
 */
export function PestanasColumnas({ activa, cantidades, onElegir }: Props) {
  return (
    <nav className="pestanas-columnas" aria-label="Columnas del tablero">
      {ESTADOS.map((estado) => (
        <button
          key={estado}
          type="button"
          className="pestana-columna"
          aria-current={activa === estado ? 'true' : undefined}
          onClick={() => onElegir(estado)}
        >
          {ETIQUETA_ESTADO[estado]}
          <span className="contador" aria-label={`${cantidades[estado]} tareas`}>
            {cantidades[estado]}
          </span>
        </button>
      ))}
    </nav>
  );
}
