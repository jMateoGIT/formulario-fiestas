
let fp;
function configurarFlatpickr(mode = "multiple") {
  if (fp) fp.destroy();
  fp = flatpickr("#Fechas", {
    mode: mode,
    dateFormat: "d/m/Y",
    locale: flatpickr.l10ns.es,
    allowInput: true,
    conjunction: ", "
  });
}

document.addEventListener("DOMContentLoaded", function () {
  configurarFlatpickr("multiple");

  document.getElementById("modoMultiple").addEventListener("change", () => configurarFlatpickr("multiple"));
  document.getElementById("modoRango").addEventListener("change", () => configurarFlatpickr("range"));

  const inputNumero = document.getElementById("NumeroJDE");
  const divNombre = document.getElementById("nombreEmpleado");
  const form = document.getElementById("formFiestas");
  const respuesta = document.getElementById("respuesta");

  inputNumero.addEventListener("input", function () {
    const num = inputNumero.value.trim();

    if (num.length < 6) {
      divNombre.textContent = "";
      return;
    }

    if (!/^\d{6}$/.test(num)) {
      divNombre.textContent = "❌ Deben ser 6 dígitos numéricos";
      divNombre.style.color = "red";
      return;
    }

    if (empleados[num]) {
      divNombre.textContent = empleados[num];
      divNombre.style.color = "black";
    } else {
      divNombre.textContent = "❌ Número no reconocido";
      divNombre.style.color = "red";
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const num = inputNumero.value.trim();
    const fechas = document.getElementById("Fechas").value.trim();

    const captcha = grecaptcha.getResponse();
    if (!captcha) {
      respuesta.textContent = "⚠️ Por favor, verifica que no eres un robot.";
      respuesta.className = "error";
      return;
    }

    if (!/^\d{6}$/.test(num) || !empleados[num]) {
      respuesta.textContent = "❌ Número no reconocido o formato inválido";
      respuesta.className = "error";
      divNombre.textContent = "❌ Número no reconocido o formato inválido";
      divNombre.style.color = "red";
      return;
    }

    if (!fechas) {
      respuesta.textContent = "❌ Debes seleccionar una o más fechas.";
      respuesta.className = "error";
      return;
    }

    document.getElementById("FechasSolicitadas").value = fechas;

    const body = {
      Empleado: num,
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
        divNombre.textContent = "";
        grecaptcha.reset();
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
});
