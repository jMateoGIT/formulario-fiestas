// main.js (revisado)
(() => {
  "use strict";

  /* Utilidad corta para seleccionar */
  const $ = (sel) => document.querySelector(sel);

  /* Ajusta a tu backend; no expongas la URL con clave en cliente */
  const ENDPOINT = "https://prod-70.westus.logic.azure.com:443/workflows/2035cd8f81154fcc9743ba4b231a1a3f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Vm-UQaC9QxujqKMk7hAj3phQ_lAOF60hxczY9lzVpqE";

  let fp;

  /** Configura el date‑picker */
  const configurarFlatpickr = (mode = "multiple") => {
    if (fp) fp.destroy();
    fp = flatpickr("#Fechas", {
      mode,
      dateFormat: "d/m/Y", // ISO => mejor para backend
      locale: flatpickr.l10ns.es,
      allowInput: true,
      conjunction: ", "
    });
  };

  /** Muestra mensaje de feedback */
  const mostrarMensaje = (msg, tipo = "success") => {
    const respuesta = $("#respuesta");
    respuesta.textContent = msg;
    respuesta.className = tipo;
  };

  /** Activa / desactiva spinner y botón */
  const toggleLoading = (loading = true) => {
    const btn = $("#btnEnviar");
    btn.disabled = loading;
    btn.classList.toggle("loading", loading);
  };

  /* Iniciar cuando el DOM esté listo */
  document.addEventListener("DOMContentLoaded", () => {
    configurarFlatpickr("multiple");

    $("#modoMultiple").addEventListener("change", () => configurarFlatpickr("multiple"));
    $("#modoRango").addEventListener("change", () => configurarFlatpickr("range"));

    const inputNumero = $("#NumeroJDE");
    const divNombre = $("#nombreEmpleado");

    /* Validación en tiempo real del número */
    inputNumero.addEventListener("input", () => {
      const num = inputNumero.value.trim();

      if (num.length < 6) {
        divNombre.textContent = "";
        return;
      }

      if (!/^\d{6}$/.test(num)) {
        divNombre.textContent = "❌ Deben ser 6 dígitos numéricos";
        divNombre.style.color = "var(--color-accent)";
        return;
      }

    /* Envío del formulario */
    $("#formFiestas").addEventListener("submit", async (e) => {
      e.preventDefault();

      const num = inputNumero.value.trim();
      const fechas = $("#Fechas").value.trim();

      // Validaciones HTML + JS para mostrar mensajes accesibles
      if (!/^\d{6}$/.test(num)) {
        inputNumero.setCustomValidity("Formato inválido");
        inputNumero.reportValidity();
        return;
      } else {
        inputNumero.setCustomValidity("");
      }

      if (!fechas) {
        mostrarMensaje("❌ Debes seleccionar una o más fechas.", "error");
        return;
      }

      $("#FechasSolicitadas").value = fechas; // por si backend lo necesita

      const body = {
        empleado: num,
        email: $("#Email").value.trim(),
        fechasSolicitadas: fechas,
        comentario: $("#Comentario").value.trim()
      };

      try {
        toggleLoading(true);
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          mostrarMensaje("✅ Solicitud enviada correctamente.");
          e.target.reset();
          divNombre.textContent = "";
        } else {
          mostrarMensaje(`❌ Error al enviar la solicitud (${res.status}).`, "error");
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje("⚠️ Error de conexión.", "error");
      } finally {
        toggleLoading(false);
      }
    });
  });
})();

