const API_URL = "http://localhost:3000";

// --- ESTADO GLOBAL ---
let usuariosLista = []; // Aquí guardaremos los usuarios para filtrar rápido
let usuarioLogueado = null; // Datos del admin actual

// --- ELEMENTOS DOM ---
const vistaLogin = document.getElementById("vistaLogin");
const vistaDashboard = document.getElementById("vistaDashboard");
const tablaUsuarios = document.getElementById("tablaUsuarios");
const inputBuscar = document.getElementById("inputBuscar");

// Instancias de Modales Bootstrap
const modalUsuarioBS = new bootstrap.Modal(document.getElementById('modalUsuario'));
const modalPerfilBS = new bootstrap.Modal(document.getElementById('modalPerfil'));

// --- INICIO Y LOGIN ---
document.addEventListener("DOMContentLoaded", () => {
  const guardado = localStorage.getItem("usuario");
  if (guardado) iniciarSesion(JSON.parse(guardado));
});

document.getElementById("formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cedula = document.getElementById("loginCedula").value;
  const clave = document.getElementById("loginClave").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula, clave })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      iniciarSesion(data.usuario);
    } else {
      document.getElementById("loginError").textContent = data.msg;
    }
  } catch (err) { alert("Error de conexión"); }
});

function iniciarSesion(usuario) {
  usuarioLogueado = usuario;
  document.getElementById("userNombreDisplay").textContent = usuario.nombre;
  vistaLogin.classList.add("d-none");
  vistaLogin.classList.remove("d-flex");
  vistaDashboard.classList.remove("d-none");
  cargarUsuarios(); // Cargar la tabla al entrar
}

document.getElementById("btnSalir").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

// --- CRUD DE USUARIOS ---

// 1. CARGAR (GET)
async function cargarUsuarios() {
  const res = await fetch(`${API_URL}/usuarios`);
  usuariosLista = await res.json();
  renderizarTabla(usuariosLista);
}

// 2. RENDERIZAR TABLA (Con filtro opcional)
function renderizarTabla(lista) {
  tablaUsuarios.innerHTML = "";
  lista.forEach(user => {
    tablaUsuarios.innerHTML += `
      <tr>
        <td>${user.id}</td>
        <td>${user.cedula}</td>
        <td>${user.nombre}</td>
        <td>
          <button class="btn btn-sm btn-warning text-white me-2" onclick="prepararEditar(${user.id})">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${user.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// Hacemos las funciones globales para que funcionen en el HTML (onclick)
window.prepararEditar = (id) => {
  const user = usuariosLista.find(u => u.id === id);
  document.getElementById("modalTitulo").textContent = "Editar Usuario";
  document.getElementById("userId").value = user.id;
  document.getElementById("userCedula").value = user.cedula;
  document.getElementById("userNombre").value = user.nombre;
  document.getElementById("userClave").value = user.clave;
  modalUsuarioBS.show();
};

window.prepararCrear = () => {
  document.getElementById("formUsuario").reset();
  document.getElementById("userId").value = "";
  document.getElementById("modalTitulo").textContent = "Nuevo Usuario";
};

window.eliminarUsuario = async (id) => {
  if(!confirm("¿Estás seguro de eliminar este usuario?")) return;
  await fetch(`${API_URL}/usuarios/${id}`, { method: "DELETE" });
  cargarUsuarios();
};

// 3. GUARDAR (CREAR O EDITAR)
document.getElementById("formUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = document.getElementById("userId").value;
  const datos = {
    cedula: document.getElementById("userCedula").value,
    nombre: document.getElementById("userNombre").value,
    clave: document.getElementById("userClave").value
  };

  if (id) {
    // EDITAR (PUT)
    await fetch(`${API_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
  } else {
    // CREAR (POST)
    await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
  }
  
  modalUsuarioBS.hide();
  cargarUsuarios();
});

// --- BUSCADOR ---
inputBuscar.addEventListener("input", (e) => {
  const termino = e.target.value.toLowerCase();
  const filtrados = usuariosLista.filter(u => 
    u.nombre.toLowerCase().includes(termino) || 
    u.cedula.includes(termino)
  );
  renderizarTabla(filtrados);
});

// --- PERFIL Y CONFIGURACIÓN ---

// Botón Perfil: Muestra modal con datos del logueado
document.getElementById("btnPerfil").addEventListener("click", () => {
  document.getElementById("perfilNombre").textContent = usuarioLogueado.nombre;
  document.getElementById("perfilCedula").textContent = "Cédula: " + usuarioLogueado.cedula;
  modalPerfilBS.show();
});

// Botón Configuración: Activa/Desactiva Modo Oscuro
document.getElementById("btnConfig").addEventListener("click", () => {
  document.body.classList.toggle("bg-dark");
  document.body.classList.toggle("text-white");
  
  // Ajuste visual simple para las tablas en modo oscuro
  const tablas = document.querySelectorAll("table");
  tablas.forEach(t => t.classList.toggle("table-dark"));
  
  alert("Configuración: Se ha cambiado el tema visual.");
});

// =====================
// busqueda de materia
const inputBuscarMateria = document.getElementById("inputBuscarMateria");
const btnBuscarMateria = document.getElementById("btnBuscarMateria");
const tablaMaterias = document.getElementById("tablaMaterias");

// Cargar todas las materias
async function cargarMaterias() {
  const res = await fetch("http://localhost:3000/materias");
  const data = await res.json();
  mostrarMaterias(data);
}

// Mostrar materias
function mostrarMaterias(materias) {
  tablaMaterias.innerHTML = "";

  if (materias.length === 0) {
    tablaMaterias.innerHTML = `
      <tr>
        <td colspan="2">No se encontraron materias</td>
      </tr>
    `;
    return;
  }

  materias.forEach(m => {
    tablaMaterias.innerHTML += `
      <tr>
        <td>${m.codigo}</td>
        <td>${m.nombre}</td>
      </tr>
    `;
  });
}

// Buscar con botón
btnBuscarMateria.addEventListener("click", async () => {
  const texto = inputBuscarMateria.value.trim();

  if (texto === "") {
    cargarMaterias();
    return;
  }

  const res = await fetch(`http://localhost:3000/materias/buscar/${texto}`);
  const data = await res.json();
  mostrarMaterias(data);
});

// Inicial
cargarMaterias();
