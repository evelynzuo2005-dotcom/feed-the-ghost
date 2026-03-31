let port;
let portButton;

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

//size
let ghostSize = 200;
let targetSize = 200;

// Ghost rotation variables
let ghostRotation = 0;
let smoothPot = 0;
let targetRotation = 0;

// Images
let broccoliImg;
let candyImg;
let ghostImg;

// Feedback text displayed on screen
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
  portButton.position(20, 20);
  portButton.mousePressed(openPort);
}

function draw() {
  background(15, 15, 45);

  readSerialSafe();
  updateButtonsWithDebounce();

  smoothPot = lerp(smoothPot, potValue, 0.08);
  targetRotation = map(smoothPot, 0, 1023, -180, 180);
  ghostRotation = lerp(ghostRotation, targetRotation, 0.12);

  ghostSize = lerp(ghostSize, targetSize, 0.12);

   // If the left button is pressed
  // the ghost becomes smaller broccoli one
  if (buttonPressedLeft()) {
    targetSize -= 20;
    targetSize = constrain(targetSize, 100, 340);
    feedback = "Eww! Broccoli!";
    feedbackTimer = 40;
  }

  // If the right button is pressed
  // the ghost becomes bigger candy one
  if (buttonPressedRight()) {
    targetSize += 20;
    targetSize = constrain(targetSize, 100, 340);
    feedback = "Yum! Candy!";
    feedbackTimer = 40;
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
  text("Feed The Ghost", width / 2, 55);

  textSize(18);
  fill(230);
  text("Left Button = Broccoli", width * 0.2, 105);
  text("Knob = Rotate Ghost", width / 2, 105);
  text("Right Button = Candy", width * 0.8, 105);

  image(broccoliImg, width * 0.2, height * 0.58, 170, 170);
  image(candyImg, width * 0.8, height * 0.58, 170, 170);

  push();
  translate(width / 2, height * 0.58);

  let floatY = sin(frameCount * 2) * 6;
  translate(0, floatY);

  rotate(ghostRotation);
  image(ghostImg, 0, 0, ghostSize, ghostSize);
  pop();

   // Display feedback text
  if (feedbackTimer > 0) {
    fill(255, 230, 120);
    textSize(30);
    text(feedback, width / 2, height - 42);
    feedbackTimer--;
  }

  fill(200);
  textSize(14);
  text(
    `left raw: ${leftButton}   right raw: ${rightButton}   left stable: ${stableLeft}   right stable: ${stableRight}   pot: ${potValue}`,
    width / 2,
    height - 15
  );
}

function openPort() {
  port.open(9600);
}