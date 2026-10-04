lucide.createIcons();

// Cargar tareas sincronizadas desde localStorage
let tasks = JSON.parse(localStorage.getItem('curso_tareas')) || [];

let currentDate = new Date();
let selectedDateStr = new Date().toISOString().split('T')[0];

const monthYearLabel = document.getElementById('month-year-label');
const calendarGrid = document.getElementById('calendar-grid');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const dayTasksContainer = document.getElementById('day-tasks-container');
const selectedDateTitle = document.getElementById('selected-date-title');
const pendingCountBadge = document.getElementById('pending-count-badge');

// Navegación por meses
prevBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Renderizar Cuadrícula del Calendario
function renderCalendar() {
  calendarGrid.innerHTML = '';
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nombre del mes formateado en español
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  monthYearLabel.textContent = monthName;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Rellenar días en blanco del mes anterior
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'empty-cell';
    calendarGrid.appendChild(emptyCell);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Generar cada día del mes
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const fullDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    dayCell.className = 'day-cell';
    dayCell.textContent = day;

    if (fullDateStr === todayStr) dayCell.classList.add('today');
    if (fullDateStr === selectedDateStr) dayCell.classList.add('selected');

    // Verificar si el día tiene tareas pendientes o registradas
    const hasTasksOnDay = tasks.some(t => t.dueDate === fullDateStr);
    if (hasTasksOnDay) dayCell.classList.add('has-tasks');

    dayCell.addEventListener('click', () => {
      selectedDateStr = fullDateStr;
      document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
      dayCell.classList.add('selected');
      renderDayTasks(fullDateStr);
    });

    calendarGrid.appendChild(dayCell);
  }

  renderDayTasks(selectedDateStr);
}

// Renderizar tareas asociadas al día seleccionado
function renderDayTasks(dateStr) {
  dayTasksContainer.innerHTML = '';

  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(y, m - 1, d);
  const formattedTitle = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  
  selectedDateTitle.querySelector('span').textContent = `Entregas del ${formattedTitle}`;

  // Filtrar tareas que corresponden a esta fecha exacta
  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
  const pendingCount = dayTasks.filter(t => !t.completed).length;

  pendingCountBadge.textContent = `${pendingCount} pendientes`;

  if (dayTasks.length === 0) {
    dayTasksContainer.innerHTML = `
      <div class="text-center py-10 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800/50">
        <i data-lucide="check-circle" class="w-8 h-8 mx-auto text-slate-600"></i>
        <p class="text-xs text-slate-500">No hay tareas programadas para esta fecha.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  dayTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all ${
      task.completed ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-800'
    }`;

    const priorityColors = {
      alta: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      media: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      baja: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ${task.subject}
            </span>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${priorityColors[task.priority]}">
              ${task.priority.toUpperCase()}
            </span>
          </div>
          <p class="text-xs font-medium text-slate-200 ${task.completed ? 'line-through text-slate-500' : ''}">
            ${task.description}
          </p>
          <p class="text-[10px] text-slate-400">
            Aviso por: <strong class="text-slate-300">${task.author}</strong>
          </p>
        </div>
        <button onclick="toggleTaskStatus(${task.id})" class="p-2 rounded-xl ${
          task.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
        }">
          <i data-lucide="${task.completed ? 'check-check' : 'circle'}" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    dayTasksContainer.appendChild(card);
  });

  lucide.createIcons();
}

// Cambiar estado desde el calendario
window.toggleTaskStatus = function(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  localStorage.setItem('curso_tareas', JSON.stringify(tasks));
  renderCalendar();
};

// Carga Inicial
renderCalendar();