// Guarda de "petición en curso": del primer clic a la respuesta, botón desactivado y
// cualquier otro clic ignorado (antes un doble clic lanzaba dos consultas a la vez).
const btnAcceder = document.getElementById("btnAcceder");
const conGuarda = FPRed.guarda(btnAcceder, "Enviando…");

btnAcceder.addEventListener("click", () => {
  const numero = document.getElementById("numEmpleado").value.trim();
  const clave = document.getElementById("claveAcceso").value.trim();
  const msg = document.getElementById("msgLogin");
  const resultadosBox = document.getElementById("resultadosBox");

  const SOLICITUD_ENDPOINT = "https://defaulte75a677e41004431b89ee574d8d990.10.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/229d484cf71c410d96dc286bd3fbdf07/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h95XkrdCRv0ZLBN4qm2leDEKQ8uOC8y6KEGOq_9RKT0";
  const VALIDACION_ENDPOINT = "https://defaulte75a677e41004431b89ee574d8d990.10.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ed2a2c35aabe4e49924cea99b944b27c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mk7U39gRRcKGJ97_Y6yJPT-QDWaz4UIecrtF28U1pEI";

  if (!/^\d{6}$/.test(numero)) {
    msg.textContent = "❌ Número inválido";
    return;
  }

  if (!clave) {
    msg.textContent = "❌ Debes introducir la clave";
    return;
  }

  const sinRespuesta = (err) => {
    console.error(err);
    msg.textContent = err.tipo === "tiempo"
      ? "⚠️ El servicio no ha respondido a tiempo. Inténtalo de nuevo en unos minutos."
      : "⚠️ Error de conexión";
  };
  const alTardar = () => {
    msg.textContent = "⏳ El servicio está tardando más de lo habitual (puede llevar hasta un minuto)…";
  };

  conGuarda(async () => {
    msg.textContent = "🔐 Validando acceso...";

    // PRIMER FLUJO: Validar empleado (una sola llamada, sin reintentos)
    let validacion;
    try {
      validacion = await FPRed.postJson(VALIDACION_ENDPOINT, { numeroEmpleado: numero, clave }, { alTardar });
    } catch (err) {
      sinRespuesta(err);
      return;
    }

    if (!validacion.ok) {
      msg.textContent = "❌ Clave incorrecta o usuario no válido";
      return;
    }

    if (!validacion.datos || !validacion.datos.valido) {
      msg.textContent = "❌ Usuario o clave incorrecta";
      return;
    }

    msg.textContent = "📄 Obteniendo solicitudes...";

    // SEGUNDO FLUJO: Obtener solicitudes (una sola llamada, sin reintentos)
    let solicitudes;
    try {
      solicitudes = await FPRed.postJson(SOLICITUD_ENDPOINT, { numeroEmpleado: numero, clave }, { alTardar });
    } catch (err) {
      sinRespuesta(err);
      return;
    }

    if (solicitudes.status === 401) {
      msg.textContent = "❌ Clave incorrecta o usuario no válido";
      return;
    }

    if (!solicitudes.ok || !Array.isArray(solicitudes.datos)) {
      msg.textContent = "❌ Error al obtener las solicitudes";
      return;
    }

    const datos = solicitudes.datos;
    if (datos.length === 0) {
      msg.textContent = "⚠️ No hay solicitudes registradas.";
      return;
    }

    msg.textContent = "";
    document.getElementById("loginBox").style.display = "none";
    resultadosBox.style.display = "block";
    renderizarTabla(datos);
  });
});

function renderizarTabla(solicitudes) {
  const contenedor = document.getElementById("tablaSolicitudes");
  contenedor.innerHTML = `
  <table class="tabla-solicitudes">
    <thead>
      <tr>
        <th style="text-align: center;">Fecha solicitud</th>
        <th style="text-align: center;">Fecha solicitada</th>
        <th style="text-align: center;">Estado</th>
        <th>Comentario</th>
      </tr>
    </thead>
    <tbody>
      ${solicitudes.map(sol => {
  const estado = sol.estado?.toLowerCase();
  let claseEstado = "";

  if (estado === "aprobada") claseEstado = "badge badge-aprobado";
  else if (estado === "rechazada") claseEstado = "badge badge-rechazado";
  else claseEstado = "badge badge-pendiente"; // por defecto: pendiente

  return `
    <tr>
      <td style="text-align: center;">${sol.fechaSolicitud}</td>
      <td style="text-align: center;">${sol.fechasSolicitadas}</td>
      <td style="text-align: center;"><span class="${claseEstado}">${sol.estado}</span></td>
      <td>${sol.comentario || ""}</td>
    </tr>
  `;
}).join("")}
    </tbody>
  </table>
  `;
}

