// Llamadas HTTP a los flujos de Power Automate.
// Reglas comunes a todas las pantallas:
//   - UNA petición por llamada: aquí no hay reintentos, ni automáticos ni diferidos.
//   - El cliente no corta nunca antes de 90 s (Power Automate a veces tarda decenas de segundos).
//   - Cada pantalla protege su botón con una guarda de "petición en curso" (ver FPRed.guarda).
(() => {
  "use strict";

  const TIEMPO_MINIMO_MS = 90000;
  const TIEMPO_MAXIMO_MS = 120000;
  const AVISO_ESPERA_MS = 10000;

  // Peticiones en curso que no deben perderse si el usuario cierra o recarga la página.
  let enCursoProtegidas = 0;
  window.addEventListener("beforeunload", (e) => {
    if (enCursoProtegidas > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  class ErrorRed extends Error {
    constructor(tipo, causa) {
      super(tipo === "tiempo" ? "Sin respuesta del servicio a tiempo" : "Fallo de red");
      this.name = "ErrorRed";
      this.tipo = tipo; // "tiempo" | "red"
      this.cause = causa;
    }
  }

  // POST JSON. Devuelve { status, ok, datos } con cualquier código HTTP.
  // Lanza ErrorRed solo si no llega respuesta completa (fallo de red o tiempo agotado).
  //   alTardar:      se llama una vez si a los 10 s aún no hay respuesta.
  //   avisarAlSalir: pide confirmación al cerrar o recargar mientras la petición sigue en curso.
  async function postJson(url, cuerpo, { alTardar, avisarAlSalir = false, tiempoMaximoMs = TIEMPO_MAXIMO_MS } = {}) {
    const ctrl = new AbortController();
    const corte = setTimeout(() => ctrl.abort(), Math.max(tiempoMaximoMs, TIEMPO_MINIMO_MS));
    const aviso = alTardar ? setTimeout(alTardar, AVISO_ESPERA_MS) : null;
    if (avisarAlSalir) enCursoProtegidas++;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: ctrl.signal
      });
      const texto = await res.text();
      let datos = null;
      if (texto) {
        try { datos = JSON.parse(texto); } catch { datos = null; }
      }
      return { status: res.status, ok: res.ok, datos };
    } catch (err) {
      throw new ErrorRed(ctrl.signal.aborted ? "tiempo" : "red", err);
    } finally {
      clearTimeout(corte);
      if (aviso) clearTimeout(aviso);
      if (avisarAlSalir) enCursoProtegidas--;
    }
  }

  // Guarda de "petición en curso" para un botón: lo desactiva y muestra "Enviando…"
  // desde el primer clic hasta que termina la tarea; mientras tanto ignora nuevos intentos.
  // Devuelve la función que hay que llamar con la tarea (async) a proteger.
  function guarda(boton, textoEnCurso = "Enviando…") {
    const texto = boton.querySelector(".btn-text") || boton;
    const textoOriginal = texto.textContent;
    let ocupado = false;

    return async (tarea) => {
      if (ocupado) return;
      ocupado = true;
      boton.disabled = true;
      boton.classList.add("loading");
      boton.setAttribute("aria-busy", "true");
      texto.textContent = textoEnCurso;
      try {
        await tarea();
      } finally {
        ocupado = false;
        boton.disabled = false;
        boton.classList.remove("loading");
        boton.removeAttribute("aria-busy");
        texto.textContent = textoOriginal;
      }
    };
  }

  window.FPRed = { postJson, guarda, ErrorRed };
})();
