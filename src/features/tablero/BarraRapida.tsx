import { useState, type FormEvent } from 'react';

interface Props {
  onCrear: (titulo: string) => Promise<boolean>;
}

/** Campo de texto rápido, fijo abajo: escribe y pulsa Enter para crear una tarea pendiente. */
export function BarraRapida({ onCrear }: Props) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const titulo = texto.trim();
    if (!titulo || enviando) return;
    setEnviando(true);
    const ok = await onCrear(titulo);
    setEnviando(false);
    if (ok) setTexto('');
  }

  return (
    <div className="barra-inferior">
      <form className="barra-rapida" onSubmit={enviar}>
        <label className="solo-lectores" htmlFor="texto-rapido">
          Nueva tarea
        </label>
        <input
          id="texto-rapido"
          type="text"
          value={texto}
          maxLength={200}
          placeholder="Nueva tarea…"
          autoComplete="off"
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="boton boton-primario" disabled={!texto.trim() || enviando}>
          Añadir
        </button>
      </form>
    </div>
  );
}
