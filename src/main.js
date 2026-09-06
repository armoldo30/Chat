import './style.css';

const defaultState = {
  country: 'Germany',
  operation: 'Operation Barbarossa',
  objectives: [
    { id: 1, type: 'National focus', name: 'Secure the eastern border', due: '1939-09', done: true },
    { id: 2, type: 'Production', name: 'Stockpile infantry equipment', due: '1940-03', done: false },
    { id: 3, type: 'Diplomacy', name: 'Invite Romania to the faction', due: '1940-06', done: false },
    { id: 4, type: 'Military', name: 'Assign three army groups', due: '1941-04', done: false }
  ]
};

const state = JSON.parse(localStorage.getItem('hoi4-war-planner') || 'null') || defaultState;
const app = document.querySelector('#app');
const save = () => localStorage.setItem('hoi4-war-planner', JSON.stringify(state));

function render() {
  const complete = state.objectives.filter((objective) => objective.done).length;
  const progress = Math.round((complete / state.objectives.length) * 100);
  app.innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#overview"><b>W</b><span>War Planner<small>HEARTS OF IRON IV</small></span></a>
      <nav aria-label="Primary navigation">
        <a class="active" href="#overview">▣ <span>Dashboard</span></a>
        <a href="#objectives">⌁ <span>Battle plans</span><i>3</i></a>
        <a href="#production">▤ <span>Production</span></a>
        <a href="#research">◇ <span>Research</span></a>
        <a href="#intel">◉ <span>Intel</span></a>
      </nav>
      <section class="campaign"><p>CAMPAIGN</p><button id="country">⚑ <span>${state.country}<small>Ironman • 1939</small></span>⌄</button><button class="new" id="rename">＋ New battle plan</button></section>
    </aside>
    <section class="workspace" id="overview">
      <header><p>CAMPAIGN <span>/</span> <strong>OVERVIEW</strong></p><button class="profile" aria-label="Profile">L <span>Lucas Meyer</span></button></header>
      <div class="content">
        <section class="intro"><div><p class="eyebrow">SATURDAY, 1 SEPTEMBER 1939</p><h1>Good morning, Commander.</h1><p>The next 90 days will shape the eastern front.</p></div><button class="primary" id="add">＋ Add objective</button></section>
        <section class="stats" aria-label="Campaign statistics">
          <article><b>♙</b><div><strong>168</strong><small>Divisions in field</small></div><em>+12 this year</em></article>
          <article><b>▥</b><div><strong>194</strong><small>Military factories</small></div><em>+18 this year</em></article>
          <article><b>♟</b><div><strong>2.14M</strong><small>Available manpower</small></div><em class="loss">−0.3M this year</em></article>
        </section>
        <section class="cards">
          <article class="card operation"><p class="eyebrow">ACTIVE OPERATION</p><h2>${state.operation}</h2><p>Coordinate the eastern campaign, build reserves, and prepare the army for a decisive summer offensive.</p><div class="map"><span>BERLIN</span><span>WARSAW</span><span>MINSK</span><i></i><b>➜</b><b>➜</b><small>EASTERN FRONT</small></div><footer><span class="avatars">HM&nbsp; GG&nbsp; +4</span> 6 commanders assigned <button>Open operation →</button></footer></article>
          <article class="card readiness"><div><p class="eyebrow">CAMPAIGN READINESS</p><h2>${progress}% complete</h2></div><output style="--progress:${progress}%">${progress}%</output><progress max="100" value="${progress}">${progress}%</progress><p>${complete} of ${state.objectives.length} strategic objectives complete</p><button id="view">View all objectives</button></article>
        </section>
        <section class="list-heading" id="objectives"><div><p class="eyebrow">UP NEXT</p><h2>Strategic objectives</h2></div><button id="viewAll">View all →</button></section>
        <section class="objectives">${state.objectives.map((objective) => `<article class="objective ${objective.done ? 'done' : ''}"><button class="check" data-id="${objective.id}" aria-label="Toggle ${objective.name}">${objective.done ? '✓' : ''}</button><span class="tag ${objective.type.toLowerCase().replace(' ', '-')}">${objective.type}</span><strong>${objective.name}</strong><span>Due <b>${objective.due}</b></span></article>`).join('')}</section>
      </div>
    </section>
    <dialog id="dialog"><form method="dialog"><button class="close" value="cancel">×</button><p class="eyebrow">NEW OBJECTIVE</p><h2>Set a strategic objective</h2><label>Objective<input id="name" required placeholder="Establish air superiority" /></label><label>Category<select id="type"><option>Military</option><option>Production</option><option>National focus</option><option>Diplomacy</option></select></label><label>Target date<input id="due" type="month" value="1940-01" required /></label><button class="primary" id="save" value="default">Add objective</button></form></dialog>`;

  document.querySelectorAll('.check').forEach((button) => button.addEventListener('click', () => {
    const objective = state.objectives.find((item) => item.id === Number(button.dataset.id));
    objective.done = !objective.done;
    save(); render();
  }));
  document.querySelector('#add').onclick = () => document.querySelector('#dialog').showModal();
  document.querySelector('#view').onclick = document.querySelector('#viewAll').onclick = () => document.querySelector('.objectives').scrollIntoView({ behavior: 'smooth' });
  document.querySelector('#rename').onclick = () => { state.operation = prompt('Name your operation', state.operation) || state.operation; save(); render(); };
  document.querySelector('#country').onclick = () => { state.country = state.country === 'Germany' ? 'Soviet Union' : 'Germany'; save(); render(); };
  document.querySelector('#save').onclick = () => {
    const name = document.querySelector('#name').value.trim();
    if (!name) return;
    state.objectives.push({ id: Date.now(), name, type: document.querySelector('#type').value, due: document.querySelector('#due').value, done: false });
    save();
  };
}

render();
