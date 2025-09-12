// Sample Monasteries
const monasteries = [
  {
    name: "Rumtek Monastery",
    image: "rumtek1.jpg",
    description: "Spiritual heart of Sikkim, known for Tibetan architecture."
  },
  {
    name: "Pemayangtse Monastery",
    image: "pemayangtse.jpg",
    description: "One of the oldest monasteries, near Pelling."
  },
  {
    name: "Phodong Monastery",
    image: "phodong.jpg",
    description: "This beautiful monastery is one of the six most important monasteries in Sikkim, known for its ancient murals and a vibrant annual festival."
  },
  {
    name: "Rinchenpong Monastery",
    image: "rinchenpong.jpg",
    description: "Known for its unique statue of the 'Ati Buddha' in the Yab-Yum position, this monastery is nestled in a tranquil setting offering peace and spectacular views."
  },
  {
    name: "Dubdi Monastery",
    image: "dubdi monastery.jpg",
    description: "Considered the oldest monastery in Sikkim, Dubdi means 'the retreat' and is a serene, historic site accessible via a scenic trek."
  },
  {
    name: "Enchy Monastery",
    image: "enchy monastery.jpg",
    description: "Perched on a ridge above Gangtok, this monastery offers stunning views and is home to a large collection of masks used in its annual ritual dances."
  },
  {
    name: "Lingdum Monastery (Ranka Monastery)",
    image: "Lingdum Monastery (Ranka Monastery).jpg",
    description: "A relatively new and visually stunning monastery, popular for its vibrant Tibetan architecture, beautiful surroundings, and calm atmosphere."
  }
];

// Guides Data
const guides = [
  {
    name: "Tashi Dorje",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: "4.8",
    skills: "English, History, Spirituality"
  },
  {
    name: "Lhamo Doma",
    image: "https://randomuser.me/api/portraits/women/45.jpg",
    rating: "4.9",
    skills: "Hindi, Culture, Trekking"
  },
  {
    name: "Karma Wangchuk",
    image: "https://randomuser.me/api/portraits/men/76.jpg",
    rating: "4.7",
    skills: "English, Buddhism, Local Cuisine"
  }
];

// Render Monastery Cards
function loadMonasteries() {
  const container = document.getElementById("monasteryCards");
  monasteries.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${m.image}" alt="${m.name}" />
      <h3>${m.name}</h3>
      <p>${m.description}</p>
      <button onclick="alert('More details about ${m.name} coming soon!')">Learn More</button>
    `;
    container.appendChild(card);
  });
}

// Render Guide Cards
function loadGuides() {
  const container = document.getElementById("guideCards");
  container.innerHTML = "";
  guides.forEach(g => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${g.image}" alt="${g.name}" />
      <h3>${g.name}</h3>
      <p>Rating: ⭐ ${g.rating}</p>
      <p>Skills: ${g.skills}</p>
      <button onclick="alert('Contacting ${g.name}...')">Contact</button>
    `;
    container.appendChild(card);
  });
}

// Guide Form Handler
document.getElementById("guideForm").addEventListener("submit", function(e) {
  e.preventDefault();
  loadGuides();
});

// Weather
function loadWeather() {
  const widget = document.getElementById("weatherWidget");
  widget.innerHTML = `
    <p>🌤️ Gangtok, Sikkim</p>
    <p>Temperature: 16°C</p>
    <p>Condition: Clear Skies</p>
  `;
}

// Modal Logic
const modal = document.getElementById("regModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");

openModalBtn.onclick = () => {
  modal.style.display = "flex";
};
closeModalBtn.onclick = () => {
  modal.style.display = "none";
};
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

// Sign In Form
document.getElementById("signinForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;

  modal.style.display = "none"; // close modal
  alert("Welcome, " + username + "! You are now signed in.");

  // Change navbar button
  document.querySelector(".signin-btn").textContent = "Hi, " + username;
});

// Init
window.onload = function() {
  loadMonasteries();
  loadWeather();
};

/* ==== Chat widget logic ==== */

/* ---------- CONFIG: set your server IP/PORT here ---------- */
/* Example: const AI_BACKEND = "http://192.168.1.50:8000/api/chat"; */
const AI_BACKEND = " http://0.0.0.0:8000/chat"; // <-- set "http://<IP>:<PORT>/api/chat" here (leave empty for demo fallback)

/* Elements */
const aiIcon = document.getElementById('aiChatbotIcon');
const aiModal = document.getElementById('aiChatModal');
const aiBody = document.getElementById('aiChatBody');
const aiInput = document.getElementById('aiInput');
const sendBtn = document.getElementById('sendBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const minimizeBtn = document.getElementById('minimizeBtn');

/* safe rendering */
function escapeHtml(str){ if(!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

function appendMessage(text, who='bot'){
  const el = document.createElement('div');
  el.className = 'message ' + (who === 'user' ? 'user' : 'bot');
  el.innerHTML = `<div>${escapeHtml(String(text)).replace(/\n/g,'<br>')}</div>`;
  aiBody.appendChild(el);
  aiBody.scrollTop = aiBody.scrollHeight;
}

let typingEl = null;
function showTyping(){ if(typingEl) return; typingEl = document.createElement('div'); typingEl.className='message bot'; typingEl.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`; aiBody.appendChild(typingEl); aiBody.scrollTop = aiBody.scrollHeight; }
function hideTyping(){ if(typingEl){ typingEl.remove(); typingEl = null; } }

/* open/close */
aiIcon.addEventListener('click', ()=>{ const isOpen = aiModal.style.display === 'flex'; if(isOpen){ aiModal.style.display='none'; aiModal.setAttribute('aria-hidden','true'); } else { aiModal.style.display='flex'; aiModal.setAttribute('aria-hidden','false'); aiInput.focus(); } });
closeChatBtn.addEventListener('click', ()=>{ aiModal.style.display='none'; aiModal.setAttribute('aria-hidden','true'); aiIcon.focus(); });
minimizeBtn.addEventListener('click', ()=>{ aiModal.style.display='none'; aiModal.setAttribute('aria-hidden','true'); });

/* send message */
async function sendMessage(){
  const text = aiInput.value.trim();
  if(!text) return;
  appendMessage(text, 'user');
  aiInput.value = '';
  showTyping();

  try{
    if(!AI_BACKEND){
      await new Promise(r=>setTimeout(r,600));
      hideTyping();
      appendMessage("(No backend configured) Demo reply: I received: " + text, 'bot');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 30000);

    const resp = await fetch(AI_BACKEND, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if(!resp.ok) throw new Error('Server returned ' + resp.status);
    const data = await resp.json();
    hideTyping();
    const reply = data.reply ?? data.message ?? JSON.stringify(data);
    appendMessage(reply, 'bot');
  }catch(err){
    hideTyping();
    console.error(err);
    appendMessage('Sorry, something went wrong. ' + (err.message || ''), 'bot');
  }
}

/* events */
sendBtn.addEventListener('click', sendMessage);
aiInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ if(aiModal.style.display === 'flex'){ aiModal.style.display='none'; aiModal.setAttribute('aria-hidden','true'); } } });

/* small welcome */
function addChatWelcome(){ appendMessage('Namaste! I am your AI travel assistant. Ask me about the monasteries, local tips, or weather.\\nExample: \"Tell me about Rumtek Monastery\"'); }
window.addEventListener('load', ()=>{ addChatWelcome(); });
