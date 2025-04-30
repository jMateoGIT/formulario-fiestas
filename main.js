(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const ENDPOINT = "https://prod-70.westus.logic.azure.com:443/workflows/2035cd8f81154fcc9743ba4b231a1a3f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Vm-UQaC9QxujqKMk7hAj3phQ_lAOF60hxczY9lzVpqE";
  const VALIDACION_ENDPOINT = "https://prod-40.westus.logic.azure.com:443/workflows/ccfa085e953040e0bd375ce228f1bd81/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fwxAql7wt_ZS-aEMrjquaHx7fFJAMLxufUkMwoxCjtA";

  let fp;
  let empleadoValido = false;

  const configurarFlatpickr = (mode = "multiple") => {
    if (fp) fp.destroy();
    fp = flatpickr("#Fechas", {
      mode,
      dateFormat: "d/m/Y",
      locale: flatpickr.l10ns.es,
      allowInput: true,
      conjunction: ", "
    });
  };

  const mostrarMensaje = (msg, tipo = "success") => {
    const respuesta = $("#respuesta");
    respuesta.textContent = msg;
    respuesta.className = tipo;
  };

  const toggleLoading = (loading = true) => {
    const btn = $("#btnEnviar");
    btn.disabled = loading;
    btn.classList.toggle("loading", loading);
  };

  const validarNumeroEmpleado = async (numero) => {
    const info = $("#nombreEmpleado");
    empleadoValido = false;

    try {
      const res = await fetch(VALIDACION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroEmpleado: numero })
      });

      if (res.ok) {
        const datos = await res.json();
        if (datos.nombre) {
          info.textContent = `👤 ${datos.nombre}`;
          info.className = "info-box";
          empleadoValido = true;
        } else {
          info.textContent = "❌ Número no encontrado.";
          info.className = "error";
        }
      } else {
        info.textContent = "⚠️ Error al validar el número.";
        info.className = "error";
      }
    } catch (err) {
      console.error(err);
      info.textContent = "⚠️ Error de conexión.";
      info.className = "error";
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    configurarFlatpickr("multiple");

    $("#modoMultiple").addEventListener("change", () => configurarFlatpickr("multiple"));
    $("#modoRango").addEventListener("change", () => configurarFlatpickr("range"));

    const inputNumero = $("#NumeroJDE");
    const inputEmail = $("#Email");

    inputNumero.addEventListener("blur", () => {
      const numero = inputNumero.value.trim();
      if (/^\d{6}$/.test(numero)) {
        validarNumeroEmpleado(numero);
      } else {
        $("#nombreEmpleado").textContent = "";
        empleadoValido = false;
      }
    });

    $("#formFiestas").addEventListener("submit", async (e) => {
      e.preventDefault();

      const numeroEmpleado = inputNumero.value.trim();
      const fechas = $("#Fechas").value.trim();
      const correo = inputEmail.value.trim();

      if (!/^\d{6}$/.test(numeroEmpleado)) {
        inputNumero.setCustomValidity("Formato inválido");
        inputNumero.reportValidity();
        return;
      } else {
        inputNumero.setCustomValidity("");
      }

      if (!empleadoValido) {
        mostrarMensaje("❌ Número de empleado no válido.", "error");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        inputEmail.setCustomValidity("Formato de correo inválido");
        inputEmail.reportValidity();
        return;
      } else {
        inputEmail.setCustomValidity("");
      }

      if (!fechas) {
        mostrarMensaje("❌ Debes seleccionar una o más fechas.", "error");
        return;
      }

      $("#FechasSolicitadas").value = fechas;

      const body = {
        empleado: numeroEmpleado,
        email: correo,
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

        if (res.status === 200 || res.status === 202) {
          mostrarMensaje("✅ Solicitud enviada correctamente.");
          e.target.reset();
          fp.clear();
          $("#nombreEmpleado").textContent = "";
          empleadoValido = false;
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

