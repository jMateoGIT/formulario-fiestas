(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const PETICION_ENDPOINT = "https://defaulte75a677e41004431b89ee574d8d990.10.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2035cd8f81154fcc9743ba4b231a1a3f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=hnisqrnQWFowIURJQ_tSUxRSrVDvWZbjqCF9jR9XHbA";
  const VALIDACION_ENDPOINT = "https://defaulte75a677e41004431b89ee574d8d990.10.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ed2a2c35aabe4e49924cea99b944b27c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mk7U39gRRcKGJ97_Y6yJPT-QDWaz4UIecrtF28U1pEI";

  const URL_CONSULTA = "consulta.html";

  let fp;

  const mostrarMensaje = (msg, tipo = "success") => {
    const respuesta = $("#respuesta");
    respuesta.textContent = msg;
    respuesta.className = tipo;
  };

  // Mensaje para cuando la solicitud se envió pero no sabemos si llegó a registrarse.
  const mostrarResultadoIncierto = (detalle) => {
    const respuesta = $("#respuesta");
    respuesta.className = "error";
    respuesta.textContent =
      `⚠️ ${detalle} Es posible que la solicitud SÍ se haya registrado. ` +
      "Antes de volver a enviarla, compruébalo en tu historial: ";
    const enlace = document.createElement("a");
    enlace.href = URL_CONSULTA;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = "Consultar estado de mi solicitud";
    respuesta.append(enlace, ".");
  };

  // ---------- Validación de empleado ----------
  // Una sola llamada a HTTP_ValidacionEmpleado por pareja número+clave: el blur de cada
  // campo y el envío comparten la misma promesa (en curso o ya resuelta). Solo se repite
  // si cambian los datos o si la anterior falló por red o por tiempo.
  let validacionActual = null; // { clave, promesa }
  const claveDe = (numero, clave) => `${numero}\u0000${clave}`;

  const validarEmpleadoConClave = (numero, clave) => {
    if (!/^\d{6}$/.test(numero)) return Promise.resolve({ valido: false, mensaje: "❌ Número inválido" });
    if (!clave) return Promise.resolve({ valido: false, mensaje: "❌ Debes introducir la clave" });

    const k = claveDe(numero, clave);
    if (validacionActual && validacionActual.clave === k) return validacionActual.promesa;

    const promesa = FPRed.postJson(VALIDACION_ENDPOINT, { numeroEmpleado: numero, clave })
      .then(({ ok, datos }) => {
        if (!ok) return { valido: false, mensaje: "❌ Clave incorrecta o usuario no válido" };
        if (datos && datos.valido) return { valido: true, mensaje: "✅ Acceso validado" };
        return { valido: false, mensaje: "❌ Usuario o clave incorrecta" };
      })
      .catch((err) => {
        console.error(err);
        return {
          valido: false,
          sinRespuesta: true,
          mensaje: err.tipo === "tiempo"
            ? "⚠️ La validación no ha respondido a tiempo"
            : "⚠️ Error de conexión"
        };
      });

    const entrada = { clave: k, promesa };
    validacionActual = entrada;
    promesa.then((r) => {
      if (r.sinRespuesta && validacionActual === entrada) validacionActual = null;
    });
    return promesa;
  };

  document.addEventListener("DOMContentLoaded", () => {
    fp = flatpickr("#fechas", {
      mode: "multiple",
      dateFormat: "Y-m-d",     // backend
      altInput: true,
      altFormat: "d/m/Y",      // visual
      locale: flatpickr.l10ns.es,
      allowInput: true,
      conjunction: ", ",
      minDate: new Date().fp_incr(7),
      maxDate: "2026-12-31",

      onReady: (sel, str, instance) => {
        // ✅ evitar autocomplete raro en el input visible
        if (instance.altInput) {
          instance.altInput.setAttribute("autocomplete", "off");
          instance.altInput.setAttribute("inputmode", "none");
          instance.altInput.setAttribute("name", "requested_dates_visible");
          instance.altInput.setAttribute("spellcheck", "false");
        }
      }
    });

    const form = $("#formFiestas");
    const inputNumero = $("#numeroJDE");
    const inputEmail = $("#email");
    const inputClave = $("#claveAcceso");
    const info = $("#nombreEmpleado");
    const conGuarda = FPRed.guarda($("#btnEnviar"), "Enviando…");

    // Valida y pinta el resultado en el recuadro, si los campos no han cambiado entretanto.
    const validarYMostrar = async (numero, clave) => {
      const promesa = validarEmpleadoConClave(numero, clave);
      info.textContent = "🔐 Validando acceso...";
      info.className = "info-box";
      const r = await promesa;
      if (claveDe(inputNumero.value.trim(), inputClave.value.trim()) === claveDe(numero, clave)) {
        info.textContent = r.mensaje;
      }
      return r;
    };

    const alSalirDeCampo = () => {
      validarYMostrar(inputNumero.value.trim(), inputClave.value.trim());
    };
    inputNumero.addEventListener("blur", alSalirDeCampo);
    inputClave.addEventListener("blur", alSalirDeCampo);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const numeroEmpleado = inputNumero.value.trim();
      const fechas = $("#fechas").value.trim();
      const correo = inputEmail.value.trim();
      const clave = inputClave.value.trim();

      // Comprobaciones locales primero: no gastan ninguna llamada.
      if (!/^\d{6}$/.test(numeroEmpleado)) {
        inputNumero.setCustomValidity("Formato inválido");
        inputNumero.reportValidity();
        return;
      }
      inputNumero.setCustomValidity("");

      if (!clave) {
        mostrarMensaje("❌ Debes introducir la clave.", "error");
        return;
      }

      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        inputEmail.setCustomValidity("Formato de correo inválido");
        inputEmail.reportValidity();
        return;
      }
      inputEmail.setCustomValidity("");

      if (!fechas) {
        mostrarMensaje("❌ Debes seleccionar una o más fechas.", "error");
        return;
      }

      const body = {
        empleado: numeroEmpleado,
        clave,
        email: correo,
        fechasSolicitadas: fechas,
        comentario: $("#comentario").value.trim()
      };

      // Desde aquí hasta la respuesta: botón desactivado y ningún otro envío posible.
      conGuarda(async () => {
        mostrarMensaje("⏳ Enviando…", "success");

        const acceso = await validarYMostrar(numeroEmpleado, clave);
        if (!acceso.valido) {
          mostrarMensaje(
            acceso.sinRespuesta
              ? "⚠️ No se ha podido comprobar el acceso. La solicitud NO se ha enviado; inténtalo de nuevo."
              : "❌ Número de empleado o clave no válidos.",
            "error"
          );
          return;
        }

        // HTTP_SolicitudFPs: un único POST, sin reintentos.
        let res;
        try {
          res = await FPRed.postJson(PETICION_ENDPOINT, body, {
            avisarAlSalir: true,
            alTardar: () => mostrarMensaje(
              "⏳ Enviando… El servicio está tardando más de lo habitual (puede llevar hasta un minuto). No cierres ni recargues la página.",
              "success"
            )
          });
        } catch (err) {
          console.error(err);
          mostrarResultadoIncierto(
            err.tipo === "tiempo"
              ? "El servicio no ha respondido a tiempo."
              : "Se ha perdido la conexión antes de recibir la respuesta."
          );
          return;
        }

        const motivo = res.datos && res.datos.motivo;
        if (res.status === 202 || res.status === 200) {
          mostrarMensaje("✅ Solicitud enviada correctamente.");
          form.reset();
          inputClave.value = "";
          fp.clear();
          info.textContent = "";
          validacionActual = null;
        } else if (res.status === 401) {
          validacionActual = null;
          mostrarMensaje("❌ La clave no es correcta para ese número de empleado.", "error");
        } else if (res.status === 400) {
          mostrarMensaje("❌ Revisa el número, las fechas y el correo.", "error");
        } else if (res.status === 503 && motivo === "servicio") {
          mostrarMensaje("⚠️ El servicio no está disponible en este momento y no ha podido registrar la solicitud. Inténtalo más tarde.", "error");
        } else {
          mostrarResultadoIncierto(`El servicio ha respondido con un error inesperado (${res.status}).`);
        }
      });
    });
  });
})();
