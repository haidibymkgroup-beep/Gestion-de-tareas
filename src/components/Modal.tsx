import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Ventana modal basada en el elemento nativo <dialog>: el navegador se encarga
 * de atrapar el foco, bloquear el fondo y cerrar con Esc (accesible por teclado).
 * Se monta solo cuando está abierta.
 */
export function Modal({ titulo, onCerrar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      // Un clic en el fondo oscuro (el propio <dialog>) cierra la ventana.
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="modal-contenido">
        <div className="modal-cabecera">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="boton-icono" aria-label="Cerrar" onClick={() => ref.current?.close()}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
