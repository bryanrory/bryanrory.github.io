'use strict';

/* ============================================================
   painel.js — Painel do Profissional EisenCare
   ============================================================ */

/* ── Configuração ── */
const HOUR_HEIGHT = 82;   // px por hora na grade
const START_HOUR  = 7;    // agenda começa às 07:00
const END_HOUR    = 20;   // agenda termina às 20:00
const STORAGE_KEY = 'eisencare_panel_v1';

/* ── Estado ── */
const STATE = {
  currentDate : new Date(),
  appointments: [],
  blocks      : [],
  selectedTime: null,   // horário clicado na grade
  focusedId   : null,   // id do agendamento em foco (edição/detalhe)
};

/* ============================================================
   Utils
   ============================================================ */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function dateKey(d) {
  // YYYY-MM-DD no fuso local
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function timeToPx(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

function durationToPx(minutes) {
  return (minutes / 60) * HOUR_HEIGHT;
}

function pxToTime(px) {
  // Arredonda para o intervalo de 30 min mais próximo
  const totalMin = Math.round((px / HOUR_HEIGHT) * 60 / 30) * 30 + START_HOUR * 60;
  const h = Math.min(Math.floor(totalMin / 60), END_HOUR - 1);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMin(timeStr, min) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mkEl(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

/* ============================================================
   Persistência (localStorage)
   ============================================================ */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      STATE.appointments = data.appointments || [];
      STATE.blocks       = data.blocks       || [];
    }
  } catch { /* ignora erros de parse */ }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    appointments: STATE.appointments,
    blocks      : STATE.blocks,
  }));
}

/* ── Dados de demonstração ── */
function initDemo() {
  if (localStorage.getItem(STORAGE_KEY)) return; // já inicializado

  const key = dateKey(new Date());

  STATE.appointments = [
    {
      id: genId(), date: key,
      startTime: '08:00', duration: 60,
      client: 'Marcos Pereira', phone: '(11) 94567-8901',
      service: 'Barba completa', value: '35,00',
      notes: '', isEncaixe: false, status: 'concluido',
    },
    {
      id: genId(), date: key,
      startTime: '09:30', duration: 60,
      client: 'Carlos Mendes', phone: '(11) 98765-4321',
      service: 'Corte + Barba', value: '70,00',
      notes: '', isEncaixe: false, status: 'confirmado',
    },
    {
      id: genId(), date: key,
      startTime: '11:00', duration: 45,
      client: 'Rafael Souza', phone: '(11) 91234-5678',
      service: 'Corte simples', value: '45,00',
      notes: 'Prefere tesoura', isEncaixe: true, status: 'pendente',
    },
    {
      id: genId(), date: key,
      startTime: '14:00', duration: 75,
      client: 'Lucas Oliveira', phone: '',
      service: 'Corte + Barba + Hidratação', value: '100,00',
      notes: '', isEncaixe: false, status: 'pendente',
    },
    {
      id: genId(), date: key,
      startTime: '15:30', duration: 60,
      client: 'Gabriel Santos', phone: '(11) 95678-1234',
      service: 'Corte masculino', value: '50,00',
      notes: '', isEncaixe: false, status: 'confirmado',
    },
  ];

  STATE.blocks = [
    {
      id: genId(), date: key,
      startTime: '12:00', endTime: '13:00',
      reason: 'Almoço',
    },
  ];

  save();
}

/* ============================================================
   Renderização
   ============================================================ */
function render() {
  document.getElementById('agenda-date-label').textContent = fmtDate(STATE.currentDate);
  renderAgenda();
}

function renderAgenda() {
  const key      = dateKey(STATE.currentDate);
  const totalPx  = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const now      = new Date();
  const isToday  = dateKey(now) === key;

  /* ── Coluna de horários ── */
  const timesEl = document.getElementById('agenda-times');
  timesEl.style.height = `${totalPx}px`;
  timesEl.innerHTML = '';

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const lbl = mkEl('div', 'time-label');
    lbl.style.top = `${(h - START_HOUR) * HOUR_HEIGHT}px`;
    lbl.textContent = `${String(h).padStart(2, '0')}:00`;
    timesEl.appendChild(lbl);
  }

  /* ── Coluna de eventos ── */
  const eventsEl = document.getElementById('agenda-events');
  eventsEl.style.height = `${totalPx}px`;
  eventsEl.innerHTML = '';

  // Linhas de hora e meia-hora
  for (let h = START_HOUR; h < END_HOUR; h++) {
    const top = (h - START_HOUR) * HOUR_HEIGHT;

    const line = mkEl('div', 'hour-line');
    line.style.top = `${top}px`;
    eventsEl.appendChild(line);

    const half = mkEl('div', 'half-line');
    half.style.top = `${top + HOUR_HEIGHT / 2}px`;
    eventsEl.appendChild(half);
  }

  // Última linha (fim da grade)
  const lastLine = mkEl('div', 'hour-line');
  lastLine.style.top = `${totalPx}px`;
  eventsEl.appendChild(lastLine);

  // Indicador de agora
  if (isToday) {
    const offset = (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
    if (offset >= 0 && offset <= totalPx) {
      const nowLine = mkEl('div', 'now-line');
      nowLine.style.top = `${offset}px`;
      eventsEl.appendChild(nowLine);
    }
  }

  // Área clicável (fundo)
  const clickArea = mkEl('div', 'agenda-click-area');
  clickArea.style.height = `${totalPx}px`;
  clickArea.addEventListener('click', (e) => {
    const rect = eventsEl.getBoundingClientRect();
    const y    = e.clientY - rect.top + eventsEl.scrollTop;
    const time = pxToTime(y);
    const h    = parseInt(time.split(':')[0]);
    if (h >= START_HOUR && h < END_HOUR) {
      openSlotOptions(time);
    }
  });
  eventsEl.appendChild(clickArea);

  /* ── Bloqueios ── */
  STATE.blocks
    .filter(b => b.date === key)
    .forEach(b => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      const dMin  = (eh * 60 + em) - (sh * 60 + sm);
      const top   = timeToPx(b.startTime);
      const height = Math.max(durationToPx(dMin), 28);

      const el = mkEl('div', 'agenda-block');
      el.style.top    = `${top}px`;
      el.style.height = `${height}px`;
      el.innerHTML = `
        <div class="block-label">🔒 Horário bloqueado</div>
        <div class="block-sub">${esc(b.startTime)} – ${esc(b.endTime)}${b.reason ? ' · ' + esc(b.reason) : ''}</div>
      `;
      eventsEl.appendChild(el);
    });

  /* ── Agendamentos ── */
  STATE.appointments
    .filter(a => a.date === key && a.status !== 'cancelado')
    .forEach(appt => {
      const top    = timeToPx(appt.startTime);
      const height = Math.max(durationToPx(appt.duration), 28);

      const el = mkEl('div', `agenda-card status-${appt.status}`);
      el.style.top    = `${top}px`;
      el.style.height = `${height}px`;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${appt.client} às ${appt.startTime}`);

      const showService = height > 46;
      el.innerHTML = `
        <div class="card-time">${esc(appt.startTime)} – ${esc(addMin(appt.startTime, appt.duration))}</div>
        <div class="card-client">${esc(appt.client)}${appt.isEncaixe ? ' ⚡' : ''}</div>
        ${showService ? `<div class="card-service">${esc(appt.service)}</div>` : ''}
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetalhes(appt.id);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetalhes(appt.id);
        }
      });

      eventsEl.appendChild(el);
    });

  /* ── Scroll para o horário atual ── */
  const wrapper = document.getElementById('agenda-wrapper');
  if (isToday) {
    const scrollTo = Math.max(0, (now.getHours() - START_HOUR - 1) * HOUR_HEIGHT);
    setTimeout(() => { wrapper.scrollTop = scrollTo; }, 50);
  } else {
    wrapper.scrollTop = 0;
  }
}

/* ============================================================
   Modal helpers
   ============================================================ */
function showModal(id) {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = id ? document.getElementById(id) : null;
  if (el) el.classList.remove('active');
  else document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}

/* ============================================================
   Abrir modais
   ============================================================ */
function openSlotOptions(time) {
  STATE.selectedTime = time;
  document.getElementById('slot-hint').textContent = `Horário selecionado: ${time}`;
  showModal('modal-slot-options');
}

function openNovoAgendamento(time) {
  document.getElementById('agenda-form-title').textContent = 'Novo agendamento';
  document.getElementById('f-id').value        = '';
  document.getElementById('f-horario').value   = time || '';
  document.getElementById('f-duracao').value   = '60';
  document.getElementById('f-cliente').value   = '';
  document.getElementById('f-telefone').value  = '';
  document.getElementById('f-servico').value   = '';
  document.getElementById('f-valor').value     = '';
  document.getElementById('f-encaixe').checked = false;
  document.getElementById('f-obs').value       = '';
  STATE.focusedId = null;
  showModal('modal-agendamento');
  setTimeout(() => document.getElementById('f-cliente').focus(), 120);
}

function openEditarAgendamento(id) {
  const appt = STATE.appointments.find(a => a.id === id);
  if (!appt) return;

  document.getElementById('agenda-form-title').textContent = 'Editar agendamento';
  document.getElementById('f-id').value        = appt.id;
  document.getElementById('f-horario').value   = appt.startTime;
  document.getElementById('f-duracao').value   = String(appt.duration);
  document.getElementById('f-cliente').value   = appt.client;
  document.getElementById('f-telefone').value  = appt.phone  || '';
  document.getElementById('f-servico').value   = appt.service;
  document.getElementById('f-valor').value     = appt.value  || '';
  document.getElementById('f-encaixe').checked = !!appt.isEncaixe;
  document.getElementById('f-obs').value       = appt.notes  || '';
  STATE.focusedId = id;

  closeModal('modal-detalhes');
  showModal('modal-agendamento');
  setTimeout(() => document.getElementById('f-cliente').focus(), 120);
}

function openDetalhes(id) {
  const appt = STATE.appointments.find(a => a.id === id);
  if (!appt) return;

  STATE.focusedId = id;

  const statusMap = {
    pendente  : { label: 'Pendente',   cls: 's-pendente'   },
    confirmado: { label: 'Confirmado', cls: 's-confirmado' },
    concluido : { label: 'Concluído',  cls: 's-concluido'  },
    cancelado : { label: 'Cancelado',  cls: 's-cancelado'  },
  };

  const rows = [
    { label: 'Status',  value: statusMap[appt.status]?.label ?? appt.status, cls: statusMap[appt.status]?.cls },
    { label: 'Horário', value: `${appt.startTime} – ${addMin(appt.startTime, appt.duration)}` },
    { label: 'Cliente', value: appt.client },
    { label: 'Telefone',value: appt.phone || '—' },
    { label: 'Serviço', value: appt.service },
    { label: 'Valor',   value: appt.value ? `R$ ${appt.value}` : '—' },
    ...(appt.notes ? [{ label: 'Observações', value: appt.notes }] : []),
  ];

  document.getElementById('detalhes-grid').innerHTML = rows.map(r => `
    <div class="detalhe-row">
      <span class="detalhe-label">${esc(r.label)}</span>
      <span class="detalhe-value${r.cls ? ' ' + r.cls : ''}">${esc(r.value)}</span>
    </div>
  `).join('');

  // Badge de encaixe
  document.getElementById('encaixe-badge').style.display = appt.isEncaixe ? '' : 'none';

  // Visibilidade dos botões de ação
  const notDone    = appt.status !== 'concluido' && appt.status !== 'cancelado';
  const isPendente = appt.status === 'pendente';
  const isCanceled = appt.status === 'cancelado';

  document.getElementById('btn-editar').style.display   = notDone   ? '' : 'none';
  document.getElementById('btn-concluir').style.display = notDone   ? '' : 'none';
  document.getElementById('btn-confirmar').style.display= isPendente ? '' : 'none';
  document.getElementById('btn-cancelar').style.display = !isCanceled ? '' : 'none';

  showModal('modal-detalhes');
}

function openBloqueio(time) {
  document.getElementById('b-inicio').value = time || '';
  document.getElementById('b-fim').value    = time ? addMin(time, 60) : '';
  document.getElementById('b-motivo').value = '';
  showModal('modal-bloqueio');
}

/* ============================================================
   Atualizar status
   ============================================================ */
function updateStatus(id, status) {
  const idx = STATE.appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    STATE.appointments[idx].status = status;
    save();
  }
}

/* ============================================================
   Bootstrap (DOMContentLoaded)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  load();
  initDemo();
  render();

  /* ── Navegação de datas ── */
  document.getElementById('btn-prev').addEventListener('click', () => {
    STATE.currentDate = new Date(STATE.currentDate);
    STATE.currentDate.setDate(STATE.currentDate.getDate() - 1);
    render();
  });

  document.getElementById('btn-hoje').addEventListener('click', () => {
    STATE.currentDate = new Date();
    render();
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    STATE.currentDate = new Date(STATE.currentDate);
    STATE.currentDate.setDate(STATE.currentDate.getDate() + 1);
    render();
  });

  /* ── Botão global + FAB ── */
  document.getElementById('btn-novo-global').addEventListener('click', () => openNovoAgendamento(''));
  document.getElementById('fab-novo').addEventListener('click', () => openNovoAgendamento(''));

  /* ── Modal: opções de slot ── */
  document.getElementById('btn-choice-agendar').addEventListener('click', () => {
    const t = STATE.selectedTime;
    closeModal('modal-slot-options');
    openNovoAgendamento(t);
  });

  document.getElementById('btn-choice-bloquear').addEventListener('click', () => {
    const t = STATE.selectedTime;
    closeModal('modal-slot-options');
    openBloqueio(t);
  });

  /* ── Form: agendamento ── */
  document.getElementById('form-agendamento').addEventListener('submit', (e) => {
    e.preventDefault();

    const startTime = document.getElementById('f-horario').value;
    const client    = document.getElementById('f-cliente').value.trim();
    const service   = document.getElementById('f-servico').value.trim();

    if (!startTime || !client || !service) {
      alert('Preencha os campos obrigatórios: Horário, Cliente e Serviço.');
      return;
    }

    const payload = {
      startTime,
      duration  : parseInt(document.getElementById('f-duracao').value, 10),
      client,
      phone     : document.getElementById('f-telefone').value.trim(),
      service,
      value     : document.getElementById('f-valor').value.trim(),
      isEncaixe : document.getElementById('f-encaixe').checked,
      notes     : document.getElementById('f-obs').value.trim(),
    };

    if (STATE.focusedId) {
      // Edição
      const idx = STATE.appointments.findIndex(a => a.id === STATE.focusedId);
      if (idx !== -1) {
        STATE.appointments[idx] = { ...STATE.appointments[idx], ...payload };
      }
    } else {
      // Novo
      STATE.appointments.push({
        id       : genId(),
        date     : dateKey(STATE.currentDate),
        status   : 'pendente',
        ...payload,
      });
    }

    save();
    closeModal('modal-agendamento');
    render();
  });

  /* ── Botões do modal de detalhes ── */
  document.getElementById('btn-editar').addEventListener('click', () => {
    openEditarAgendamento(STATE.focusedId);
  });

  document.getElementById('btn-concluir').addEventListener('click', () => {
    updateStatus(STATE.focusedId, 'concluido');
    closeModal('modal-detalhes');
    render();
  });

  document.getElementById('btn-confirmar').addEventListener('click', () => {
    updateStatus(STATE.focusedId, 'confirmado');
    closeModal('modal-detalhes');
    render();
  });

  document.getElementById('btn-cancelar').addEventListener('click', () => {
    if (!confirm('Confirma o cancelamento deste agendamento?')) return;
    updateStatus(STATE.focusedId, 'cancelado');
    closeModal('modal-detalhes');
    render();
  });

  /* ── Form: bloqueio ── */
  document.getElementById('form-bloqueio').addEventListener('submit', (e) => {
    e.preventDefault();

    const startTime = document.getElementById('b-inicio').value;
    const endTime   = document.getElementById('b-fim').value;

    if (!startTime || !endTime) return;
    if (endTime <= startTime) {
      alert('O horário final deve ser posterior ao horário inicial.');
      return;
    }

    STATE.blocks.push({
      id       : genId(),
      date     : dateKey(STATE.currentDate),
      startTime,
      endTime,
      reason   : document.getElementById('b-motivo').value.trim(),
    });

    save();
    closeModal('modal-bloqueio');
    render();
  });

  /* ── Fechar modais via data-close ── */
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  /* ── Fechar ao clicar no backdrop ── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  /* ── ESC para fechar modal ── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const active = document.querySelector('.modal-overlay.active');
      if (active) closeModal(active.id);
    }
  });

  /* ── Atualizar linha do "agora" a cada minuto ── */
  setInterval(() => {
    const nowLine = document.querySelector('.now-line');
    if (!nowLine) return;
    const now = new Date();
    if (dateKey(now) !== dateKey(STATE.currentDate)) return;
    const offset = (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
    nowLine.style.top = `${offset}px`;
  }, 60_000);
});
