lucide.createIcons();

// Lista oficial según la imagen compartida
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
  "QUISPE PERALTA ALBERT LEONEL"
];

// Cargar registros desde localStorage
let kardexRecords = JSON.parse(localStorage.getItem('kardex_registros')) || [];

const studentsContainer = document.getElementById('students-container');
const studentSelect = document.getElementById('student-select');
const searchInput = document.getElementById('search-student');
const openModalBtn = document.getElementById('open-record-modal');
const closeModalBtn = document.getElementById('close-record-modal');
const modal = document.getElementById('record-modal');
const kardexForm = document.getElementById('kardex-form');

// Llenar selector del modal
function initStudentSelect() {
  studentSelect.innerHTML = '<option value="" disabled selected>Selecciona un estudiante...</option>';
  studentsList.forEach((student, index) => {
    const opt = document.createElement('option');
    opt.value = student;
    opt.textContent = `${index + 1}. ${student}`;
    studentSelect.appendChild(opt);
  });
}

// Control del modal
openModalBtn.addEventListener('click', () => modal.classList.remove('hidden', 'items-end'));
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

// Renderizar la lista del kárdex
function renderKardex(filter = '') {
  studentsContainer.innerHTML = '';

  const filteredStudents = studentsList.filter(s => s.toLowerCase().includes(filter.toLowerCase()));

  filteredStudents.forEach((student, index) => {
    const originalIndex = studentsList.indexOf(student) + 1;
    const studentRecords = kardexRecords.filter(r => r.student === student);

    const card = document.createElement('div');
    card.className = 'student-card p-4 space-y-3';

    let recordsHTML = '';
    if (studentRecords.length === 0) {
      recordsHTML = `<p class="text-[11px] text-emerald-400 font-medium flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Sin observaciones registradas</p>`;
    } else {
      recordsHTML = studentRecords.map(r => `
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${r.subject}</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">${r.type}</span>
            </div>
            ${r.detail ? `<p class="text-xs text-slate-300 font-medium">${r.detail}</p>` : ''}
            <span class="text-[9px] text-slate-500 block">${r.date}</span>
          </div>
          <button onclick="deleteRecord(${r.id})" class="text-slate-600 hover:text-rose-400 transition-all p-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `).join('');
    }

    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">${originalIndex}</span>
          <h4 class="text-xs font-bold text-white">${student}</h4>
        </div>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${studentRecords.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}">
          ${studentRecords.length} faltas
        </span>
      </div>
      <div class="space-y-2 pt-1">
        ${recordsHTML}
      </div>
    `;

    studentsContainer.appendChild(card);
  });

  lucide.createIcons();
}

// Guardar observación
kardexForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newRecord = {
    id: Date.now(),
    student: studentSelect.value,
    subject: document.getElementById('kardex-subject').value,
    type: document.getElementById('kardex-type').value,
    detail: document.getElementById('kardex-detail').value.trim(),
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  };

  kardexRecords.push(newRecord);
  localStorage.setItem('kardex_registros', JSON.stringify(kardexRecords));

  kardexForm.reset();
  modal.classList.add('hidden');
  renderKardex(searchInput.value);
});

// Eliminar observación
window.deleteRecord = function(id) {
  kardexRecords = kardexRecords.filter(r => r.id !== id);
  localStorage.setItem('kardex_registros', JSON.stringify(kardexRecords));
  renderKardex(searchInput.value);
};

// Buscador en vivo
searchInput.addEventListener('input', (e) => renderKardex(e.target.value));

// Inicialización
initStudentSelect();
renderKardex();