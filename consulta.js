document.getElementById("btnAcceder").addEventListener("click", async () => {
  const numero = document.getElementById("numEmpleado").value.trim();
  const clave = document.getElementById("claveAcceso").value.trim();
  const msg = document.getElementById("msgLogin");
  const resultadosBox = document.getElementById("resultadosBox");

  if (!/^\d{6}$/.test(numero)) {
    msg.textContent = "❌ Número inválido";
    return;
  }

  if (!clave) {
    msg.textContent = "❌ Debes introducir la clave";
    return;
  }

  msg.textContent = "🔐 Validando acceso...";

  try {
    // PRIMER FLUJO: Validar empleado
    const validacion = await fetch("https://prod-26.westus.logic.azure.com:443/workflows/ed2a2c35aabe4e49924cea99b944b27c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1Ug-PTmDMvZnr5JSdDUgHYwiUl_FLIYETu95kh8bfxs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroEmpleado: numero, clave })
    });

    if (!validacion.ok) {
      msg.textContent = "❌ Clave incorrecta o usuario no válido";
      return;
    }

    const resVal = await validacion.json();
    if (!resVal.valido) {
      msg.textContent = "❌ Usuario o clave incorrecta";
      return;
    }

    msg.textContent = "📄 Obteniendo solicitudes...";

    // SEGUNDO FLUJO: Obtener solicitudes
    const solicitudes = await fetch("https://prod-37.westus.logic.azure.com:443/workflows/229d484cf71c410d96dc286bd3fbdf07/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FmdFNSh43VrfyX2io4UqtDJmRZIaJVRiz9uEhfSpFUI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroEmpleado: numero })
    });

    if (!solicitudes.ok) {
      msg.textContent = "❌ Error al obtener las solicitudes";
      return;
    }

    const datos = await solicitudes.json();
    if (datos.length === 0) {
      msg.textContent = "⚠️ No hay solicitudes registradas.";
      return;
    }

    msg.textContent = "";
    document.getElementById("loginBox").style.display = "none";
    resultadosBox.style.display = "block";
    renderizarTabla(datos);
  } catch (err) {
    console.error(err);
    msg.textContent = "⚠️ Error de conexión";
  }
});

function renderizarTabla(solicitudes) {
  const contenedor = document.getElementById("tablaSolicitudes");
  contenedor.innerHTML = `
  <table class="tabla-solicitudes">
    <thead>
      <tr>
        <th>Fecha(s)</th>
        <th>Estado</th>
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
      <td>${sol.fechasSolicitadas}</td>
      <td><span class="${claseEstado}">${sol.estado}</span></td>
      <td>${sol.comentario || "-"}</td>
    </tr>
  `;
}).join("")}
    </tbody>
  </table>
  `;
}
