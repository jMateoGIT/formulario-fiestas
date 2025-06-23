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

const validarEmpleadoConClave = async (numero, clave) => {
  const info = $("#nombreEmpleado");
  empleadoValido = false;

  if (!/^\d{6}$/.test(numero)) {
    info.textContent = "❌ Número inválido";
    info.className = "info-box";
    return;
  }

  if (!clave) {
    info.textContent = "❌ Debes introducir la clave";
    info.className = "info-box";
    return;
  }

  info.textContent = "🔐 Validando acceso...";
  info.className = "info-box";

  try {
    const res = await fetch("https://prod-26.westus.logic.azure.com:443/workflows/ed2a2c35aabe4e49924cea99b944b27c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1Ug-PTmDMvZnr5JSdDUgHYwiUl_FLIYETu95kh8bfxs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroEmpleado: numero, clave })
    });

    if (!res.ok) {
      info.textContent = "❌ Clave incorrecta o usuario no válido";
      return;
    }

    const datos = await res.json();
    if (datos.valido) {
      info.textContent = "✅ Acceso validado";
      info.className = "info-box";
      empleadoValido = true;
    } else {
      info.textContent = "❌ Usuario o clave incorrecta";
      info.className = "info-box";
    }
  } catch (err) {
    console.error(err);
    info.textContent = "⚠️ Error de conexión";
    info.className = "info-box";
  }
};


function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

  document.addEventListener("DOMContentLoaded", () => {
    configurarFlatpickr("multiple");

    $("#modoMultiple").addEventListener("change", () => configurarFlatpickr("multiple"));
    $("#modoRango").addEventListener("change", () => configurarFlatpickr("range"));

    const inputNumero = $("#NumeroJDE");
    const inputEmail = $("#Email");

inputNumero.addEventListener("blur", () => {
  const numero = inputNumero.value.trim();
  const clave = $("#claveAcceso").value.trim();
  validarEmpleadoConClave(numero, clave);
});

    $("#formFiestas").addEventListener("submit", async (e) => {
      e.preventDefault();

      const numeroEmpleado = inputNumero.value.trim();
      const fechas = $("#Fechas").value.trim();
      const correo = inputEmail.value.trim();
      const clave = $("#claveAcceso").value.trim();

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

      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
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

      if (!empleadoValido) {
  mostrarMensaje("❌ Número de empleado o clave no válidos.", "error");
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

