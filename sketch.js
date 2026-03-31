let port;

// Web control
let broccoliBtn;
let candyBtn;
let rotateLeftBtn;
let rotateRightBtn;
let startBtn;
let portButton;

let score = 0;
let gameStarted = false;
let gameOver = false;
let gameResult = "";

// Timer
let gameDuration = 30; // seconds
let startTime = 0;
let timeLeft = 30;

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

  port = createSerial();

  portButton = createButton("choose port");
  portButton.position(16, 16);
  portButton.size(80, 24);
  portButton.mousePressed(openPort);

  startBtn = createButton("Start / Restart");
  startBtn.position(16, 60);
  startBtn.size(95, 24);
  startBtn.mousePressed(startGame);

  broccoliBtn = createButton("Broccoli");
  broccoliBtn.position(16, 96);
  broccoliBtn.size(72, 24);
  broccoliBtn.mousePressed(() => {
    useSerialRotation = false;
    feedGhost("broccoli");
  });

  candyBtn = createButton("Candy");
  candyBtn.position(16, 132);
  candyBtn.size(72, 24);
  candyBtn.mousePressed(() => {
    useSerialRotation = false;
    feedGhost("candy");
  });

  rotateLeftBtn = createButton("Rotate L");
  rotateLeftBtn.position(16, 168);
  rotateLeftBtn.size(72, 24);
  rotateLeftBtn.mousePressed(() => {
    useSerialRotation = false;
    if (!gameOver) targetRotation -= 25;
  });

  rotateRightBtn = createButton("Rotate R");
  rotateRightBtn.position(16, 204);
  rotateRightBtn.size(72, 24);
  rotateRightBtn.mousePressed(() => {
    useSerialRotation = false;
    if (!gameOver) targetRotation += 25;
  });
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
  feedback = "Game started!";
  feedbackTimer = 45;
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
    targetSize = 150;
    feedback = "Eww! Broccoli!";
  } else if (food === "candy") {
    score++;
    targetSize = 250;
    feedback = "Yum! Candy!";
  }

  targetSize = constrain(targetSize, 120, 300);
  feedbackTimer = 40;
}

function draw() {
  background(15, 15, 45);

  readSerialSafe();
  updateButtonsWithDebounce();

  if (gameStarted && !gameOver) {
    timeLeft = max(0, gameDuration - floor((millis() - startTime) / 1000));

    if (score >= 5) {
      gameOver = true;
      gameResult = "YOU WIN!";
      feedback = "The ghost is so happy!";
      feedbackTimer = 80;
    } else if (score <= -3) {
      gameOver = true;
      gameResult = "GAME OVER";
      feedback = "Too much broccoli!";
      feedbackTimer = 80;
    } else if (timeLeft === 0) {
      gameOver = true;
      if (score >= 5) {
        gameResult = "YOU WIN!";
        feedback = "Perfect timing!";
      } else {
        gameResult = "TIME'S UP";
        feedback = "Try feeding more candy!";
      }
      feedbackTimer = 80;
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

  // Arduino button input
  if (!gameOver && buttonPressedLeft()) {
    gameStarted = true;
    if (startTime === 0) startTime = millis();
    feedGhost("broccoli");
  }

  if (!gameOver && buttonPressedRight()) {
    gameStarted = true;
    if (startTime === 0) startTime = millis();
    feedGhost("candy");
  }

  drawScene();
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
  textSize(34);
  text("Feed The Ghost", width / 2, 50);

  fill(230);
  textSize(16);
  text("Candy makes the ghost happy. Broccoli makes it sad.", width / 2, 82);

  fill(210);
  textSize(14);
  text("A = Broccoli    D = Candy    ← → = Rotate", width / 2, 104);

  fill(255);
  textSize(18);
  text("Score: " + score, width / 2, 132);

  if (gameStarted) {
    fill(255);
    textSize(18);
    text("Time: " + timeLeft, width / 2, 158);
  } else {
    fill(255);
    textSize(18);
    text("Goal: Reach 5 points in 30 seconds", width / 2, 158);
  }

  image(broccoliImg, width * 0.2, height * 0.60, 170, 170);
  image(candyImg, width * 0.8, height * 0.60, 170, 170);

  push();
  translate(width / 2, height * 0.60);

  // ghost mood through floating motion
  let floatSpeed = 2;
  let floatAmount = 6;

  if (score >= 3) {
    floatSpeed = 4;
    floatAmount = 12;
  } else if (score <= -2) {
    floatSpeed = 1.2;
    floatAmount = 3;
  }

  let floatY = sin(frameCount * floatSpeed) * floatAmount;
  translate(0, floatY);

  rotate(ghostRotation);
  image(ghostImg, 0, 0, ghostSize, ghostSize);
  pop();

  if (feedbackTimer > 0) {
    fill(255, 230, 120);
    textSize(28);
    text(feedback, width / 2, height - 48);
    feedbackTimer--;
  }

  if (gameOver) {
    fill(255);
    textSize(36);

    if (gameResult === "YOU WIN!") {
      fill(140, 255, 180);
    } else {
      fill(255, 160, 160);
    }

    text(gameResult, width / 2, height * 0.28);

    fill(255);
    textSize(18);

    if (gameResult === "YOU WIN!") {
      text("The ghost got enough candy!", width / 2, height * 0.28 + 34);
    } else if (gameResult === "GAME OVER") {
      text("Too much broccoli for the ghost.", width / 2, height * 0.28 + 34);
    } else if (gameResult === "TIME'S UP") {
      text("Try again and feed more candy.", width / 2, height * 0.28 + 34);
    }
  }

  fill(180);
  textSize(12);
  text(
    `left raw: ${leftButton}   right raw: ${rightButton}   left stable: ${stableLeft}   right stable: ${stableRight}   pot: ${potValue}`,
    width / 2,
    height - 16
  );
}

function openPort() {
  port.open(9600);
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
}