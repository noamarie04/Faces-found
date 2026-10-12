let circles = [];  // Raster circles
let video; // live Bild
let faceMesh; // KI Gesichter erkennen
let faces = []; // gefundene Nasen Speicher

let handPose; // KI die Hände erkennt
let hands = []; // gefundene Hände Speicher

// Speicher gelbe Hand Schweif
let trail = []; 
const MAX_TRAIL_LENGTH = 30; // Schweif länge gerade 30 max.

// Nase 1 Position & Geschw.
let noseX = 0; 
let noseY = 0; 
let prevNoseX = 0;
let prevNoseY = 0; 
let noseSpeed = 0; 

// Nase 2
let nose2X = 0;
let nose2Y = 0;

// Layout in %
const GRID_WIDTH_PCT = 0.85;  
const VIDEO_WIDTH_PCT = 0.10; 
const MARGIN_PCT = 0.02;  
const GRID_SIZE = 25; // Abstand Raster Kreise

// la ola Welle Lachen
let waveX = -500; // Startpos. Canvas links
let isWaveActive = false; // läuft schon oder nicht
let waveSpeed = 16; // Schnelligkeit links nach rechts
let waveWidth = 120; // Breite Welle // Böse Modus
let angryTimer = 0; // Wenn Zeit aus = nicht mehr rot    
let isAngryActive = false; // an oder nicht

// Zunge
let isStarModeActive = false; // Wenn Zunge weg = Sterne weg und Kreise weg

// Explosion
let shockTimer = 0; // Timer Explosion    
let isShockActive = false; // Gerade an ja nein
let canTriggerShock = true; // nur einmal 

// Quests
let quests = []; // alle Quests
let activeQuestIndex = 0; // Welche Quest gerade
let questTimer = 0; // Timer vor nächster Quest = 0

// Variablen um das Gesicht zu vermessen
let statsMouthSmile = 0;
let statsMouthSurprise = 0;
let statsBrowAngry = 0;
let statsEyeDistance = 0; // NEU: Maximaler Augenabstand
let statsNoseWidth = 0;    // NEU: Maximale Nasenbreite
let statsFaceHeight = 0;   // NEU: Maximale Gesichtshöhe
let statsTotalTime = 0;
let startTime = 0;
let showDashboard = false;
let dashboard; 

class Quest {
  constructor(text, checkFunction) {
    this.text = text; // Quest Text
    this.check = checkFunction; // Geschafft oder noch nicht
    this.isFulfilled = false; // Check on Quest erfüllt
    this.x = windowWidth + 200; // Pos. rechts
    this.targetX = 0; // wo hin
  }
// prüft Quest geschafft und flüssig
  update(targetX) {
    this.targetX = targetX;
    this.x = lerp(this.x, this.targetX, 0.12); // Reingleiten Questkärtchen

    if (!this.isFulfilled) {
      if (this.check()) {
        this.isFulfilled = true; // Quest geschafft
      }
    }
  }

  // Quest Kärtchen Rosa und Blau = fertig
  display(y) {
    push();
    rectMode(CORNER);
    noStroke();
    
    if (this.isFulfilled) {
      fill(142, 219, 247); // Blau
    } else {
      fill(240, 203, 222); // Rosa
    } let cardW = windowWidth * VIDEO_WIDTH_PCT;
    rect(this.x, y, cardW, 55, 8); // abgerundete Ecken

    fill(40, 40, 40); // Schriftfarbe
    textAlign(CENTER, CENTER);
    textSize(15); 
    textFont('sans-serif');
    text(this.text, this.x + cardW / 2, y + 27.5); // Text auf Karte
    pop();
  }
} 

// Daten Gesicht etc.
class DataDashboard {
  constructor() {
    this.w = windowWidth * 0.60; // Bildschirmbreite
    this.h = windowHeight * 0.70;
    this.btnW = 200;
    this.btnH = 50;
  }

  display() {
    let x = (windowWidth - this.w) / 2;
    let y = (windowHeight - this.h) / 2;

    push();
    fill(0, 0, 0, 80);
    rect(0, 0, windowWidth, windowHeight);

    fill(255);
    stroke(220);
    strokeWeight(1);
    rect(x, y, this.w, this.h, 4); // Header
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    textFont('sans-serif');
    textSize(20);
    textStyle(BOLD);
    text("BIOMETRISCHES DATENBLATT // ANALYSIS_COMPLETE", x + 40, y + 40);
    
    // Trennlinie
    stroke(240);
    line(x + 40, y + 80, x + this.w - 40, y + 80);
    noStroke();

    let smileCM = nfc(map(statsMouthSmile, 0, 0.6, 0, 6.5, true), 1);
    let surpriseCM = nfc(map(statsMouthSurprise, 0, 1.5, 0, 5.2, true), 1);
    let browMM = nfc(map(statsBrowAngry, 0.2, 0.05, 0, 18, true), 1);
    let timeSec = Math.floor((millis() - startTime) / 1000);

    let eyeRatio = statsFaceHeight > 0 ? (statsEyeDistance / statsFaceHeight) : 0;
    let eyeCM = nfc(map(eyeRatio, 0.2, 0.4, 4.5, 7.5, true), 1);

    let noseRatio = statsFaceHeight > 0 ? (statsNoseWidth / statsFaceHeight) : 0;
    let noseCM = nfc(map(noseRatio, 0.15, 0.3, 2.8, 4.8, true), 1);

    let faceCM = nfc(map(statsFaceHeight, 30, 110, 16.0, 24.5, true), 1);

    let col1X = x + 40;
    let col2X = x + (this.w / 2);
    let startTextY = y + 110;
    let rowGap = 90; // Vertikaler Abstand der Zeilen

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("MUNDDEHNUNG (HORIZONTAL)", col1X, startTextY);
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(smileCM + " cm", col1X, startTextY + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("AUGENBRAUEN-ABSTAND", col2X, startTextY);
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(browMM + " mm", col2X, startTextY + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("MUNDÖFFNUNG (VERTIKAL)", col1X, startTextY + rowGap);
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(surpriseCM + " cm", col1X, startTextY + rowGap + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("GESICHTSHÖHE", col2X, startTextY + rowGap);
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(faceCM + " cm", col2X, startTextY + rowGap + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("AUGENABSTAND)", col1X, startTextY + (rowGap * 2));
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(eyeCM + " cm", col1X, startTextY + (rowGap * 2) + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("NASENBREITE", col2X, startTextY + (rowGap * 2));
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(noseCM + " cm", col2X, startTextY + (rowGap * 2) + 18);

    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("TRACKING-DAUER & ANALYSE", col1X, startTextY + (rowGap * 3));
    fill(0);
    textSize(28);
    textStyle(BOLD);
    text(timeSec + " s", col1X, startTextY + (rowGap * 3) + 18);

    fill(0); 
    textSize(18);
    textStyle(NORMAL);
    textFont('sans-serif');
    
    let meinEigenerText = "Mein Projekt 'Faces Found - I'm not a robot (yet)' soll veranschaulichen, wie schnell man heutzutage per Kamera ein Gesicht vermessen kann. Risiken wie Deepfakes werden durch diese fortgeschritten Systeme möglich gemacht. Eure Biometrischen Daten werden NICHT gespeichert und nur zur Veranschaulichung genutzt. ";
    
    text(meinEigenerText, x + 30, y + this.h - 260, this.w - 60, 100);

    fill(150);
    textSize(10);
    textStyle(NORMAL);
    let infoText = "Alle erfassten Gesichtskoordinaten, Bewegungsprofile und biometrischen Merkmale wurden temporär im Lokal gespeichert. Durch Klicken auf 'Daten löschen' bestätigen Sie den Abbruch der Analyse.";
    text(infoText, x + 40, y + this.h - 130, this.w - 80, 50); // "Daten löschen"
    let btnX = x + this.w - this.btnW - 40;
    let btnY = y + this.h - this.btnH - 40;

    if (mouseX > btnX && mouseX < btnX + this.btnW && mouseY > btnY && mouseY < btnY + this.btnH) {
      fill(40);
      cursor(HAND);
    } else {
      fill(0);
      cursor(ARROW);
    }
    rect(btnX, btnY, this.btnW, this.btnH, 2);

    // Button Text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text("Daten löschen", btnX + this.btnW / 2, btnY + this.btnH / 2);
    pop();
  } 
  
  checkClick() {
    let x = (windowWidth - this.w) / 2;
    let y = (windowHeight - this.h) / 2;
    let btnX = x + this.w - this.btnW - 40;
    let btnY = y + this.h - this.btnH - 40;

    if (mouseX > btnX && mouseX < btnX + this.btnW && mouseY > btnY && mouseY < btnY + this.btnH) {
      this.resetGame();
    }
  }

  resetGame() {
    showDashboard = false;
    statsMouthSmile = 0;
    statsMouthSurprise = 0;
    statsBrowAngry = 0;
    statsEyeDistance = 0; // Zurücksetzen
    statsNoseWidth = 0;    // Zurücksetzen
    statsFaceHeight = 0;   // Zurücksetzen
    startTime = millis();
    initQuests();
    initGrid();
    cursor(ARROW);
  }
} 

// preload KI facemesh und handpose
function preload() { 
  ml5.setBackend("webgl"); 
  faceMesh = ml5.faceMesh({ maxFaces: 3, flipHorizontal: true }); // Spiegelverkehrt wegen Video
  handPose = ml5.handPose({ flipHorizontal: true }); // hier auch
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Canvas je groß wie Window

  video = createCapture(VIDEO); // video an
  video.size(160, 120); // video klein
  video.hide(); // video weg, definieren selbst

  faceMesh.detectStart(video, gotFaces); // Gesichtserkennung 
  handPose.detectStart(video, gotHands); // Handerkennung

  initGrid(); // Circle Raster
  initQuests(); // Quests laden

  startTime = millis(); 
  dashboard = new DataDashboard(); 
} 

function initQuests() {
  quests = [];
  activeQuestIndex = 0;
  questTimer = 0;

  // Questliste
  quests.push(new Quest("zeig dich!", () => faces.length > 0)); // Gesicht erkannt?
  quests.push(new Quest("wink doch mal", () => hands.length > 0)); // Hand erkannt?
  quests.push(new Quest("lach ganz groß", () => checkSmile())); // Lächeln erkannt?
  quests.push(new Quest("schau überrascht", () => checkSurprised()));  
  quests.push(new Quest("streck die Zunge raus", () => checkTongue()));   
  quests.push(new Quest("schau böse", () => checkAngry())); 

  // Peace - checkt Finger Positionen
  quests.push(new Quest("zeig Peace", () => {
    if (hands.length > 0) {
      let hand = hands[0];
      let kp = hand.keypoints || hand.landmarks;
      if (kp) {
        let indexExtended = kp[8].y < kp[6].y; // Zeigefinger
        let middleExtended = kp[12].y < kp[10].y; // Mittelfinger
        let ringFolded = kp[16].y > kp[14].y; // Ringfinger
        let pinkyFolded = kp[20].y > kp[18].y; // kleiner Finger 
        return indexExtended && middleExtended && ringFolded && pinkyFolded;
      }
    }
    return false;
  }));

  quests.push(new Quest("such eine 2. Person", () => faces.length > 1)); // mehr als 1 Gesicht
} 

// Hilfsfunktion für Emotionenerkennung
// Lächeln verhältnis zu Gesicht breit genug
function checkSmile() {
  if (faces.length > 0 && faces[0].keypoints) {
    let kp = faces[0].keypoints;
    if (kp[61] && kp[291] && kp[10] && kp[152]) {
      let mouthWidth = dist(kp[61].x, kp[61].y, kp[291].x, kp[291].y);
      let faceHeight = dist(kp[10].x, kp[10].y, kp[152].x, kp[152].y);
      let val = mouthWidth / faceHeight;
      if (val > statsMouthSmile) statsMouthSmile = val; // Höchsten Lach-Wert merken
      return val > 0.42;
    }
  }
  return false;
} 

// Böse schauen - Augenbrauen nah an einander
function checkAngry() {
  if (faces.length > 0 && faces[0].keypoints) {
    let kp = faces[0].keypoints;
    if (kp[55] && kp[285] && kp[10] && kp[152]) {
      let browDist = dist(kp[55].x, kp[55].y, kp[285].x, kp[285].y);
      let faceHeight = dist(kp[10].x, kp[10].y, kp[152].x, kp[152].y);
      let val = browDist / faceHeight;
      if (statsBrowAngry == 0 || val < statsBrowAngry) statsBrowAngry = val; // Geringsten Brauen-Abstand merken
      return val < 0.16;
    }
  }
  return false;
}

// Zunge raus - Mund offen Zungenerkennung
function checkTongue() {
  if (faces.length > 0 && faces[0].keypoints) {
    let kp = faces[0].keypoints;
    if (kp[13] && kp[14] && kp[10] && kp[152]) {
      let mouthOpen = dist(kp[13].x, kp[13].y, kp[14].x, kp[14].y);
      let faceHeight = dist(kp[10].x, kp[10].y, kp[152].x, kp[152].y);
      return (mouthOpen / faceHeight) > 0.08;
    }
  }
  return false;
}

// Überrascht - Mund höher als breit
function checkSurprised() {
  if (faces.length > 0 && faces[0].keypoints) {
    let kp = faces[0].keypoints;
    if (kp[13] && kp[14] && kp[78] && kp[308]) {
      let mouthHeight = dist(kp[13].x, kp[13].y, kp[14].x, kp[14].y);
      let mouthWidth = dist(kp[78].x, kp[78].y, kp[308].x, kp[308].y);
      let val = mouthHeight / mouthWidth;
      if (val > statsMouthSurprise) statsMouthSurprise = val; // Höchsten Überraschungs-Wert merken
      return val > 0.65;
    }
  }
  return false;
} 

// Circle grid Raster
function initGrid() {
  circles = [];
  let gridMaxX = windowWidth * GRID_WIDTH_PCT; 
  let margin = windowWidth * MARGIN_PCT;

  for (let x = margin; x < gridMaxX; x += GRID_SIZE) { 
    for (let y = margin; y < windowHeight - margin; y += GRID_SIZE) {
      circles = circles.concat(new Circle(x, y)); // mehr circ les wenn größer
    }
  }
} 

function draw() {
  background(255); // weiß

  let margin = windowWidth * MARGIN_PCT; 
  let gridMaxX = windowWidth * GRID_WIDTH_PCT;

  // NEU: Gesicht in Echtzeit für die Zusatzstatistiken abscannen
  if (faces && faces.length > 0) {
    let face = faces[0];
    if (face.keypoints) {
      let kp = face.keypoints;
      // Augenabstand
      if (kp[133] && kp[362]) {
        let d = dist(kp[133].x, kp[133].y, kp[362].x, kp[362].y);
        if (d > statsEyeDistance) statsEyeDistance = d;
      }
      // Nasenbreite 
      if (kp[102] && kp[331]) {
        let d = dist(kp[102].x, kp[102].y, kp[331].x, kp[331].y);
        if (d > statsNoseWidth) statsNoseWidth = d;
      }
      // Gesichtshöhe
      if (kp[10] && kp[152]) {
        let d = dist(kp[10].x, kp[10].y, kp[152].x, kp[152].y);
        if (d > statsFaceHeight) statsFaceHeight = d;
      }
    }
  }

  // mini Explosion
  if (activeQuestIndex >= 3 && checkSurprised()) {
    if (canTriggerShock) {
      isShockActive = true;
      shockTimer = 65; // länge Explosion
      canTriggerShock = false; // Sperre, nicht anderes
      for (let c of circles) {
        c.explode(); // Befehl circles auseinander
      }
    }
  } else {
    if (!checkSurprised()) {
      canTriggerShock = true; // entsperrt wenn Gesicht normal
    }
  }

  // Explo. Timer
  if (isShockActive) {
    shockTimer--;
    if (shockTimer <= 0) {
      isShockActive = false; // Explo zuende, Circles normal
    }
  } // Stern
  if (activeQuestIndex >= 4 && checkTongue()) {
    isStarModeActive = true;
  } else {
    isStarModeActive = false;
  }

  // Böse modus
  if (activeQuestIndex >= 5 && checkAngry()) {
    angryTimer = 300; 
    isAngryActive = true;
  }

  if (isAngryActive) {
    angryTimer--;
    if (angryTimer <= 0) {
      isAngryActive = false;
    }
  }

  // la ola Welle
  if (!isWaveActive && checkSmile()) {
    isWaveActive = true;
    waveX = 0; 
  } if (isWaveActive) {
    waveX += waveSpeed; // welle links nach rechts
    if (waveX > gridMaxX + waveWidth) {
      isWaveActive = false; // aus wenn Rechts angekommen
      waveX = -500;
    }
  } else {
    // Nase Person 1
    if (faces && faces.length > 0 && !isShockActive) { 
      let face = faces[0]; 
      if (face.keypoints && face.keypoints[4]) { // Keypoint 4 = Nase
        let rawNose = face.keypoints[4]; 
        prevNoseX = noseX;
        prevNoseY = noseY;
        noseX = map(rawNose.x, 0, 160, margin, gridMaxX); 
        noseY = map(rawNose.y, 0, 120, margin, windowHeight - margin);
        let targetSpeed = dist(prevNoseX, prevNoseY, noseX, noseY); 
        noseSpeed = lerp(noseSpeed, targetSpeed, 0.15); // Bewegungsgeschw. berechnen
      }
    }
    
    // Nase ab Quest
    if (activeQuestIndex >= 7 && faces && faces.length > 1 && !isShockActive) {
      let face2 = faces[1];
      if (face2.keypoints && face2.keypoints[4]) {
        let rawNose2 = face2.keypoints[4];
        let target2X = map(rawNose2.x, 0, 160, margin, gridMaxX);
        let target2Y = map(rawNose2.y, 0, 120, margin, windowHeight - margin);
        nose2X = lerp(nose2X, target2X, 0.15);
        nose2Y = lerp(nose2Y, target2Y, 0.15);
      }
    }
  }   // Verbindung ab Quest
  let drawBridge = (activeQuestIndex >= 7 && faces.length > 1);

  // Raster updaten und zeichnen
  for (let c of circles) {
    if (isWaveActive) {
      c.updateWave(waveX, waveWidth, isAngryActive);
    } else {
      c.update(noseX, noseY, noseSpeed, isAngryActive, drawBridge, nose2X, nose2Y); 
    }
    c.display(isStarModeActive); // Kreis oder Stern je was aktiv
  } // Gelber Hand Schweif - Keypoint 9
  if (!isWaveActive && hands && hands.length > 0) {
    let hand1 = hands[0];
    let keypoints1 = hand1.keypoints || hand1.landmarks;

    if (keypoints1 && keypoints1[9]) { 
      let rawHand1 = keypoints1[9]; 
      let hand1X = map(rawHand1.x, 0, 160, margin, gridMaxX);
      let hand1Y = map(rawHand1.y, 0, 120, margin, windowHeight - margin);

      trail.push(createVector(hand1X, hand1Y)); // Punkte von Schweif
      if (trail.length > MAX_TRAIL_LENGTH) {
        trail.shift(); // max länge 30. löscht dann
      }
    }
  } else {
    if (trail.length > 0) trail.shift(); // Schweif weg wenn keine Hand
  } // Schweif zeichnen Gelb und transparent
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      let pt1 = trail[i - 1];
      let pt2 = trail[i];
      let alphaFactor = map(i, 0, trail.length - 1, 0, 150); 
      let thickness = map(i, 0, trail.length - 1, 2, 28); 

      stroke(255, 220, 0, alphaFactor); // Gelb
      strokeWeight(thickness); 
      strokeCap(ROUND); 
      line(pt1.x, pt1.y, pt2.x, pt2.y); 
    }
  }

  // Video Bild
  let videoW = windowWidth * VIDEO_WIDTH_PCT;
  let videoH = videoW * (3 / 4); 
  let videoX = windowWidth - videoW - margin;
  let videoY = margin; fill(220);
  noStroke();
  rect(videoX, videoY, videoW, videoH, 8); // Grau wenn vid aus

  push();
  translate(videoX + videoW, videoY);
  scale(-1, 1); // Gespiegelt
  image(video, 0, 0, videoW, videoH); 
  pop();

  // Quests Logik
  let startY = videoY + videoH + 20; 
  let gap = 65;                    

  // Quests bis aktiver Quests anzeige
  for (let i = 0; i <= activeQuestIndex; i++) {
    if (i < quests.length) {
      quests[i].update(videoX);       
      quests[i].display(startY + i * gap); 
    }
  }   // 2 Sekunden Pause bis nächste Quest
  if (activeQuestIndex < quests.length && quests[activeQuestIndex].isFulfilled) {
    questTimer++;
    if (questTimer > 120) { 
      if (activeQuestIndex === quests.length - 1) {
        showDashboard = true;
      } else if (activeQuestIndex < quests.length - 1) {
        activeQuestIndex++;
        questTimer = 0; 
      }
    }
  }

  if (showDashboard) {
    dashboard.display();
  }
} 

function mousePressed() {
  if (showDashboard) {
    dashboard.checkClick();
  }
}

function gotFaces(results) { faces = results; }
function gotHands(results) { hands = results; }

// Circle wachs Funktion wenn Browser größer
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGrid(); 
} // Sterne bauen

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
} 

class Circle { 
  constructor(x, y) { 
    this.homeX = x; // fester Platz wo im Canvas
    this.homeY = y;
    this.x = x; // aktuelle Pos.
    this.y = y; 
    this.vx = 0; // Geschw. X
    this.vy = 0; // Geschw. Y
    
    this.baseSize = 4; // normale mini größe
    this.currentSize = 4; // aktuelle Größe
    this.maxSize = 85; // max größe
    this.colorColor = color(0, 174, 239, 160); // cyan
  }   // Explosion
  explode() {
    let centerX = (windowWidth * GRID_WIDTH_PCT) / 2;
    let centerY = windowHeight / 2;
    let dx = this.x - centerX;
    let dy = this.y - centerY;
    let distance = dist(centerX, centerY, this.x, this.y);
    if (distance == 0) distance = 1; 
    let force = map(distance, 0, windowWidth, 45, 5); // Punkte nah = schneller
    this.vx = (dx / distance) * force; // weg von mitte
    this.vy = (dy / distance) * force;
  }

  update(targetX, targetY, speed, isAngry, hasBridge, target2X, target2Y) { 
    this.x += this.vx;
    this.y += this.vy;
    // zurück zum festen Platz
    let springForceX = (this.homeX - this.x) * 0.12; 
    let springForceY = (this.homeY - this.y) * 0.12;
    this.vx += springForceX;
    this.vy += springForceY;
    this.vx *= 0.78; 
    this.vy *= 0.78;   // Distanz Person 1
    let d1 = dist(targetX, targetY, this.x, this.y); 
    
    let sizeFromP1 = 0;
    if (d1 < 220) {
      sizeFromP1 = map(d1, 0, 220, this.maxSize, this.baseSize);
    } else {
      sizeFromP1 = this.baseSize;
    }

    let finalTargetSize = sizeFromP1;
    let bridgeInfluence = 0; // Verbindung / Brücke
    if (hasBridge) {
      // Distanz Person 2
      let d2 = dist(target2X, target2Y, this.x, this.y);
      let sizeFromP2 = (d2 < 220) ? map(d2, 0, 220, this.maxSize, this.baseSize) : this.baseSize;
      
      finalTargetSize = max(sizeFromP1, sizeFromP2);

      let lineDist = this.distanceToLine(this.x, this.y, targetX, targetY, target2X, target2Y);
      let totalBridgeLength = dist(targetX, targetY, target2X, target2Y);
      
      let dCenter1 = dist(targetX, targetY, this.x, this.y);
      let dCenter2 = dist(target2X, target2Y, this.x, this.y);

      if (lineDist < 75 && dCenter1 < totalBridgeLength && dCenter2 < totalBridgeLength) {
        bridgeInfluence = map(lineDist, 0, 75, 26, 0); 
        finalTargetSize = max(finalTargetSize, this.baseSize + bridgeInfluence);
      }
    } 
    // Verbindung / Brücke
    let baseColor = isAngry ? color(100, 0, 0, 160) : color(0, 174, 239, 160);       
    let activeColor = isAngry ? color(255, 0, 0, 220) : color(255, 0, 128, 160);     

    this.currentSize = lerp(this.currentSize, finalTargetSize, 0.15); 
    
    if (bridgeInfluence > 5 && !isAngry) {
      // Verbindung cyan
      this.colorColor = lerpColor(this.colorColor, color(0, 210, 255, 180), 0.2);
    } else if (d1 < 220) {
      let speedFactor = map(speed, 0, 45, 0, 1, true); 
      let targetColor = lerpColor(baseColor, activeColor, speedFactor); 
      this.colorColor = lerpColor(this.colorColor, targetColor, 0.2); 
    } else {
      this.colorColor = lerpColor(this.colorColor, baseColor, 0.03);
    }
  }  

  updateWave(wX, wWidth, isAngry) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx += (this.homeX - this.x) * 0.12;
    this.vy += (this.homeY - this.y) * 0.12;
    this.vx *= 0.78;
    this.vy *= 0.78;

    let d = abs(this.x - wX);
    let baseColor = isAngry ? color(100, 0, 0, 160) : color(0, 174, 239, 160);     
    let flankColor = isAngry ? color(180, 20, 20, 180) : color(255, 220, 0, 200);  
    let centerColor = isAngry ? color(255, 0, 0, 230) : color(255, 0, 128, 220);    

    if (d < wWidth) {
      let waveFactor = cos((d / wWidth) * HALF_PI); 
      let targetSize = map(waveFactor, 0, 1, this.baseSize, this.maxSize);
      this.currentSize = lerp(this.currentSize, targetSize, 0.3);

      if (waveFactor > 0.65) {
        let fadeToCenter = map(waveFactor, 0.65, 1, 0, 1);
        this.colorColor = lerpColor(flankColor, centerColor, fadeToCenter);
      } else {
        let fadeToFlank = map(waveFactor, 0, 0.65, 0, 1);
        this.colorColor = lerpColor(baseColor, flankColor, fadeToFlank);
      }
    } else {
      this.currentSize = lerp(this.currentSize, this.baseSize, 0.1);
      this.colorColor = lerpColor(this.colorColor, baseColor, 0.1);
    }
  } 
  // Linien Mathe
  distanceToLine(px, py, x1, y1, x2, y2) {
    let l2 = dist(x1, y1, x2, y2);
    if (l2 == 0) return dist(px, py, x1, y1);
    l2 = l2 * l2;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = max(0, min(1, t));
    return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  // Zeichnet auf Bildschirm
  display(drawAsStar) { 
    noStroke();
    fill(this.colorColor); 
    
    if (drawAsStar) {
      let r1 = this.currentSize * 0.35 * 1.35; // Stern größe Radius innen
      let r2 = this.currentSize * 0.75 * 1.35; // Stern größe Radius außen
      if (this.currentSize <= this.baseSize + 1) {
        r1 = 3; // kleine größe
        r2 = 10;
      }
      drawStar(this.x, this.y, r1, r2, 5); // Sterfunktion 5 Ecken
    } else {
      ellipse(this.x, this.y, this.currentSize, this.currentSize); // zeichnet Kreis normal
    }
  }
}