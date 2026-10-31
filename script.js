const game=document.querySelector('#game'), status=document.querySelector('#statusText');
let screen='start', focus=0, actions=[], quizIndex=0, unlocked=7, mazePos=[1,1], mazeMap=[], mazeGoal=[13,13], flipped=[], pairs=0;
const questions=[
 ['¿Crees que eres importante para mí?',['Sí, soy importante para ti','No, no lo soy'],0,['✕ NO.','Claro que eres importante para mí. Muchísimo más de lo que crees. Incluso cuando estoy callada, sigues siendo alguien demasiado importante para mí.'],['✓ SÍ, ERES IMPORTANTE PARA MÍ','Y quiero que nunca tengas que dudarlo: me importas muchísimo.']],
 ['¿Crees que algún día podría cansarme de ti?',['Sí','No'],1,['✕ NO.','Qué manera tan horrible de subestimarte. Estoy aquí porque eres tú, incluso con tus días difíciles.'],['✓ CORRECTO','No quiero quererte solamente cuando todo está bien. También quiero estar cuando tengas días difíciles.']],
 ['Cuando estoy triste, ¿qué quiero realmente de ti?',['Que me dejes sola','Que intentes solucionar todo','Que te quedes conmigo','Que me digas que deje de estar triste'],2,['✕ Casi','A veces no necesito que soluciones nada. Solo necesito saber que estás ahí y que no te vas.'],['✓ EXACTAMENTE','A veces solo necesito saber que estás ahí. Que no te vas.']],
 ['¿Quién crees que piensa más en el otro?',['Tú','Yo','Los dos','Ninguno porque somos unos distraídos'],2,['✕ Qué humilde.','Quizá tengas un poquito de razón.'],['✓ RESPUESTA DIPLOMÁTICA','Te la voy a aceptar.']],
 ['¿Qué es algo que jamás quisiera perder?',['Mis cosas','Mi orgullo','Mi tiempo','Lo nuestro'],3,['✕ No exactamente','Pero si hay algo que quiero cuidar es esto que tenemos.'],['✓ EXACTAMENTE','Pueden cambiar muchas cosas, pero lo nuestro es algo que jamás quisiera perder.']],
 ['¿Crees que eres suficiente para mí?',['Sí','No'],0,['✓ ERES SUFICIENTE','No necesito una versión perfecta de ti. Te quiero a ti, con tus días buenos, malos y tus tonterías.'],['✓ GUARDA ESTA RESPUESTA','Nunca te pedí que fueras perfecto. Solo quería que fueras tú.']],
 ['Si pudieras darme algo ahora mismo, ¿qué me darías?',['Un regalo','Dinero','Un abrazo','Un beso','Todo lo anterior'],3,['♡','No importa qué elegiste, aunque si elegiste beso esa respuesta me gusta bastante. Yo elegiría un abrazo de esos que hacen que todo deje de importar.'],['♡','No importa qué elegiste, aunque si elegiste beso esa respuesta me gusta bastante. Yo elegiría un abrazo de esos que hacen que todo deje de importar.']],
 ['¿Me elegirías otra vez?',['Sí','No'],0,['…','Esa respuesta no existe. Inténtalo otra vez.'],['♡','Entonces yo también te elegiría otra vez. En otro momento, en otro lugar, volvería a encontrarte y a elegirte.']]
];
function buildChallengeMaze(){
  const size=15, grid=Array.from({length:size},()=>Array(size).fill('#'));
  let seed=20261031;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const start=[1,1], stack=[start], visited=new Set(['1,1']), directions=[[0,2],[2,0],[0,-2],[-2,0]];
  grid[1][1]='.';
  while(stack.length){
    const [row,col]=stack[stack.length-1];
    const next=directions.map(([dr,dc])=>[row+dr,col+dc,dr,dc]).filter(([nr,nc])=>nr>0&&nc>0&&nr<size-1&&nc<size-1&&!visited.has(`${nr},${nc}`));
    if(!next.length){stack.pop();continue}
    const [nr,nc,dr,dc]=next[Math.floor(random()*next.length)];
    grid[row+dr/2][col+dc/2]='.';
    grid[nr][nc]='.';
    visited.add(`${nr},${nc}`);
    stack.push([nr,nc]);
  }
  const queue=[[1,1,0]], seen=new Set(['1,1']);
  let farthest=[1,1], longest=0;
  while(queue.length){
    const [row,col,distance]=queue.shift();
    if(distance>longest){farthest=[row,col];longest=distance}
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{
      const nr=row+dr,nc=col+dc,key=`${nr},${nc}`;
      if(nr>=0&&nc>=0&&nr<size&&nc<size&&grid[nr][nc]==='.'&&!seen.has(key)){seen.add(key);queue.push([nr,nc,distance+1])}
    });
  }
  return {map:grid.map(row=>row.join('')),goal:farthest};
}
function set(html, next=[]){game.innerHTML=html;actions=next;focus=0;paintFocus();game.focus()}
function view(title,body,button,label='CONTINUAR'){set(`<section class="view"><div class="pixel">♥ PERSONAL GAME CARTRIDGE ♥</div><h1>${title}</h1>${body}<button class="primary" data-go="${button}">${label}</button></section>`,[button])}
function start(){screen='start';view('♡ PARA MI PERSONA FAVORITA ♡',`<p>Hice algo para ti.</p><p>No es una prueba... aunque probablemente vas a querer hacer trampa.</p><p>Son unas pequeñas preguntas, juegos y algunas cosas que quería decirte.</p><p><b>¿Listo para comenzar?</b></p>`,'intro','COMENZAR ♡')}
function intro(){view('ANTES DE EMPEZAR...',`<p>Quiero que sepas algo.</p><p>No importa cuántas preguntas respondas bien o mal. Esto no se trata realmente de ganar.</p><p>Solo quería hacerte algo que fuera nuestro, algo que te recuerde lo mucho que significas para mí.</p><p><b>Y sí... voy a juzgar algunas de tus respuestas.</b></p>`,'hub','ACEPTO EL RIESGO')}
function hub(){screen='hub';const levels=[['💭','¿CUÁNTO ME CONOCES?','quiz'],['🧩','ENCUÉNTRAME','maze'],['🧠','NO OLVIDES','memory'],['🔎','ENCUENTRA EL CORAZÓN','find'],['🎯','ELIGE UNA','choose'],['🔐','CÓDIGO SECRETO','code'],['💌','NIVEL FINAL','final']];const buttons=levels.map((x,i)=>`<button class="level ${i<unlocked?'unlocked':''}" data-go="${i<unlocked?x[2]:''}" ${i>=unlocked?'disabled':''}>${x[0]} ${x[1]}<small>${i<unlocked?'▶ JUGAR':'🔒 BLOQUEADO'}</small></button>`).join('');set(`<section class="view"><div class="pixel">MAPA DE NIVELES</div><h2>ELIGE TU AVENTURA</h2><div class="map">${buttons}</div><p>Usa ▲ ▼ para seleccionar y A para aceptar.</p></section>`,levels.slice(0,unlocked).map(x=>x[2]))}
function quiz(){screen='quiz';quizIndex=0;question()}
function question(){let q=questions[quizIndex];let c=q[1].map((v,i)=>`<button class="choice" data-answer="${i}">${v}</button>`).join('');set(`<section class="view"><div class="pixel">NIVEL 1 · PREGUNTA ${quizIndex+1}/8</div><h2>${q[0]}</h2><div class="choices">${c}</div></section>`,q[1].map((_,i)=>'answer:'+i))}
function answer(n){let q=questions[quizIndex], good=n===q[2], msg=good?q[4]:q[3]; if(quizIndex===7&&!good){view(msg[0],`<p>${msg[1]}</p>`,'quiz','VOLVER A RESPONDER');return}view(msg[0],`<p>${msg[1]}</p>`,'nextQuestion',quizIndex===7?'COMPLETAR NIVEL':'CONTINUAR')}
function nextQuestion(){quizIndex++;if(quizIndex<questions.length)question();else{unlocked=Math.max(unlocked,2);view('NIVEL COMPLETADO ♡',`<p>Sobreviviste. Algunas respuestas fueron cuestionables... pero decidí perdonarte.</p><p>🔓 Nuevo nivel desbloqueado.</p>`,'hub','VOLVER AL MAPA')}}
function maze(){const challenge=buildChallengeMaze();screen='maze';mazeMap=challenge.map;mazePos=[1,1];mazeGoal=challenge.goal;drawMaze('Encuentra la ruta correcta: no todos los caminos llevan a mí ♡')}
function drawMaze(note){let grid='',size=mazeMap.length;for(let r=0;r<size;r++)for(let c=0;c<size;c++){let x=mazeMap[r][c]==='#'?'wall':'path';let icon=r===mazePos[0]&&c===mazePos[1]?'<span class="player" role="img" aria-label="Inicio"></span>':r===mazeGoal[0]&&c===mazeGoal[1]?'<svg class="goal" viewBox="0 0 32 29" role="img" aria-label="Objetivo"><path d="M16 27.2 3.2 15.2C-2 9.9 1.1 1 8.4 1c3.2 0 5.9 1.8 7.6 4.3C17.7 2.8 20.4 1 23.6 1c7.3 0 10.4 8.9 5.2 14.2L16 27.2Z"/></svg>':'';grid+=`<div class="cell ${x}">${icon}</div>`}set(`<section class="view maze-view"><div class="pixel">NIVEL 2 · ENCUÉNTRAME</div><div class="maze-note">${note}</div><div class="maze maze-challenge" aria-label="Laberinto desafiante: lleva a tu personaje al corazón">${grid}</div><div class="maze-guide"><span class="start-key">INICIO</span><span class="goal-key">META</span></div><p>Usa la cruceta o las flechas.</p></section>`,[])}
function move(dr,dc){if(screen!=='maze')return;let [r,c]=[mazePos[0]+dr,mazePos[1]+dc],size=mazeMap.length;if(r<0||c<0||r>=size||c>=size||mazeMap[r][c]==='#')return;mazePos=[r,c];if(r===mazeGoal[0]&&c===mazeGoal[1]){unlocked=Math.max(unlocked,3);view('ME ENCONTRASTE. ♡',`<p>Sabía que lo harías. Aunque te hayas perdido unas cuantas veces, terminaste llegando hasta mí.</p><p><b>Siempre encontrar el camino de regreso.</b></p>`,'hub','CONTINUAR')}else drawMaze(['Vas bien...','Un poquito más.','No te rindas.','Estoy por aquí.','Te estás acercando.'][Math.floor(Math.random()*5)])}
function memory(){screen='memory';flipped=[];pairs=0;let icons=['♥','♥','★','★','☾','☾','✿','✿'];icons.sort(()=>Math.random()-.5);set(`<section class="view"><div class="pixel">NIVEL 3 · NO OLVIDES</div><h2>ENCUENTRA LAS PAREJAS</h2><div class="memory">${icons.map((x,i)=>`<button class="card" data-card="${i}" data-icon="${x}">?</button>`).join('')}</div><p id="memoryMsg">No hagas trampa. Te estoy vigilando.</p></section>`,icons.map((_,i)=>'card:'+i))}
function card(i){if(flipped.length===2)return;let el=document.querySelector(`[data-card="${i}"]`);if(el.classList.contains('open')||el.classList.contains('done'))return;el.classList.add('open');el.textContent=el.dataset.icon;flipped.push(el);if(flipped.length===2){if(flipped[0].dataset.icon===flipped[1].dataset.icon){flipped.forEach(x=>x.classList.add('done'));pairs++;flipped=[];document.querySelector('#memoryMsg').textContent=['Una menos. ♡','Bien hecho.','Vas bastante bien.'][Math.floor(Math.random()*3)];if(pairs===4)setTimeout(()=>{unlocked=Math.max(unlocked,4);view('LO LOGRASTE.',`<p>Encontraste todas las parejas. Y ahora que hablamos de parejas...</p><h2>LA NUESTRA. ♡</h2>`,'hub','SIGUIENTE')},500)}else setTimeout(()=>{flipped.forEach(x=>{x.classList.remove('open');x.textContent='?' });flipped=[]},650)}}
function find(){screen='find';let icons=['★','☾','✿','☁','✦','☀','◆','✦','☾','★','✿','☁','◆','★','☀','✦','✿','☾','★','◆','☁','✦','☀','✿'];let heart=Math.floor(Math.random()*icons.length);set(`<section class="view"><div class="pixel">NIVEL 4 · ENCUENTRA EL CORAZÓN</div><h2>¿DÓNDE ESTOY?</h2><p>Hay un corazón escondido entre todo esto. Encuéntralo.</p><div class="find-board">${icons.map((o,i)=>`<button class="thing" data-thing="${i===heart?'heart':'wrong'}" style="left:${4+(i*37)%90}%;top:${5+(i*53)%83}%;animation-delay:-${i/4}s">${i===heart?'♥':o}</button>`).join('')}</div><p id="findMsg">Hay 24 objetos. El corazón cambia de lugar cada partida.</p></section>`,icons.map((_,i)=>'thing:'+(i===heart?'heart':'wrong')))}
function thing(x){if(x==='heart'){unlocked=Math.max(unlocked,5);view('♥ AHÍ ESTABA.',`<p>Entre tantas cosas, terminaste encontrándome otra vez.</p><p>Quizá ya entendiste la idea de este juego.</p>`,'hub','CONTINUAR')}else document.querySelector('#findMsg').textContent=['✕ No soy yo. Sigue buscando.','✕ Casi. Pero todavía no.','✕ ¿En serio pensaste que era ese?'][Math.floor(Math.random()*3)]}
function choose(){screen='choose';let opts=['Ver una película abrazados','Salir todo el día','Hablar durante horas','No hacer absolutamente nada juntos'];set(`<section class="view"><div class="pixel">NIVEL 5 · ELIGE UNA</div><h2>¿QUÉ PREFERIRÍAS HACER CONMIGO?</h2><p>Ahora no hay respuestas correctas. Solo quiero saber qué elegirías tú.</p><div class="choices">${opts.map((x,i)=>`<button class="choice" data-choice="${i}">${x}</button>`).join('')}</div></section>`,opts.map((_,i)=>'choice:'+i))}
function choice(i){let msgs=['Buena elección. Probablemente terminaríamos hablando y nadie prestaría atención a la película.','Entonces prepárate: contigo un paseo cualquiera podría ser un recuerdo bonito.','Sabía que elegirías eso. Podríamos hablar durante horas.','Esta quizá sea mi favorita. Contigo hasta no hacer nada se siente suficiente.'];unlocked=Math.max(unlocked,6);view('♡ ME GUSTA TU RESPUESTA',`<p>${msgs[i]}</p><p>🔓 Código secreto desbloqueado.</p>`,'hub','CONTINUAR')}
function code(){screen='code';set(`<section class="view secret"><div class="pixel">╔═ CÓDIGO SECRETO ═╗</div><h2>UNA ÚLTIMA PRUEBA</h2><p>❤️ Tiene mucho significado para mí.<br>👀 Tiene que ver contigo.<br>🔤 Empieza con A.<br>💌 Es alguien que quiero muchísimo.</p><input id="password" placeholder="ESCRIBE LA CONTRASEÑA" maxlength="20"><button class="primary" data-go="checkCode">DESBLOQUEAR</button><p id="codeMsg"></p></section>`,['checkCode'])}
function checkCode(){if(document.querySelector('#password').value.trim().toUpperCase()==='ALFREDO'){unlocked=7;view('✓ CÓDIGO CORRECTO.',`<p>Sabía que llegarías. Aunque siendo sinceros, te dejé unas pistas bastante obvias.</p><p>🔓 NIVEL FINAL DESBLOQUEADO.</p>`,'hub','IR AL MAPA')}else document.querySelector('#codeMsg').textContent='✕ CÓDIGO INCORRECTO. Piénsalo un poquito más.'}
function final(){view('TODOS LOS NIVELES COMPLETADOS.',`<p>Preguntas. Laberintos. Memoria. Corazones. Código.</p><p>Pero hay algo que todavía no has desbloqueado.</p>`,'letter','DESBLOQUEAR')}
function letter(){set(`<section class="view letter"><div class="pixel">💌 UNA ÚLTIMA COSA PARA TI</div><h2>Amor,</h2><p>si llegaste hasta aquí, quiero decirte que estoy orgullosa de ti por terminar todo esto.

Quería hacerte algo diferente. Algo que pudieras recorrer poco a poco y que te hiciera sentir, aunque fuera un poquito, todo lo que significas para mí.

Me importas muchísimo. Más de lo que probablemente imaginas.

No quiero que sientas que tienes que ser perfecto conmigo. Quiero que puedas ser tú, incluso en tus días cansados, tristes o inseguros.

Nunca te pedí que fueras perfecto. Solo quería que fueras tú.

Gracias por existir, por llegar a mi vida y por dejarme quererte.

Te amo muchísimo, Alfredo. Y sí... me importas más de lo que crees.

Siempre. ♡</p><button class="primary" data-go="end">TERMINAR JUEGO ♡</button></section>`,['end'])}
function end(){view('FIN ♡',`<h2>PUNTUACIÓN FINAL<br>100 / 100</h2><p>“Oficialmente eres la persona que más quiero molestar por el resto de mi vida.”</p><p><b>Este juego termina aquí. Lo nuestro continúa.</b></p>`,'start','JUGAR OTRA VEZ')}
const routes={start,intro,hub,quiz,maze,memory,find,choose,code,final,letter,end,nextQuestion,checkCode};
function activate(item){if(!item)return;let [type,val]=item.split(':');if(type==='answer')answer(+val);else if(type==='card')card(+val);else if(type==='thing')thing(val);else if(type==='choice')choice(+val);else if(routes[item])routes[item]()}
function paintFocus(){document.querySelectorAll('[data-go],[data-answer],[data-card],[data-thing],[data-choice]').forEach(x=>x.classList.remove('selected'));let target=[...document.querySelectorAll('[data-go],[data-answer],[data-card],[data-thing],[data-choice]')][focus];target?.classList.add('selected')}
game.addEventListener('click',e=>{let el=e.target.closest('[data-go],[data-answer],[data-card],[data-thing],[data-choice]');if(el){let item=el.dataset.go??(el.dataset.answer!==undefined?'answer:'+el.dataset.answer:el.dataset.card!==undefined?'card:'+el.dataset.card:el.dataset.thing!==undefined?'thing:'+el.dataset.thing:'choice:'+el.dataset.choice);activate(item)}});
function control(a){if(screen==='maze'&&['up','down','left','right'].includes(a)){move(a==='up'?-1:a==='down'?1:0,a==='left'?-1:a==='right'?1:0);return}if(['up','down','left','right'].includes(a)){if(!actions.length)return;let delta=(a==='up'||a==='left')?-1:1;focus=(focus+delta+actions.length)%actions.length;paintFocus();return}if(a==='accept'){activate(actions[focus])}else if(a==='back')hub();else if(a==='home')start();else if(a==='pause')status.textContent=status.textContent==='PAUSA'?'LISTO':'PAUSA'}
document.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',()=>control(x.dataset.action)));
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase(), editing=['input','textarea'].includes(e.target.tagName.toLowerCase());if(editing){if(k==='enter'){e.preventDefault();control('accept')}return}if(['arrowup','w'].includes(k)){e.preventDefault();control('up')}if(['arrowdown','s'].includes(k)){e.preventDefault();control('down')}if(['arrowleft','a'].includes(k)){e.preventDefault();control('left')}if(['arrowright','d'].includes(k)){e.preventDefault();control('right')}if(['enter',' '].includes(k)){e.preventDefault();control('accept')}if(k==='escape')control('back')});
start();
