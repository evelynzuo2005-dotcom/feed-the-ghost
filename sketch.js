let port;

// Web control
let startBtn;

let score = 0;
let gameStarted = false;
let gameOver = false;
let gameResult = "";

// Timer
let gameDuration = 30; // seconds
let startTime = 0;
let timeLeft = 30;

// Arduino input
let leftButton = 1;
let rightButton = 1;
let potValue = 0;

let lastLeftReading = 1;
let lastRightReading = 1;

let stableLeft = 1;
let stableRight = 1;

let lastDebounceTimeLeft = 0;
let lastDebounceTimeRight = 0;
let debounceDelay = 60;

// Size
let ghostSize = 200;
let targetSize = 200;
let defaultSize = 200;

// Rotation
let ghostRotation = 0;
let smoothPot = 0;
let targetRotation = 0;
let useSerialRotation = true;

// Images
let broccoliImg;
let candyImg;
let ghostImg;

// Feedback
let feedback = "";
let feedbackTimer = 0;

// Decorative stars
let stars = [];

// Music
let bgMusic;
let musicStarted = false;

function preload() {
  broccoliImg = loadImage("broccoli.png");
  candyImg = loadImage("candy.png");
  ghostImg = loadImage("ghost.png");
}

function setup() {
  createCanvas(900, 600);
  imageMode(CENTER);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);

  // Keep serial support, but no visible button
  port = createSerial();

  startBtn = createButton("Start");
  startBtn.addClass("game-btn");
  startBtn.position(width / 2 - 70, height - 68);
  startBtn.size(140, 42);
  startBtn.mousePressed(startGame);

  // Background music
  bgMusic = new Audio("soundgallerybydmitrytaras-halloween-116010.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.35;
  bgMusic.preload = "auto";

  // Stars
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1.5, 4),
      speed: random(0.2, 0.8),
      phase: random(360)
    });
  }
}

function startGame() {
  score = 0;
  gameStarted = true;
  gameOver = false;
  gameResult = "";
  startTime = millis();
  timeLeft = gameDuration;

  ghostSize = defaultSize;
  targetSize = defaultSize;
  ghostRotation = 0;
  targetRotation = 0;

  feedback = "Feed the ghost candy!";
  feedbackTimer = 60;

  // Start music on first user interaction
  if (!musicStarted) {
    bgMusic.play().catch(() => {
      console.log("Autoplay was blocked until user interaction.");
    });
    musicStarted = true;
  }
}

function feedGhost(food) {
  if (!gameStarted) {
    feedback = "Press Start first!";
    feedbackTimer = 40;
    return;
  }

  if (gameOver) return;

  if (food === "broccoli") {
    score--;
    targetSize = 145;
    feedback = "Eww! Broccoli!";
  } else if (food === "candy") {
    score++;
    targetSize = 265;
    feedback = "Yum! Candy!";
  }

  targetSize = constrain(targetSize, 120, 300);
  feedbackTimer = 40;
}

function draw() {
  drawBackground();

  readSerialSafe();
  updateButtonsWithDebounce();

  if (gameStarted && !gameOver) {
    timeLeft = max(0, gameDuration - floor((millis() - startTime) / 1000));

    if (score >= 5) {
      gameOver = true;
      gameResult = "YOU WIN!";
      feedback = "The ghost is full of candy!";
      feedbackTimer = 90;
    } else if (score <= -5) {
      gameOver = true;
      gameResult = "YOU LOSE!";
      feedback = "Too much broccoli...";
      feedbackTimer = 90;
    } else if (timeLeft === 0) {
      gameOver = true;
      if (score >= 5) {
        gameResult = "YOU WIN!";
        feedback = "Perfect timing!";
      } else {
        gameResult = "TIME'S UP";
        feedback = "Not enough candy!";
      }
      feedbackTimer = 90;
    }
  }

  if (useSerialRotation) {
    smoothPot = lerp(smoothPot, potValue, 0.08);
    targetRotation = map(smoothPot, 0, 1023, -180, 180);
  }

  ghostRotation = lerp(ghostRotation, targetRotation, 0.12);
  ghostSize = lerp(ghostSize, targetSize, 0.12);

  // slowly return to normal size
  targetSize = lerp(targetSize, defaultSize, 0.05);

  // Arduino input still works if port has been opened elsewhere
  if (!gameOver && buttonPressedLeft()) {
    if (!gameStarted) startGame();
    feedGhost("broccoli");
  }

  if (!gameOver && buttonPressedRight()) {
    if (!gameStarted) startGame();
    feedGhost("candy");
  }

  drawScene();
}

function drawBackground() {
  background(10, 10, 45);

  noStroke();
  fill(30, 30, 90, 70);
  ellipse(width * 0.2, height * 0.2, 260, 260);
  fill(80, 40, 120, 45);
  ellipse(width * 0.82, height * 0.25, 300, 300);
  fill(40, 80, 130, 35);
  ellipse(width * 0.5, height * 0.82, 420, 220);

  for (let s of stars) {
    let alpha = 120 + sin(frameCount * s.speed + s.phase) * 80;
    fill(255, 255, 255, alpha);
    circle(s.x, s.y, s.size);
  }
}

function readSerialSafe() {
  let str = port.readUntil("\n");
  str = trim(str);

  if (str.length === 0) return;

  let values = str.split(",");
  if (values.length !== 3) return;

  let newLeft = int(values[0]);
  let newRight = int(values[1]);
  let newPot = int(values[2]);

  if (!Number.isNaN(newLeft)) leftButton = newLeft;
  if (!Number.isNaN(newRight)) rightButton = newRight;
  if (!Number.isNaN(newPot)) potValue = newPot;
}

function updateButtonsWithDebounce() {
  if (leftButton !== lastLeftReading) {
    lastDebounceTimeLeft = millis();
    lastLeftReading = leftButton;
  }

  if (millis() - lastDebounceTimeLeft > debounceDelay) {
    stableLeft = leftButton;
  }

  if (rightButton !== lastRightReading) {
    lastDebounceTimeRight = millis();
    lastRightReading = rightButton;
  }

  if (millis() - lastDebounceTimeRight > debounceDelay) {
    stableRight = rightButton;
  }
}

let prevStableLeft = 1;
let prevStableRight = 1;

function buttonPressedLeft() {
  let pressed = false;
  if (stableLeft === 0 && prevStableLeft === 1) {
    pressed = true;
  }
  prevStableLeft = stableLeft;
  return pressed;
}

function buttonPressedRight() {
  let pressed = false;
  if (stableRight === 0 && prevStableRight === 1) {
    pressed = true;
  }
  prevStableRight = stableRight;
  return pressed;
}

function drawScene() {
  fill(255);
  textSize(38);
  text("Feed The Ghost", width / 2, 58);

  fill(220);
  textSize(16);
  text("Candy makes it grow. Broccoli makes it shrink.", width / 2, 92);

  fill(210);
  textSize(14);
  text("Keyboard: A = Broccoli   D = Candy   ← → = Rotate", width / 2, 116);

  fill(255);
  textSize(20);
  text("Score: " + score, width / 2 - 90, 150);
  text("Time: " + timeLeft, width / 2 + 90, 150);

  fill(255, 240, 180);
  textSize(16);
  text("Goal: Reach +5 before you fall to -5", width / 2, 180);

  image(broccoliImg, width * 0.22, height * 0.63, 165, 165);
  image(candyImg, width * 0.78, height * 0.63, 165, 165);

  fill(230);
  textSize(18);
  text("-1", width * 0.22, height * 0.78);
  text("+1", width * 0.78, height * 0.78);

  push();
  translate(width / 2, height * 0.60);

  let floatSpeed = 2.3;
  let floatAmount = 6;

  if (score >= 3) {
    floatSpeed = 4.5;
    floatAmount = 13;
  } else if (score <= -3) {
    floatSpeed = 1.1;
    floatAmount = 3;
  }

  let floatY = sin(frameCount * floatSpeed) * floatAmount;
  translate(0, floatY);

  noStroke();
  if (score > 0) {
    fill(255, 210, 120, 45);
  } else if (score < 0) {
    fill(160, 220, 160, 35);
  } else {
    fill(255, 255, 255, 25);
  }
  ellipse(0, 0, ghostSize + 55, ghostSize + 55);

  rotate(ghostRotation);
  image(ghostImg, 0, 0, ghostSize, ghostSize);
  pop();

  if (feedbackTimer > 0) {
    fill(255, 230, 120);
    textSize(28);
    text(feedback, width / 2, height - 108);
    feedbackTimer--;
  }

  if (!gameStarted) {
    drawStartOverlay();
  }

  if (gameOver) {
    drawResultOverlay();
  }
}

function drawStartOverlay() {
  push();
  noStroke();
  fill(8, 8, 30, 170);
  rect(0, 0, width, height);

  fill(255);
  textSize(32);
  text("Ready to feed the ghost?", width / 2, height * 0.33);

  fill(230);
  textSize(18);
  text("Candy = +1 and bigger", width / 2, height * 0.41);
  text("Broccoli = -1 and smaller", width / 2, height * 0.46);

  fill(255, 240, 180);
  textSize(20);
  text("Reach +5 to win. Drop to -5 and you lose.", width / 2, height * 0.54);

  fill(220);
  textSize(16);
  text("Press Start to begin", width / 2, height * 0.62);
  pop();
}

function drawResultOverlay() {
  push();
  noStroke();
  fill(8, 8, 30, 165);
  rect(0, 0, width, height);

  if (gameResult === "YOU WIN!") {
    fill(140, 255, 180);
  } else {
    fill(255, 170, 170);
  }

  textSize(44);
  text(gameResult, width / 2, height * 0.34);

  fill(255);
  textSize(20);

  if (gameResult === "YOU WIN!") {
    text("The ghost got enough candy!", width / 2, height * 0.43);
  } else if (gameResult === "YOU LOSE!") {
    text("Too much broccoli for one ghost.", width / 2, height * 0.43);
  } else if (gameResult === "TIME'S UP") {
    text("Time ran out before reaching +5.", width / 2, height * 0.43);
  }

  fill(230);
  textSize(18);
  text("Final Score: " + score, width / 2, height * 0.50);
  text("Press Start to play again", width / 2, height * 0.58);
  pop();
}

function keyPressed() {
  if (key === "a" || key === "A") {
    useSerialRotation = false;
    feedGhost("broccoli");
  }

  if (key === "d" || key === "D") {
    useSerialRotation = false;
    feedGhost("candy");
  }

  if (keyCode === LEFT_ARROW) {
    useSerialRotation = false;
    if (!gameOver) targetRotation -= 25;
  }

  if (keyCode === RIGHT_ARROW) {
    useSerialRotation = false;
    if (!gameOver) targetRotation += 25;
  }

  // optional hidden serial connect
  if (key === "p" || key === "P") {
    openPort();
  }
}

function openPort() {
  port.open(9600);
}