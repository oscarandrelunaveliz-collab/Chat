// Importar módulos de Firebase desde la web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, addDoc, query, orderBy, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// !!! REEMPLAZA ESTE BLOQUE CON TUS CREDENCIALES REALES DE FIREBASE !!!
const firebaseConfig = {
    apiKey: "AIzaSyDYSwltdNcLOl5qp-hAOIwjbidF_dbMT2k",
    authDomain: "whatsapp-clone-4c40c.firebaseapp.com",
    projectId: "whatsapp-clone-4c40c",
    storageBucket: "whatsapp-clone-4c40c.firebasestorage.app",
    messagingSenderId: "184448223126",
    appId: "1:184448223126:web:2c31ad74a48d4c6cb47fb7",
    measurementId: "G-T2Q2Y1YBM1"
};

// Inicializar Firebase y la Base de Datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales de la app
let currentUser = "";
let activeChatPartner = "";
let unsubscribeMessages = null;
let pickerContainer = null;
let stickerGrid = null;

const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '😎', '👍', '❤️'];
const stickers = [
    'https://openmoji.org/data/color/svg/1F436.svg',
    'https://openmoji.org/data/color/svg/1F431.svg',
    'https://openmoji.org/data/color/svg/1F996.svg',
    'https://openmoji.org/data/color/svg/1F427.svg'
];

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const myUserDisplay = document.getElementById('myUserDisplay');
const addContactBtn = document.getElementById('addContactBtn');
const chatsList = document.getElementById('chatsList');
const activeChatName = document.getElementById('activeChatName');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');
const stickerLoader = document.getElementById('stickerLoader');

// 1. INICIAR SESIÓN LOCAL (CORREGIDO)
loginBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim().toLowerCase();
    if (!user) return alert("Ingresa un nombre válido");

    currentUser = user;
    myUserDisplay.textContent = currentUser.substring(0, 2).toUpperCase();
    
    // Guardar usuario en la base de datos para que otros puedan buscarlo
    await setDoc(doc(db, "users", currentUser), { name: currentUser });

    // Cambiar de pantalla (ERROR SOLUCIONADO AQUÍ)
    loginScreen.style.display = "none";
    appContainer.style.display = "flex";

    createPicker(); // Inicializar el panel de emojis y stickers
    listenToMyContacts(); // Escuchar si alguien nos agrega o tenemos chats
});

// 2. AGREGAR UN CONTACTO (Para buscar al otro dispositivo)
addContactBtn.addEventListener('click', async () => {
    const targetUser = prompt("¿A qué usuario quieres agregar? (Ej: celular o laptop)").trim().toLowerCase();
    if (!targetUser || targetUser === currentUser) return alert("Usuario no válido");

    // Guardar la relación en la base de datos
    await setDoc(doc(db, "users", currentUser, "contacts", targetUser), { name: targetUser });
    await setDoc(doc(db, "users", targetUser, "contacts", currentUser), { name: currentUser });
});

// 3. ESCUCHAR CONTACTOS EN TIEMPO REAL
function listenToMyContacts() {
    const q = collection(db, "users", currentUser, "contacts");
    onSnapshot(q, (snapshot) => {
        chatsList.innerHTML = "";
        if(snapshot.empty) {
            chatsList.innerHTML = `<p style="color:gray; text-align:center; padding:20px;">Haz clic en el '+' de arriba para agregar a tu otro dispositivo.</p>`;
        }
        snapshot.forEach((doc) => {
            const contactName = doc.data().name;
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            if(contactName === activeChatPartner) chatItem.classList.add('active');
            
            chatItem.innerHTML = `
                <div class="chat-item-avatar">${contactName.substring(0,2).toUpperCase()}</div>
                <div class="chat-item-info"><h4>${contactName}</h4></div>
            `;
            
            chatItem.addEventListener('click', () => selectChat(contactName));
            chatsList.appendChild(chatItem);
        });
    });
}

// 4. SELECCIONAR UN CHAT Y CARGAR SUS MENSAJES
function selectChat(partner) {
    activeChatPartner = partner;
    activeChatName.textContent = partner;
    messageForm.style.display = "flex";
    
    // Resaltar chat seleccionado
    document.querySelectorAll('.chat-item').forEach(item => {
        if(item.querySelector('h4').textContent === partner) item.classList.add('active');
        else item.classList.remove('active');
    });

    // Cancelar escucha del chat anterior si existía
    if (unsubscribeMessages) unsubscribeMessages();

    // ID único para la conversación de estos dos usuarios (ordenado alfabéticamente)
    const chatId = [currentUser, activeChatPartner].sort().join("_");

    // Escuchar mensajes nuevos en tiempo real
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            msgDiv.classList.add(data.sender === currentUser ? 'sent' : 'received');
            
            if(data.type === 'sticker') {
                msgDiv.classList.add('message-sticker');
                msgDiv.innerHTML = `<img src="${data.content}" class="sticker-chat-img"><span class="message-time">${data.time}</span>`;
            } else {
                msgDiv.innerHTML = `<p>${escapeHTML(data.content)}</p><span class="message-time">${data.time}</span>`;
            }
            messagesContainer.appendChild(msgDiv);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// 5. ENVIAR MENSAJES DE TEXTO
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !activeChatPartner) return;

    const chatId = [currentUser, activeChatPartner].sort().join("_");
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    messageInput.value = "";
    sendBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    
    await addDoc(collection(db, "chats", chatId, "messages"), {
        sender: currentUser,
        content: text,
        type: 'text',
        time: timeStr,
        timestamp: Date.now()
    });
});

// 6. ENVIAR STICKERS A LA BASE DE DATOS
async function sendSticker(stickerUrl) {
    if (!activeChatPartner) return;

    const chatId = [currentUser, activeChatPartner].sort().join("_");
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    if (pickerContainer) pickerContainer.style.display = 'none';

    await addDoc(collection(db, "chats", chatId, "messages"), {
        sender: currentUser,
        content: stickerUrl,
        type: 'sticker',
        time: timeStr,
        timestamp: Date.now()
    });
}

// LÓGICA DEL PANEL FLOTANTE (EMOJIS / STICKERS)
function createPicker() {
    pickerContainer = document.createElement('div');
    pickerContainer.classList.add('picker-container');
    pickerContainer.style.display = 'none';

    const tabsHeader = document.createElement('div');
    tabsHeader.classList.add('picker-tabs');
    tabsHeader.innerHTML = `
        <button class="tab-btn active" data-tab="emojis">😄 Emojis</button>
        <button class="tab-btn" data-tab="stickers">🖼️ Stickers</button>
    `;

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('picker-content');

    // Rejilla de Emojis
    const emojiGrid = document.createElement('div');
    emojiGrid.classList.add('grid-panel', 'active');
    emojiGrid.id = 'tab-emojis';
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.classList.add('picker-item');
        span.textContent = emoji;
        span.addEventListener('click', (e) => {
            e.preventDefault();
            insertEmoji(emoji);
        });
        emojiGrid.appendChild(span);
    });

    // Rejilla de Stickers
    stickerGrid = document.createElement('div');
    stickerGrid.classList.add('grid-panel');
    stickerGrid.id = 'tab-stickers';
    
    stickers.forEach(url => appendStickerToGrid(url));
    createAddStickerButton();

    contentContainer.appendChild(emojiGrid);
    contentContainer.appendChild(stickerGrid);
    pickerContainer.appendChild(tabsHeader);
    pickerContainer.appendChild(contentContainer);
    document.querySelector('.chat-window').appendChild(pickerContainer);

    // Eventos para cambiar entre pestañas
    tabsHeader.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabsHeader.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            contentContainer.querySelectorAll('.grid-panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
}

function appendStickerToGrid(url) {
    const img = document.createElement('img');
    img.classList.add('picker-sticker-img');
    img.src = url;
    img.alt = 'Sticker';
    img.addEventListener('click', (e) => {
        e.preventDefault();
        sendSticker(url);
    });
    stickerGrid.appendChild(img);
}

function createAddStickerButton() {
    const addBtn = document.createElement('div');
    addBtn.classList.add('picker-sticker-add-btn');
    addBtn.id = 'addNewStickerBtn';
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    addBtn.addEventListener('click', () => stickerLoader.click());
    stickerGrid.appendChild(addBtn);
}

// Cargar imagen local como sticker personalizado
if (stickerLoader) {
    stickerLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const customStickerUrl = event.target.result;
            const addBtn = document.getElementById('addNewStickerBtn');
            if (addBtn) addBtn.remove();

            appendStickerToGrid(customStickerUrl);
            createAddStickerButton();
        };
        reader.readAsDataURL(file);
        stickerLoader.value = '';
    });
}

function insertEmoji(emoji) {
    const startPos = messageInput.selectionStart;
    const endPos = messageInput.selectionEnd;
    messageInput.value = messageInput.value.substring(0, startPos) + emoji + messageInput.value.substring(endPos);
    messageInput.focus();
    const newPos = startPos + emoji.length;
    messageInput.setSelectionRange(newPos, newPos);
}

// Mostrar / Ocultar panel flotante
if (emojiBtn) {
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!pickerContainer) return;
        const isHidden = pickerContainer.style.display === 'none';
        pickerContainer.style.display = isHidden ? 'flex' : 'none';
    });
}

document.addEventListener('click', (e) => {
    if (pickerContainer && !pickerContainer.contains(e.target) && e.target !== emojiBtn) {
        pickerContainer.style.display = 'none';
    }
});

// Cambiar icono de enviar dinámicamente
messageInput.addEventListener('input', () => {
    sendBtn.innerHTML = messageInput.value.trim() !== '' ? 
        '<i class="fa-solid fa-paper-plane"></i>' : '<i class="fa-solid fa-microphone"></i>';
});

function escapeHTML(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}