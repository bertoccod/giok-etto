import { loadTextures } from './texture.js';
import { baseClass } from './base.js';
import { playerClass } from './player.js';
import { cuboClass } from './cubo.js';
import { puntaClass } from './punta.js';
import { stoneballClass } from './stoneball.js';
import { ffClass } from './fastF.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registrato:', reg))
      .catch(err => console.error('Errore Service Worker:', err));
  });
}


//FUNZIONE CHE GESTISCE IL RANDOM CON SEED
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}



//PRECARICAMENTO TEXTURE
const textureMap = loadTextures();

//VARIABILI GLOBALI DI SISTEMA
let rnd; //GESTISCE IL RANDOM
let ostacoli = []; //ARRAY CONTENENTE GLI OSTACOLI DEL LIVELLO
//let elapsedTime = 0; ELIMINABILE?
let lastTime = null; //TEMPO DELLO SCORSO GAMELOOP
let paused = false; //IL GIOCO E' IN PAUSA?
let gameRunning = false; //IL GIOCO E' IN FUNZIONE?
let gameOver=false; //SI E' VERIFICATO GAME OVER?
let level=1; //LIVELLO DI GIOCO
let maxSalto = 60; //ALTEZZA MASSIMA RAGGIUNGIBILE CON IL SALTO
let numeroOstacoliLivello; //NUMERO DI OSTACOLI NEL LIVELLO
let counterOstacoli=0; //CONTATORE DEGLI OSTACOLI
let firstObs=true; //DEVO SPAWNARE IL PRIMO OGGETTO?
let patternWidth=0; //LUNGHEZZA DEI PATTERN
let globalSpeed=200; //VELOCITA' DI GIOCO
let SuperSpeed=0; //FUNZIONE PER FASTFORWARD
let SuperTime=0; //TEMPO IN FASTFORWARD

//GESTIONE PUNTI
let punti=Number(localStorage.getItem("punti"));
//punti=12200;
//localStorage.setItem("punti",6200);
if (punti==null){punti=0;} //SE NON ESISTONO I PUNTI PARTI DA 0
let ptLabel = document.getElementById("punti"); //LABEL PER IL SEGNAPUNTI
ptLabel.textContent="PUNTI "+punti;

//GESTIONE SKIN
let skin = Number(localStorage.getItem("skin"));
if (skin==null){skin=0;}
enableSkin(punti);
let found = false;
for (let i = skin; i >= 0; i--) {
  const radio = document.getElementById(`skin${i}`);
  if (radio && !radio.disabled) {
    radio.checked = true;
    localStorage.setItem("skin", i);
    found = true;
    break;
  }
}

//let obsCounter=0;//DA ELIMINARE DOPO DEBUG

//PREPARO LE VARIABILI DEGLI OSTACOLI E INIZIALIZZO IL TEMPO DI SPAWN
let lastObj={tipo:0, y:0, width:50};
let nextObj={tipo:"",y:0, width:0, patternID:""};
let nextSpawnTime=0;

//CREAZIONE CANVAS
const canvas = document.getElementById("gameCanvas");
canvas.width = 800;
canvas.height = 400;

//CREAZIONE CONTEST
const ctx = canvas.getContext("2d");
const sfondo = new Image();
loadBGGame(skin);

//CREAZIONE BASE E ASSEGNAZIONE PLAYER NULL
let player = null;
let base = baseClass(0,canvas.height-60, 5000, 60,100,skin);


function loadBGGame(skin){
  let file="";
  switch (skin){
    case 0: file="bg/bg_etto";break;
    case 1: file="bg/bg_potter";break;
    case 2: file="bg/bg_albert";break;
    case 3: file="bg/bg_homer";break;
    case 4: file="bg/bg_mine";break;
  }
  
  sfondo.src = `assets/${file}.png`;
  sfondo.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sfondo, 0, 0, canvas.width, canvas.height);
  }
}

// INPUT LISTNER START!
document.getElementById("play").addEventListener("click", start);
export function start(){
  if (!gameRunning) { //SE IL GIOCO NON E' IN FUNZIONE
    gameRunning = true; //ORA LO DIVENTA IN FUNZIONE
    //elapsedTime =0; //IL TEMPO PARTE DA 0
    paused=false; //NON SIAMO IN PAUSA
    lastTime = null; //NON ESISTE UN TEMPO PRECEDENTE
    gameOver=false; //NON SIAMO IN GAMEOVER
    ostacoli = []; //PULIAMO GLI OSTACOLI
    SuperSpeed=0; //RESETTO FUNZIONE PER FASTFORWARD
    SuperTime=0; //RESETTO TEMPO IN FASTFORWARD
    player = playerClass(100,canvas.height-30-base.height,50,50,-650, 50,0,skin); //CREIAMO IL PLAYER
    base.draw(ctx); //DISEGNAMO LA BASE
    document.getElementById("message").style.visibility = "hidden"; //NASCONDIAMO IL MESSAGE SPAN
    //SCELTA DEL LIVELLO
    const levelbox = document.getElementById("levelNumber");
    level = parseInt(levelbox.value,10);
    if (isNaN(level) || level < 1){ levelbox.value = 1; level=1;}
    if (level > 100){ levelbox.value = 100; level=100;}
    console.log("LIVELLO ",level);
    numeroOstacoliLivello=20+level;
    //numeroOstacoliLivello=3;
    globalSpeed=200+Number(level)*5;
    console.log("Ostacoli: ",numeroOstacoliLivello," - Global Speed: ",globalSpeed);
    counterOstacoli=0;
    firstObs=true;
    patternWidth=0;
    //IMPOSTO PUNTI
    punti=Number(localStorage.getItem("punti"));
    ptLabel.textContent="PUNTI "+punti;
    //obsCounter=0;//DA ELIMINARE DOPO DEBUG
    // NUOVO CODICE AGGIUNTO QUI: Nascondi gli elementi della UI
    const puntilB = document.getElementById("punti");
    const levelInput = document.getElementById("levelNumber");
    const playButton = document.getElementById("play");
    const settingsIcon = document.getElementById("settingsIcon");

    if (isMobileLandscape()) {
        // Nascondi gli elementi di controllo in modalità landscape
        puntilB.style.display = 'none';
        levelInput.style.display = 'none';
        playButton.style.display = 'none';
        settingsIcon.style.display = 'none';
    }
    //GESTIONE SKIN
    loadBGGame(skin); 
    lastObj={tipo:0, y:0, width:50};
    nextObj={tipo:"",y:0, width:0};
    nextSpawnTime=0;
    rnd = mulberry32(1417+level);
    nextObj.tipo = chooseOstacolo();  
    console.log("Sono in start, ho scelto ostacolo n. ",nextObj.tipo);
    datiOstacolo(0);
    console.log("Sono in start, ho chiamato datiOstacolo");
    requestAnimationFrame(gameLoop); //START AL GAMELOOP!
  }
}

//INPUT LISTNER MOVIMENTI PLAYER
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    jump();
  }
});


canvas.addEventListener("touchstart", e => {
  if (gameRunning) {
    e.preventDefault();
    console.log("touch!");
    jump();
  }
}, { passive: false });

function jump() {
  if (!player || !gameRunning) {return;}

  if (player.grounded) {
    player.velocityY = player.jumpStrength;
    console.log("SALTO! VY:", player.velocityY, "Y:", player.y);
    player.doubleJump = 1;
  } else if (player.doubleJump === 1) {
    player.velocityY = player.jumpStrength;
    player.doubleJump = 2;
  }
}


const keys = {
    right: false,
    left: false
};
window.addEventListener("keydown", e => {
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "ArrowLeft") keys.left = true;
});

window.addEventListener("keyup", e => {
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "ArrowLeft") keys.left = false;
});

document.querySelectorAll('input[name="skin"]').forEach(radio => {
  radio.addEventListener('change', event => {
    const selectedId = event.target.id; // es: "skin3"
    skin = parseInt(selectedId.replace("skin", ""));
    localStorage.setItem("skin",skin);
    loadBGGame(skin);
    base = baseClass(0,canvas.height-60, 5000, 60,100,skin);
    console.log("Skin selezionata:", skin);
  });
});

//GAMELOOP
function gameLoop(currentTime) {
  let pauseMessage = document.getElementById("message");
  if (paused) {//SE SONO IN PAUSA
    pauseMessage.textContent = "GIOCO IN PAUSA";
    pauseMessage.style.visibility = "visible";
    lastTime = null; // 🔁 Reset del tempo per evitare salti
    requestAnimationFrame(gameLoop);
    return;
  }
  pauseMessage.style.visibility="hidden"; 
  //GESTIONE TEMPO
  if (!lastTime){
      lastTime = currentTime; //SE NON ESISTE UN TEMPO PASSATO IMPOSTALO CON QUESTO
  }
  //const deltaTime = currentTime - lastTime; //DALL'ULTIMO REFRESH è PASSATO CURRENT-PASSATO
  const rawDelta = currentTime - lastTime;
  const deltaTime = Math.min(Math.max(rawDelta, 16.67), 33.33); // tra 16.67 e 33.33 ms
  lastTime = currentTime;


  if (SuperTime>0){SuperTime-=deltaTime;console.log("Supertime vale: ",SuperTime)} else {SuperTime=0; SuperSpeed=0;}
  update(deltaTime, lastTime);
  draw(deltaTime);

  //CHECK COLLISION
  ostacoli.forEach(ostacolo=>{
    const type = checkCollision(player, ostacolo); //che collisione c'è stata, se c'è
    switch (type){
      case "landing":
        if (ostacolo.tipo!==0 && ostacolo.tipo!==2 && ostacolo.tipo!==7){gameOver=true;break}
      case "bounce":
        if (ostacolo.tipo==0 || ostacolo.tipo==2){
          player.y = ostacolo.getBounds().bottom;
          player.velocityY = 0;
          break
        }
        case "super":
          SuperTime=5000;
          SuperSpeed=100;
          ostacoli.forEach(ostacolo => {
            ostacolo.speed=globalSpeed+SuperSpeed;
          });
          break
      case "collision":
        gameOver=true; break

    }
  });
  //CHECK VITTORIA O GAME OVER
  if (!vittoria(player, ostacoli) && !gameOver){
    requestAnimationFrame(gameLoop)
  } else {
    if (gameOver){isGameOver()} else {isVittoria()}      
  }
}

function update(deltaTime, currentTime) {
  if (currentTime>=nextSpawnTime && counterOstacoli<=numeroOstacoliLivello)
  { //LASTOBJ DICE CHE E' ORA DI SPAWNARE
    console.log("Ostacolo ",counterOstacoli,"/",numeroOstacoliLivello);
    if (nextObj.tipo==5){ // SPAWNO PATTERN
      //const idPatt = Math.floor(rnd() * 5);
      //const gruppo = createPattern(idPatt, currentTime);
      const gruppo = createPattern(nextObj.patternID, currentTime);
      ostacoli.push(...gruppo);
      counterOstacoli++;
      //IMPOSTO L'ULTIMO OSTACOLO DEL GRUPPO COME ULTIMO SPAWNATO
      const ultimo = gruppo[gruppo.length - 1];
      lastObj.tipo = 5;
      lastObj.y = ultimo.y;
      lastObj.width = ultimo.width;
    } else { //SPAWNO OSTACOLO
      ostacoli.push(createOstacolo()); //SPAWNO NEXTOBJ
      counterOstacoli++;
      //IMPOSTO L'OSTACOLO APPENA SPAWNATO COME L'ULTIMO SPAWNATO
      lastObj.tipo=nextObj.tipo;
      lastObj.y = nextObj.y;
      lastObj.width = nextObj.width;
    }

    //PREPARO IL PROSSIMO OSTACOLO
    nextObj.tipo = chooseOstacolo();
    datiOstacolo(currentTime);
  }

  //UPDATE OSTACOLI
  ostacoli.forEach(ostacolo => {
      ostacolo.update(deltaTime)
  });
  const prima = ostacoli.length;
  //ELIMINO OSTACOLI FUORI DAL CANVAS
  ostacoli = ostacoli.filter(o =>
      o.x + o.width > 0 && o.y < canvas.height
  );
  //GESTIONE PUNTI
  const numero = prima-ostacoli.length;
  if (numero>0){
    if (SuperTime>0){punti+=numero*10;} else {punti+=numero*5;}
    ptLabel.textContent="PUNTI "+Number(punti);
  }
  //UPDATE BASE
  base.update(deltaTime)
  //UPDATE PLAYER
  player.grounded=false;
  const baseHeight = base.height;
  player.update(canvas, deltaTime, baseHeight, keys, ostacoli);    
}

function draw(deltaTime){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sfondo, 0, 0, canvas.width, canvas.height);
    base.draw(ctx);
    player.draw(ctx);
    ostacoli.forEach(ostacolo => {
        ostacolo.draw(ctx);
    });
}

//SCELTA OSTACOLO
function chooseOstacolo() {
  let nextObjType;
  //CONTROLLO PRECEDENTE PER VEDERE COSA POSSO SPAWNARE
  switch (lastObj.tipo){
    case 0: {nextObjType = Math.floor(rnd() * 8); break;} //PRECEDENTE E' CUBO, SPAWNO TUTTO
    case 1: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE PUNTA, TUTTO TRANNE DOPPIO CUBO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
            }
    case 2: {nextObjType = Math.floor(rnd() * 8); break;} //PRECEDENTE E' PIATTAFORMA, SPAWNO TUTTO
    case 3: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE DOPPIAPUNTA, TUTTO TRANNE DOPPIO CUBO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
            }
    case 4: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE DOPPIOCUBO, TUTTO TRANNE DOPPIO CUBO DI NUOVO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
            }
    case 5: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE PATTERN, TUTTO TRANNE DOPPIO CUBO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
            }
    case 6: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE STONEBALL, TUTTO TRANNE DOPPIO CUBO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
            }
    case 7: {
            const obsPoss=[0,1,2,3,5,6,7]; //PRECEDENTE FLASHFORWARD, TUTTO TRANNE DOPPIO CUBO
            const choose = Math.floor(rnd()* obsPoss.length);
            nextObjType = obsPoss[choose];
            break;
          }
  }
  if (firstObs){nextObjType=Math.floor(rnd() * 4); firstObs=false;}
  //const ObsMap=[0,5,0,0];
  //nextObjType=ObsMap[obsCounter];
  //obsCounter++;
  return nextObjType;
}

//IMPOSTO I DATI DELL'OSTACOLO
function datiOstacolo(currentTime){
  switch (nextObj.tipo){
    case 0:
      { //cubo
        nextObj.width=Math.floor(20+rnd()*(50-20+1));
        nextObj.y=0;
        let spazio=450;
        if (lastObj.tipo == 0 || lastObj.tipo==2)// LAST CUBO/PIATTAF SPAWN 10/450/750-1100
        {
          let choice = rnd();
          if (choice <0.3){spazio=10;}
          if (choice <0.6 && choice >0.3){spazio=450;}
          if (choice >0.6){spazio = Math.floor(750 + rnd() * (1100 - 750 + 1));} 
        }
        if (lastObj.tipo==1 || lastObj.tipo==3 || lastObj.tipo==4){spazio = Math.floor(650 + rnd() * (1050 - 650 + 1));} //LAST PUNTA/DPPUNTA/DOPPIOCUBO SPAWN TRA 650-1050
        if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+750; patternWidth=0;} //LAST PATTERN SPAWN WIDTHPATTERN+750
        if (lastObj.tipo==6){spazio = 200;} //LAST STONEBALL
        nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
        break;
      }
    case 1:
    case 3:
      { //punta e doppia punta
        nextObj.width=30;
        nextObj.y=0;
        let spazio=750;
        if (lastObj.tipo == 0 || lastObj.tipo==2 || lastObj.tipo==4) { //LAST CUBO/PIATT/DPCUBO/PATT SPAN 0/750-1100
          if (rnd() < 0.5) {spazio = 0;} else {spazio = Math.floor(750 + rnd() * (1000 - 750 + 1));console.log("1");}
        }
        if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+750; patternWidth=0;} //LAST PATTERN SPAWN WIDTHPATTERN+750
        if (lastObj.tipo==6){spazio = 200;}//LAST STONEBALL SPWAN 200
        nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
        break;
      }
    case 2:
      {//piattaforma
        nextObj.width = Math.floor(120 + rnd() * (220 - 120 + 1));  
        if (lastObj.tipo !== 2) {//OSTACOLO PRECEDENTE NON E' PIATTAFORMA, STO A STEP 1
          nextObj.y = maxSalto;
        } else if (lastObj.tipo==2 && lastObj.y==maxSalto){// LAST E' PIATTAFORMA A STEP 1
            nextObj.y = lastObj.y+maxSalto; //VADO A STEP 2
          } else { //LAST E' PIATTAFORMA MAGGIORE DI STEP 1
            const direzione = rnd() < 0.5 ? "su" : "giù";
            let nuovaY;
            if (direzione === "su") {
              nuovaY = lastObj.y + maxSalto;
              const canvasY = canvas.height - base.height - nuovaY - 20;
              if (canvasY<=maxSalto){ //TROPPO ALTO, SCENDIAMO DI DUE STEP
                nuovaY = lastObj.y - maxSalto*2;
              }
            } else {
              nuovaY = lastObj.y - maxSalto;
            }
            nextObj.y = nuovaY;
          }
        let spazio=600; //VALE SOLO SE LAST E' PIATTAFORMA
        if (lastObj.tipo == 0 || lastObj.tipo==1 || lastObj.tipo==3 || lastObj.tipo==4) { //LAST CUBO/PUNTA/DPPUNTA SPAWN 800/1000
          spazio = Math.floor(450 + rnd() * (750 - 450 + 1));
        }
        if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+550; patternWidth=0;}//LAST PATTERN SPAWN WIDTHPATTERN+750
        if (lastObj.tipo==6){spazio = 300;} //LAST STONEBALL SPAWN 3000*/
        nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
        break;
      }
    case 4:
      { //doppioCubo
        nextObj.width=50;
        nextObj.y=100;
        let spazio=450; //LAST TUTTI, POI SOVRASCRIVO
        if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+750; patternWidth=0;}//LAST PATTERN SPAWN WIDTHPATTERN+750
        if (lastObj.tipo==6){spazio = 400;} //LAST STONEBALL SPAWN 3000
        nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
        break;
      }
    case 5:
      {//PATTERN!
      const idPatt = Math.floor(rnd() * 7);
      //const idPatt=5;
      nextObj.patternID = idPatt;
      nextSpawnTime = currentTime + ((lastObj.width / globalSpeed) * 1000) + 850;
      break;
    }
    case 6:
      { //STONEBALL
        nextObj.width=30;
        nextObj.y=0;
        let spazio=1550; //LAST TUTTI, POI SOVRASCRIVO
        if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+1150; patternWidth=0;}//LAST PATTERN SPAWN WIDTHPATTERN+750
        if (lastObj.tipo==6){spazio = 550;} //LAST STONEBALL SPAWN 3000
        nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
        break;
      }  
    case 7: //FASTFORWARD
    {
      nextObj.width=50;
      nextObj.y=0;
      let spazio=450;
      if (lastObj.tipo==5){spazio=(patternWidth/globalSpeed)*1000+750; patternWidth=0;} //LAST PATTERN SPAWN WIDTHPATTERN+750
      if (lastObj.tipo==6){spazio = 200;}//LAST STONEBALL SPWAN 200
      nextSpawnTime=currentTime+((lastObj.width/globalSpeed)*1000)+spazio;
      break;
    }
    default:{
      nextObj.width=500;
      nextSpawnTime=currentTime+((nextObj.width/globalSpeed)*1000)+750;
      break;}
  }
}

//CREAZIONE OSTACOLO
function createOstacolo(){
    switch (nextObj.tipo) {
      case 0: {
        //let cubo = cuboClass(canvas.width + 20, canvas.height-base.height-50, 50,50, globalSpeed,0, `stone_${skin}`, textureMap);
        let cubo = cuboClass(canvas.width + 20, canvas.height-base.height-50, 50,50, globalSpeed+SuperSpeed,0, `stone_${skin}`, textureMap);
        return cubo;
      }
      case 1: {
        let punta = puntaClass(canvas.width + 20, canvas.height-base.height-30, 30,30, globalSpeed+SuperSpeed, 1,`punta_${skin}`, textureMap);
        return punta;
      }

      case 2: {
        let piattaforma;
        if (nextObj.y==maxSalto){
          if (nextObj.width>190){
            piattaforma = cuboClass(canvas.width + 20,canvas.height-base.height-nextObj.y-20, nextObj.width, 20, globalSpeed+SuperSpeed,2, `double_platform_${skin}`, textureMap, true);  
          } else {
            piattaforma = cuboClass(canvas.width + 20,canvas.height-base.height-nextObj.y-20, nextObj.width, 20, globalSpeed+SuperSpeed,2, `platform_${skin}`, textureMap, true);
          }
        } else {
          if (nextObj.width>190){
            piattaforma = cuboClass(canvas.width + 20,canvas.height-base.height-nextObj.y-20, nextObj.width, 20, globalSpeed+SuperSpeed,2, `double_platform_${skin}`, textureMap);  
          }else {
            piattaforma = cuboClass(canvas.width + 20,canvas.height-base.height-nextObj.y-20, nextObj.width, 20, globalSpeed+SuperSpeed,2, `platform_${skin}`, textureMap);
          }
        }
        return piattaforma;
      }
      case 3:{
        let doppiaPunta = puntaClass(canvas.width + 20, canvas.height-base.height-25, nextObj.width+20,25, globalSpeed+SuperSpeed, 3,`doppiaPunta_${skin}`, textureMap);
        return doppiaPunta;
      }
      case 4: {
        let doppioCubo = cuboClass(canvas.width + 20, canvas.height-base.height-nextObj.y, 50,100, globalSpeed+SuperSpeed,4, `double_stone_${skin}`, textureMap);
        return doppioCubo;
      }
      case 6: {
        let stoneBall = stoneballClass(canvas.width+20, canvas.height-base.height-30, 30,30, globalSpeed+SuperSpeed+50,6, "stoneball", textureMap);
        return stoneBall;
      }
      case 7: {
        let flash = ffClass(canvas.width+20, canvas.height-base.height-30, nextObj.width, 30, globalSpeed+SuperSpeed, 7, "fastForward", textureMap);
        return flash;
      }
      default: {console.log("SONO IN DEFAULT!");
        break;
      }
    }
}

function createPattern(id, currentTime){
  let gruppo = [];

  switch (id) {
    case 0: { 
      const baseY = canvas.height - base.height;
      const cubo = cuboClass(canvas.width + 20, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const doppioCubo = cuboClass(canvas.width + 160, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const ptf1 = cuboClass(canvas.width + 230, baseY - 50, 150, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf2 = cuboClass(canvas.width + 330, baseY - 160, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf3 = cuboClass(canvas.width + 400, baseY - 50, 200, 20, globalSpeed+SuperSpeed, 2, `platform_${skin}`, textureMap);
      const ptf4 = cuboClass(canvas.width + 450, baseY - 160, 150, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf4B = cuboClass(canvas.width + 610, baseY - 160, 300, 20, globalSpeed+SuperSpeed, 2, `platform_${skin}`, textureMap);
      const doppioCubo2 = cuboClass(canvas.width + 860, baseY - 260, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cubo2 = cuboClass(canvas.width + 860, baseY - 310, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const cubo3 = cuboClass(canvas.width + 860, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      gruppo.push(cubo, doppioCubo, ptf1, ptf2,ptf3,ptf4,ptf4B, doppioCubo2, cubo2, cubo3);
      break;
    }
    case 1: {
      const baseY = canvas.height - base.height;
      const ptf1 = cuboClass(canvas.width + 20, baseY - maxSalto, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const dpP = puntaClass(canvas.width + 120, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP2 = puntaClass(canvas.width + 160, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP3 = puntaClass(canvas.width + 200, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const cubo = cuboClass(canvas.width + 240, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpP4 = puntaClass(canvas.width + 290, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP5 = puntaClass(canvas.width + 330, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP6 = puntaClass(canvas.width + 370, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const ptf2 = cuboClass(canvas.width + 410, baseY - maxSalto, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const dpC = cuboClass(canvas.width + 620, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const ptf3 = cuboClass(canvas.width + 620, baseY - 100-20, 120, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const punta = puntaClass(canvas.width+710, baseY - 100-50,30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      gruppo.push(ptf1, dpP, dpP2, dpP3, cubo, dpP4, dpP5, dpP6, ptf2,dpC, ptf3, punta);
      break;
    }
    case 2: {
      const baseY = canvas.height - base.height;
      const ptf1 = cuboClass(canvas.width + 20, baseY - maxSalto, 120, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap,true);
      const ptf2 = cuboClass(canvas.width + 180, baseY - maxSalto*2-20, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf3 = cuboClass(canvas.width + 320, baseY - maxSalto*3-20, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf4 = cuboClass(canvas.width + 440, baseY - maxSalto*4-20, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const dpP = puntaClass(canvas.width + 600, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP2 = puntaClass(canvas.width + 620, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP3 = puntaClass(canvas.width + 660, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP4 = puntaClass(canvas.width + 700, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const cubo = cuboClass(canvas.width + 720, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpC = cuboClass(canvas.width + 830, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const ptf5 = cuboClass(canvas.width + 830, baseY - 120, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf5B = cuboClass(canvas.width + 980, baseY - 120, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const dpC2 = cuboClass(canvas.width + 1190, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpC2A = cuboClass(canvas.width + 1370, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cubo2 = cuboClass(canvas.width + 1520, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const punta = puntaClass(canvas.width + 1530, baseY - 80,30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      const ptf7 = cuboClass(canvas.width + 1520, baseY -120, 120, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      gruppo.push(ptf1,ptf2,ptf3,ptf4,dpP, dpP2, dpP3, dpP4, cubo, dpC, ptf5, ptf5B, dpC2, dpC2A, cubo2, punta, ptf7);
      break;
    }
   case 3:{
      const baseY = canvas.height - base.height; 
      const cuboA = cuboClass(canvas.width + 20, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const cuboA2 = cuboClass(canvas.width + 70, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpCB = cuboClass(canvas.width + 190, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCB2 = cuboClass(canvas.width + 240, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCC = cuboClass(canvas.width + 360, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cuboC = cuboClass(canvas.width + 360, baseY - 150, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpCC2 = cuboClass(canvas.width + 410, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cuboC2 = cuboClass(canvas.width + 410, baseY - 150, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpCD = cuboClass(canvas.width + 530, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCD2 = cuboClass(canvas.width + 530, baseY - 200, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCDA = cuboClass(canvas.width + 580, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCD2A = cuboClass(canvas.width + 580, baseY - 200, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap)
      const dpCE = cuboClass(canvas.width + 700, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCE2 = cuboClass(canvas.width + 700, baseY - 200, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cuboE = cuboClass(canvas.width + 700, baseY - 250, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpCE2E = cuboClass(canvas.width + 750, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpCE2E2 = cuboClass(canvas.width + 750, baseY - 200, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const cuboE2 = cuboClass(canvas.width + 750, baseY - 250, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const ptf1 = cuboClass(canvas.width + 920, baseY - 200-20, 100, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const cubo4 = cuboClass(canvas.width + 980, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const ptf2 = cuboClass(canvas.width + 1060, baseY - 200-20, 160, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const punta = puntaClass(canvas.width+1190, baseY - 200-50, 30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      gruppo.push(cuboA, cuboA2, dpCB, dpCB2, dpCC, cuboC, dpCC2, cuboC2, dpCD, dpCD2,dpCDA, dpCD2A, dpCE, dpCE2,cuboE,dpCE2E, dpCE2E2,cuboE2, ptf1, cubo4,ptf2, punta );
      break;
    }
    case 4:{
      const baseY = canvas.height - base.height; 
      const cubo = cuboClass(canvas.width + 20, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpP = puntaClass(canvas.width + 70, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP2 = puntaClass(canvas.width + 110, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP2B = puntaClass(canvas.width + 150, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const cubo2 = cuboClass(canvas.width + 190, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpP3 = puntaClass(canvas.width + 240, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP4 = puntaClass(canvas.width + 280, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const dpP3B = puntaClass(canvas.width + 320, baseY - 20, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      const cubo3 = cuboClass(canvas.width + 360, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const ptf1 = cuboClass(canvas.width + 490, baseY - maxSalto-20, 140, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap, true);
      const dpP5 = puntaClass(canvas.width + 590, baseY - maxSalto-40, 40, 20, globalSpeed+SuperSpeed, 3, `doppiaPunta_${skin}`, textureMap);
      gruppo.push(cubo, dpP, dpP2, dpP2B, cubo2, dpP3, dpP4, dpP3B, cubo3, ptf1,dpP5);
      break;
    }
    case 5:{
      const baseY = canvas.height - base.height; 
      const cubo = cuboClass(canvas.width + 20, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const dpC = cuboClass(canvas.width + 210, baseY - 100, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const dpC2 = cuboClass(canvas.width + 210, baseY - 200, 50, 100, globalSpeed+SuperSpeed, 0, `double_stone_${skin}`, textureMap);
      const ptf1 = cuboClass(canvas.width + 210, baseY - 220, 140, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      const ptf1B = cuboClass(canvas.width + 210, baseY - 330, 140, 20, globalSpeed+SuperSpeed, 2, `double_platform_${skin}`, textureMap);
      gruppo.push(cubo, dpC, dpC2, ptf1, ptf1B);
      break;
    }
    case 6:{
      const baseY = canvas.height - base.height; 
      const punta1 = puntaClass(canvas.width+20, baseY -30, 30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      const punta2 = puntaClass(canvas.width+50, baseY -30, 30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      const cubo = cuboClass(canvas.width + 80, baseY - 50, 50, 50, globalSpeed+SuperSpeed, 0, `stone_${skin}`, textureMap);
      const punta3 = puntaClass(canvas.width+130, baseY -30, 30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      const punta4 = puntaClass(canvas.width+160, baseY -30, 30,30,globalSpeed+SuperSpeed,1,`punta_${skin}`,textureMap);
      gruppo.push(punta1, punta2, cubo, punta3, punta4);
      break;
    }
    
  }
  const minX = Math.min(...gruppo.map(o => o.x));
  const maxRight = Math.max(...gruppo.map(o => o.x + o.width));
  patternWidth = maxRight - minX;
  console.log("PATTERN WIDTH: ",patternWidth);
  return gruppo;
}

function vittoria(player, ostacoli){
  if (ostacoli.length > 0) {
    const lastOstacolo = ostacoli[ostacoli.length-1];
    let ultimo = lastOstacolo.getBounds();
    let omino = player.getBounds();
    if (omino.left>ultimo.right && player.grounded){return true;} else {return false;}
  }
  return false;
}

function checkCollision(player, ostacolo) {
  const p = player.getBounds();
  const o = ostacolo.getBounds();

  if (
    p.left < o.right &&
    p.right > o.left &&
    p.top < o.bottom &&
    p.bottom > o.top
  ) {
    if (isLanding(player, ostacolo)) return "landing";
    if (
      player.velocityY < 0 &&
      p.top <= o.bottom &&
      p.bottom > o.bottom &&
      p.right > o.left &&
      p.left < o.right
    ) return "bounce";
    if (ostacolo.tipo==7){ return "super";}
    return "collision";
  }

  return null;
}
function isLanding(player, ostacolo) {
  const p = player.getBounds();
  const o = ostacolo.getBounds();

  return (
    p.bottom >= o.top &&
    p.top < o.top &&
    player.velocityY > 0 &&
    p.left < o.right &&
    p.right > o.left
  );
}


function isGameOver(){
  punti-=50;
  if (punti<0){punti=0;}
  ptLabel.textContent="PUNTI "+punti;
  localStorage.setItem("punti", punti);
  enableSkin(punti);
  let loseMessage = document.getElementById("message");
  loseMessage.innerHTML=`GAME OVER!!<br>PUNTI ${punti}`;
  loseMessage.style.visibility="visible";
  safeSkinSelection();
  gameOver = true;
  gameRunning=false;
  // NUOVO CODICE AGGIUNTO QUI: Mostra gli elementi della UI
    const puntilB = document.getElementById("punti");
    const levelInput = document.getElementById("levelNumber");
    const playButton = document.getElementById("play");
    const settingsIcon = document.getElementById("settingsIcon");

    if (isMobileLandscape()) {
        // Mostra gli elementi di controllo in modalità landscape
        puntilB.style.display = 'block';
        levelInput.style.display = 'block';
        playButton.style.display = 'block';
        settingsIcon.style.display = 'block';
    }
}

function isVittoria(){
  punti+=200;
  let vittMessage = document.getElementById("message");
  vittMessage.innerHTML=`VITTORIA!!<br>PUNTI ${punti}`;
  vittMessage.style.visibility="visible";
  ptLabel.textContent="PUNTI "+punti;
  localStorage.setItem("punti",punti);
  enableSkin(punti);
  const levelbox = document.getElementById("levelNumber");
  level = parseInt(levelbox.value,10)+1;
  levelbox.value=level;
  gameRunning=false;
  // CODICE DA AGGIUNGERE QUI per mostrare di nuovo i controlli
  const puntilB = document.getElementById("punti");
  const levelInput = document.getElementById("levelNumber");
  const playButton = document.getElementById("play");
  const settingsIcon = document.getElementById("settingsIcon");

  if (isMobileLandscape()) {
      puntilB.style.display = 'block';
      levelInput.style.display = 'block';
      playButton.style.display = 'block';
      settingsIcon.style.display = 'block';
  }
}

function enableSkin(punti) {
  for (let i = 0; i < 5; i++) {
    const radio = document.getElementById(`skin${i}`);
    radio.disabled = punti < i * 3000;
  }
}

function safeSkinSelection(){
  if (skin>0){
    let successful=false;
    while (!successful){
      const radio = document.getElementById(`skin${skin}`);
      if (radio.disabled){
        skin--;
      } else {
        successful=true;
        radio.checked=true;
        localStorage.setItem("skin",skin);
        loadBGGame(skin);
      }
    }
  }
}
//MOBILE EDIT
function isMobileLandscape() {
  return window.innerWidth <= 768 && window.innerHeight < window.innerWidth;
}

function movePunti() {
  const punti = document.getElementById("punti");
  const levelInput = document.getElementById("levelNumber");
  const playButton = document.getElementById("play");
  const superiore = document.getElementById("superiore");
  const setting = document.getElementById("settingsIcon");

  if (isMobileLandscape() && punti.parentElement.id === "controlli") {
    superiore.appendChild(punti); // lo sposta fuori da #controlli
    superiore.appendChild(levelInput);
    superiore.appendChild(playButton);
    superiore.appendChild(setting);
    
  }
}

window.addEventListener("load", movePunti);
window.addEventListener("resize", movePunti);
document.getElementById("settingsIcon").onclick = () => {
  const popup = document.getElementById("settingsPopup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
};
function moveSettingsToPopup() {
  const logo = document.getElementById("logo");
  const skinBox = document.getElementById("skinBox");
  const popupContent = document.getElementById("popupContent");

  if (isMobileLandscape()) {
    if (popupContent && popupContent.children.length === 0) {
      popupContent.appendChild(logo);
      popupContent.appendChild(skinBox);
    }
  }
}


function toggleSettingsPopup() {
  const popup = document.getElementById("settingsPopup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

document.getElementById("settingsIcon").onclick = () => {
  toggleSettingsPopup();
};

window.addEventListener("load", moveSettingsToPopup);
window.addEventListener("resize", moveSettingsToPopup);
