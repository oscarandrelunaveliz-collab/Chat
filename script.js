// Importar los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0nF1lLxsyK1V0LCRE_uuuZGGG7I7NjLA",
  authDomain: "agenda-6toa.firebaseapp.com",
  databaseURL: "https://agenda-6toa-default-rtdb.firebaseio.com",
  projectId: "agenda-6toa",
  storageBucket: "agenda-6toa.firebasestorage.app",
  messagingSenderId: "508072085664",
  appId: "1:508072085664:web:a36d82cc47ac5534d4a1c6"
};

// Inicializar la conexión con la base de datos
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
lucide.createIcons();

// Lista oficial del curso
const studentsList = [
  "ADUVIRI MAMANI CRISTHOFER",
  "ALARCON GAMBOA ANDY",
  "ARAGON HUARACHI NATALY SHAROM",
  "ARO RAMIREZ MADELENE CELESTE",
  "AYZA APAZA ROMINA CINDEL",
  "CALAMANI CALLISAYA MAYUMI DANIELA",
  "CALLE RODRIGUEZ GUADALUPE LUZ",
  "CALLISAYA QUICSO MILENA ANGELES",
  "CASTILLO CHURQUI ADRIAN",
  "CHAVEZ PAINE JACQUELINE LUISA",
  "CONDORI CAMEO JHERSON",
  "GUILLEN RAMOS FABIAN ANTONIO",
  "HUANCA APANQUI AMERICA AMELY",
  "LAURA HINOJOSA ADRIAN",
  "LIMA CHACALLUCA GAEL ALDO",
  "LOPEZ POMA NAOMI KAYLA",
  "LUNA VELIZ OSCAR ANDRE",
  "MAMANI CHOQUE MADELEIN ESTEFANI",
  "MAMANI QUISPE FERNANDO JOSUE",
  "MAMANI YUPANQUI SAYDE MIRIAM",
  "MONTES VILLEGAS MATEO FABIAN",
  "MONTIEL CALLE LUIS ALBERTO",
  "QUISPE MAMANI MAITE ANAHI",
  "QUISPE PERALTA ALBERT LEONEL",
];

// Estudiante actual activo en el dispositivo
let currentStudent = localStorage.getItem('current_student_user') || '';

// Cargar tareas guardadas
let tasks = JSON.parse(localStorage.getItem('curso_tareas')) || [];

// Elementos del DOM
const tasksContainer = document.getElementById('tasks-container');
const activeUserSelect = document.getElementById('active-user-select');
const searchInput = document.getElementById('search-input');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Inicializar el selector de estudiante activo
function initUserSelector() {
  if (!activeUserSelect) return;
  activeUserSelect.innerHTML = '<option value="" disabled selected>¿Quién eres? Selecciona tu nombre...</option>';
  
  studentsList.forEach(student => {
    const opt = document.createElement('option');
    opt.value = student;
    opt.textContent = student;
    if (student === currentStudent) opt.selected = true;
    activeUserSelect.appendChild(opt);
  });

  activeUserSelect.addEventListener('change', (e) => {
    currentStudent = e.target.value;
    localStorage.setItem('current_student_user', currentStudent);
    renderTasks();
  });
}

// Renderizar Tareas
function renderTasks(filter = 'todas', query = '') {
  tasksContainer.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    const completedByList = task.completedBy || [];
    const isDoneByMe = currentStudent ? completedByList.includes(currentStudent) : false;

    const matchesFilter = 
      filter === 'todas' ? true :
      filter === 'pendientes' ? !isDoneByMe :
      filter === 'listas' ? isDoneByMe : true;

    const matchesQuery = 
      task.subject.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase());

    return matchesFilter && matchesQuery;
  });

  // Calcular progreso general del alumno seleccionado
  if (currentStudent && tasks.length > 0) {
    const completedCount = tasks.filter(t => (t.completedBy || []).includes(currentStudent)).length;
    const percentage = Math.round((completedCount / tasks.length) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% completado (${completedCount}/${tasks.length})`;
  } else {
    progressBar.style.width = `0%`;
    progressText.textContent = `PROGRESO`;
  }

  if (filteredTasks.length === 0) {
    tasksContainer.innerHTML = `
      <div class="text-center py-10 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
        <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-slate-600"></i>
        <p class="text-xs text-slate-500">No hay tareas encontradas en esta sección.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filteredTasks.forEach(task => {
    const completedByList = task.completedBy || [];
    const isDoneByMe = currentStudent ? completedByList.includes(currentStudent) : false;
    const totalDone = completedByList.length;

    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all ${
      isDoneByMe ? 'bg-slate-900/50 border-emerald-900/40 opacity-85' : 'bg-slate-900 border-slate-800'
    }`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ${task.subject}
            </span>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-400">
              Entrega: ${task.dueDate}
            </span>
          </div>

          <p class="text-xs font-medium ${isDoneByMe ? 'line-through text-slate-400' : 'text-slate-100'}">
            ${task.description}
          </p>

          <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>Aviso de: <strong class="text-slate-300">${task.author}</strong></span>
            <span class="text-emerald-400 font-semibold">${totalDone}/${studentsList.length} compañeros la hicieron</span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <!-- Botón Marcar Tarea -->
          <button onclick="toggleTaskForStudent(${task.id})" class="p-2 rounded-xl transition-all ${
            isDoneByMe 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }" title="${isDoneByMe ? 'Marcar como pendiente' : 'Marcar como completada'}">
            <i data-lucide="${isDoneByMe ? 'check-square' : 'square'}" class="w-5 h-5"></i>
          </button>

          <!-- Botón Eliminar Tarea -->
          <button onclick="deleteTask(${task.id})" class="p-2 rounded-xl bg-slate-800/80 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all" title="Eliminar tarea">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    tasksContainer.appendChild(card);
  });

  lucide.createIcons();
  // Volver a renderizar los iconos de Lucide
if (window.lucide) {
  window.lucide.createIcons();
}
}

// Marcar/Desmarcar tarea para el estudiante actual
window.toggleTaskForStudent = function(taskId) {
  if (!currentStudent) {
    alert("Por favor selecciona primero tu nombre en el selector superior para registrar tu tarea.");
    return;
  }

  tasks = tasks.map(task => {
    if (task.id === taskId) {
      let completedBy = task.completedBy || [];
      if (completedBy.includes(currentStudent)) {
        completedBy = completedBy.filter(name => name !== currentStudent);
      } else {
        completedBy.push(currentStudent);
      }
      return { ...task, completedBy };
    }
    return task;
  });

  localStorage.setItem('curso_tareas', JSON.stringify(tasks));
  renderTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'todas', searchInput.value);
};

// Eliminar Tarea de la lista general
window.deleteTask = function(taskId) {
  if (confirm("¿Estás seguro de que deseas eliminar esta tarea del curso?")) {
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('curso_tareas', JSON.stringify(tasks));
    renderTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'todas', searchInput.value);
  }
};

// Filtros y Buscador
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active', 'bg-indigo-600', 'text-white');
      b.classList.add('text-slate-400');
    });
    btn.classList.add('active', 'bg-indigo-600', 'text-white');
    btn.classList.remove('text-slate-400');
    renderTasks(btn.dataset.filter, searchInput.value);
  });
});

searchInput?.addEventListener('input', (e) => {
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'todas';
  renderTasks(activeFilter, e.target.value);
});

// Modal para agregar tarea
const modal = document.getElementById('modal');
document.getElementById('open-modal')?.addEventListener('click', () => modal.classList.remove('hidden', 'items-end'));
document.getElementById('close-modal')?.addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('task-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTask = {
    id: Date.now(),
    subject: document.getElementById('subject').value || 'General',
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('due-date').value,
    author: document.getElementById('author').value,
    completedBy: []
  };

  // Guardar la nueva tarea en Firebase
const tareasRef = ref(db, 'tareas');
push(tareasRef, newTask)
  .then(() => {
    console.log("Tarea guardada exitosamente en Firebase");
  })
  .catch((error) => {
    console.error("Error al guardar en Firebase:", error);
  });
  localStorage.setItem('curso_tareas', JSON.stringify(tasks));

  e.target.reset();
  modal.classList.add('hidden');
  renderTasks();
});

// Inicialización
initUserSelector();
// Escuchar cambios de tareas en Firebase en tiempo real
const tareasRef = ref(db, 'tareas');
onValue(tareasRef, (snapshot) => {
  const data = snapshot.val();
  
  // Si existen tareas en la nube, las convertimos en arreglo; si no, queda vacío
  tasks = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
  
  // Detectar filtro activo
  const activeBtn = document.querySelector('.filter-btn.active');
  const currentFilter = activeBtn ? activeBtn.dataset.filter : 'todas';
  
  // Volver a dibujar la lista en pantalla
  renderTasks(currentFilter, searchInput ? searchInput.value : '');
  
  // Volver a renderizar los iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar la lista de estudiantes en el selector
  if (typeof initUserSelector === 'function') {
    initUserSelector();
  }
  
  // 2. Renderizar iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
// Exponer funciones al scope global para eventos HTML (onclick, onchange, etc.)
window.lucide = lucide;
window.initUserSelector = initUserSelector; // O la función que llena el selector de alumnos