// main.js (revisado)
(() => {
  "use strict";

  /* Utilidad corta para seleccionar */
  const $ = (sel) => document.querySelector(sel);

  /* Ajusta a tu backend; no expongas la URL con clave en cliente */
  const ENDPOINT = "/api/solicitud";

  let fp;

  /* Lista de empleados */
const empleados = {"105451": "NICANOR VALVERDE MARTIN", "105524": "JOSE ANTONIO BUJALANCE CASTRO", "105662": "CARLOS MANUEL HERRERO GARCIA", "105484": "FRANCISCO JESUS HIJAZO LARROSA", "105784": "JOSE MANUEL REMUIÑAN ANTELO", "105560": "CARLOS ESPALLARGAS VALERO", "105557": "ALFONSO MIGUEL ESPES CEREZO", "105705": "VICTOR JAVIER BEAMONTE PEREZ", "105483": "FRANCISCO JAVIER SISAMON ZABAL", "105552": "ANGEL JAVIER GUTIERREZ MARIN", "105502": "JOSE MARIA JOSA MOR", "105461": "JUAN CARLOS FERNANDEZ GONZALEZ", "105553": "RAFAEL ROC RODA", "105554": "JOSE CARLOS RAMOS MARQUEZ", "105531": "JOSE FRANCISCO POLA FELIPE", "105520": "VICTOR MANUEL DURO GIL", "105523": "JOSE FERNANDO PEIRO MARTINEZ", "105493": "ANGEL ALCONCHEL JULIAN", "105521": "JOSE CARLOS MARTINEZ LANCIS", "105532": "PEDRO GONZALEZ AGREDA", "105522": "FRANCISCO JOSE MANSO CAZO", "105526": "JOSE PEDRO LOPEZ MIGUEL", "106018": "FRANCISCO JAVIER SANCHO LAHOZ", "105737": "JACK DOUGLAS MCCURLEY", "105555": "ESTEBAN ALVAREZ ZAMORA", "105525": "JUAN CARLOS GOMEZ LAHOZ", "105704": "ALFONSO BURRIEL CRESPO", "105486": "PEDRO BARRANCO ORCE", "105530": "JOSE ANTONIO FERRANDO SEVIL", "105559": "JUAN CARLOS SERRANO BINABURO", "105535": "RICARDO PELLEJERO MADURGA", "105485": "ROBERTO PARACUELLOS RAFALES", "105558": "CARLOS BENITEZ DAVILA", "106040": "JESUS ANGEL MATEO GALLEGO", "105529": "LUIS VICENTE AUSABERRI ARAIZ", "105707": "DAVID JESUS CATASUS MAINAR", "105537": "CARLOS JOSE CAÑADA RODRIGUEZ", "105533": "VICENTE BAUTISTA PUEYO", "105710": "ELKIN RAUL ALVAREZ GIRALDO", "105488": "LUIS ALBERTO DOMINGO MARTINEZ", "105702": "JOSE LUIS CUARTERO SANCHO", "105468": "JESUS LOBERA BEGUE", "105538": "ANGEL LOPEZ LUNA", "105551": "ANTONIO GONZALEZ LOZANO", "105487": "JOSE ANTONIO BRAVO VINUES", "105539": "JOSE ANTONIO FUERTES VILLANUEVA", "105703": "RAUL ALONSO ALCAÑIZ", "105663": "JOSE CRUZ FERNANDEZ", "105846": "MIGUEL ALLUE BERJAGA", "105851": "JOSE ANGEL AGUILERA MOLINA", "105747": "GABRIEL VISOIU RAZVAN", "106473": "JORGE NARRO JULVEZ", "106489": "DAVID RUIZ PERIBAÑEZ", "106493": "DANIEL GRACIA CHAVARRI", "106608": "JORGE PINA LUCEA", "106174": "ALEJANDRO MONGE ESPEJA", "106474": "ALEJANDRO MOYA CASTEL", "106479": "JORGE AGUADO BONILLA", "106609": "SERGIO MOLERO GARCIA", "106610": "JACINTO IZQUIERDO SOLER", "106611": "CARLOS CLAVERO CLAVERO", "106612": "CARLOS FERNANDEZ JIMENEZ", "106682": "SERGIO MARTINEZ LOSTALÉ", "106683": "FERNANDO MENÉNDEZ REINOSO", "106681": "JAVIER CISNEROS", "105527": "JESUS TOMAS URIBARRI CLAVERIA", "105536": "CARLOS LOPEZ LUNA", "105847": "ANGEL FECED BOLDOVA", "106475": "JESUS JOVEN MINGUILLON", "106476": "JUAN CARRASCO ANDRES", "106477": "DANIEL JUAN JOVEN", "106478": "ANDRES SARTO SUBIAS", "106480": "SERGIO CLEMENTE YUS", "106481": "JOSE ANTONIO LISO CRUZ", "106429": "JOSE ALEJANDRO BARBECHO MORA", "105528": "ANTONIO BORREGO TELLO", "105492": "FERNANDO ALVAREZ HERNANDEZ", "106606": "ENRIQUE LOPEZ CLAVERIA", "106665": "MARIUS ION DODU", "106684": "CYNTHIA LAFUENTE FERNANDEZ", "106685": "CARLOS MONTAÑA SAENZ"};


  /** Configura el date‑picker */
  const configurarFlatpickr = (mode = "multiple") => {
    if (fp) fp.destroy();
    fp = flatpickr("#Fechas", {
      mode,
      dateFormat: "Y-m-d", // ISO => mejor para backend
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

      if (empleados[num]) {
        divNombre.textContent = empleados[num];
        divNombre.style.color = "inherit";
      } else {
        divNombre.textContent = "❌ Número no reconocido";
        divNombre.style.color = "var(--color-accent)";
      }
    });

    /* Envío del formulario */
    $("#formFiestas").addEventListener("submit", async (e) => {
      e.preventDefault();

      const num = inputNumero.value.trim();
      const fechas = $("#Fechas").value.trim();

      // Validaciones HTML + JS para mostrar mensajes accesibles
      if (!/^\d{6}$/.test(num) || !empleados[num]) {
        inputNumero.setCustomValidity("Número no reconocido o formato inválido");
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

