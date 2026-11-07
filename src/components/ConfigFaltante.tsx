/** Pantalla de ayuda cuando faltan las variables de entorno de Supabase. */
export function ConfigFaltante() {
  return (
    <main className="pagina">
      <h1>Falta configurar Supabase</h1>
      <p>
        La aplicación necesita las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
      </p>
      <ol>
        <li>
          Copia <code>.env.example</code> como <code>.env.local</code>.
        </li>
        <li>
          Rellena los dos valores desde tu proyecto de Supabase (Project Settings → API).
        </li>
        <li>Reinicia el servidor de desarrollo (<code>npm run dev</code>).</li>
      </ol>
      <p className="texto-suave">Los pasos completos están en el README.</p>
    </main>
  );
}
