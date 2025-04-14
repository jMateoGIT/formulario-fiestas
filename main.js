
flatpickr("#Fechas", {
  mode: "multiple",
  dateFormat: "d/m/Y",
  locale: flatpickr.l10ns.es,
  conjunction: ", ",
  allowInput: true
});

const form = document.getElementById("formFiestas");

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const respuesta = document.getElementById("respuesta");
  respuesta.textContent = "";
  respuesta.className = "";

  const fechas = document.getElementById("Fechas").value.trim();

  if (!fechas) {
    respuesta.textContent = "❌ Debes seleccionar al menos una fecha.";
    respuesta.className = "error";
    return;
  }

  document.getElementById("FechasSolicitadas").value = fechas;

  const body = {
    Empleado: document.getElementById("NumeroJDE").value.trim(),
    Email: document.getElementById("Email").value.trim(),
    FechasSolicitadas: fechas,
    Comentario: document.getElementById("Comentario").value.trim()
  };

  try {
    const res = await fetch("https://prod-70.westus.logic.azure.com:443/workflows/2035cd8f81154fcc9743ba4b231a1a3f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Vm-UQaC9QxujqKMk7hAj3phQ_lAOF60hxczY9lzVpqE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      respuesta.textContent = "✅ Solicitud enviada correctamente.";
      respuesta.className = "success";
      form.reset();
      document.getElementById("nombreEmpleado").textContent = "";
    } else {
      respuesta.textContent = "❌ Error al enviar la solicitud.";
      respuesta.className = "error";
    }
  } catch (err) {
    console.error("Error de conexión:", err);
    respuesta.textContent = "⚠️ Error de conexión.";
    respuesta.className = "error";
  }
});
