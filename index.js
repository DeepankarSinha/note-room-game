var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 450;
var FPS = 60;

var upKeyDown = false;
var downKeyDown = false;
var leftKeyDown = false;
var rightKeyDown = false;
var spaceKeyDown = false;

var enemiesStarterPack = [
    [4, 4, 1]
];

var gameLoop = null;
var notes = [];
var enemies = [];
var level = 0;
var maxLevel = 0;
var code = 'CODE';
var isNoteShowing = false;
var isGameOver = false;
var isVictorious = false;
var videoUrl = '';


fetch("notes.json")
  .then(response => response.json())
  .then(json => notes = json.notes)
  .then(() => { 
    maxLevel = notes.length;      
    start(); 
});

var cyclops = new Image();
var noteSvg = new Image();
cyclops.src = 'cyclops.svg';
noteSvg.src = 'notes.svg';

// Setup the canvas.
var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                      "' height='" + CANVAS_HEIGHT + "'></canvas>" +
                      "<p style='color: white; text-align: center;'>Use arrow keys or WASD to move. Space bar to attack.</p>");
var canvas = canvasElement.get(0).getContext("2d");
canvasElement.appendTo('body');

// Characters and entities.
var player = {
    color: "#fff",
    x: 400,
    y: 400,
    width: 16,
    height: 16,
    speed: 5,
    attackRadius: 0,
    maxAttackRadius: 96,
    isAttacking: false,
    attackMeter: 10,
    maxAttackMeter: 10,

    draw: function() {  
        canvas.fillStyle = '#000';
        canvas.font = '20px sans-serif';
        canvas.fillRect(this.x, this.y, this.width, this.height);
        canvas.fillStyle = this.color;

        if(enemies.length > 4)
            canvas.fillText('😨', this.x - 3, this.y + 13);
        else if(enemies.length > 3)
            canvas.fillText('😲', this.x - 3, this.y + 13);
        else if(enemies.length > 2)
            canvas.fillText('😥', this.x - 3, this.y + 13);
        else if(enemies.length > 0)
            canvas.fillText('🙁', this.x - 3, this.y + 13);
        else 
            canvas.fillText('😃', this.x - 3, this.y + 13);

        canvas.beginPath();
        canvas.setLineDash([5, 3]);
        canvas.arc(this.x + this.width/2, this.y + this.height/2, this.attackRadius, 0, 2 * Math.PI, false);
        canvas.lineWidth = 3;
        canvas.strokeStyle = '#e81ab4';
        canvas.stroke();
        canvas.setLineDash([]);

        // Attack meter.
        canvas.beginPath();
        canvas.fillStyle = this.color;
        canvas.fillRect(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.05, 10*this.attackMeter, 15);

        // Attack meter box.
        canvas.beginPath();
        canvas.strokeRect(CANVAS_WIDTH * 0.8 - 2, CANVAS_HEIGHT * 0.045, 10*this.maxAttackMeter+5, 20);
        canvas.strokeStyle = this.color;
        canvas.stroke();
    },
    update: function() {
        this.attackMeter += this.attackMeter >= this.maxAttackMeter ? 0 : this.maxAttackMeter/(2*FPS);
    }
};

var levelHUD = {
    leftMargin: Math.round(CANVAS_WIDTH * 0.05),
    topMargin: Math.round(CANVAS_HEIGHT * 0.08),
    color: '#fff',
    draw: function(){
        canvas.fillStyle = this.color;
        canvas.font = '18px sans-serif';
        canvas.fillText(`ROOM ${level}`, this.leftMargin, this.topMargin);
    }
}

var victoryText = {
    leftMargin: CANVAS_WIDTH/2 - 110,
    topMargin: CANVAS_HEIGHT/2 - 20,
    boxMargin: 100,
    color: '#fff',
    draw: function() {
        canvas.fillStyle = '#000';
        canvas.fillRect(this.boxMargin, this.boxMargin, CANVAS_WIDTH - this.boxMargin*2, CANVAS_HEIGHT - this.boxMargin*2);
        canvas.rect(this.boxMargin, this.boxMargin, CANVAS_WIDTH - this.boxMargin*2, CANVAS_HEIGHT - this.boxMargin*2);
        canvas.strokeStyle = this.color;
        canvas.stroke();
        
        canvas.fillStyle = this.color;
        canvas.font = '40px sans-serif';
        canvas.fillText('🥳You did it!', this.leftMargin, this.topMargin);

        canvas.fillStyle = this.color;
        canvas.font = '18px sans-serif';
        canvas.fillText('Congratulations🎉! Please wait for the surprise.🎁😉', this.leftMargin - 70, this.topMargin + 40);
    }
}

var gameOverText = {
    leftMargin: CANVAS_WIDTH/2 - 100,
    topMargin: CANVAS_HEIGHT/2 - 20,
    boxMargin: 100,
    color: '#fff',
    draw: function() {
        canvas.fillStyle = '#000';
        canvas.fillRect(this.boxMargin, this.boxMargin, CANVAS_WIDTH - this.boxMargin*2, CANVAS_HEIGHT - this.boxMargin*2);
        canvas.rect(this.boxMargin, this.boxMargin, CANVAS_WIDTH - this.boxMargin*2, CANVAS_HEIGHT - this.boxMargin*2);
        canvas.strokeStyle = this.color;
        canvas.stroke();

        canvas.fillStyle = this.color;
        canvas.font = '40px sans-serif';
        canvas.fillText('Game Over', this.leftMargin, this.topMargin);

        canvas.fillStyle = this.color;
        canvas.font = '18px sans-serif';
        canvas.fillText('Press enter to retry', this.leftMargin + 30, this.topMargin + 30);
    }
}

var noteEnlarged = {
    margin: 25,
    textMarging: 45,
    color: '#fff',
    draw: function() {
        this.width = noteSvg.width;
        this.height = noteSvg.height;

        canvas.fillStyle = '#000';
        canvas.fillRect(this.margin, this.margin, CANVAS_WIDTH - this.margin*2, CANVAS_HEIGHT - this.margin*2);
        canvas.rect(this.margin, this.margin, CANVAS_WIDTH - this.margin*2, CANVAS_HEIGHT - this.margin*2);
        canvas.strokeStyle = this.color;
        canvas.stroke();

        // canvas.beginPath();
        // canvas.fillStyle = this.color;
        // canvas.font = '20px sans-serif';
        // canvas.fillText(notes[level].note, this.textMarging, this.textMarging, CANVAS_WIDTH - this.textMarging*2);
        // canvas.closePath();

        wrapText(notes[level].note, 
            this.textMarging, 
            this.textMarging, 
            CANVAS_WIDTH - this.textMarging*2,
            'sans-serif',
            notes[level].fontSize || 18 );

        canvas.fillStyle = this.color;
        canvas.font = '48px sans-serif';
        canvas.fillText(code, CANVAS_WIDTH * 0.4, CANVAS_HEIGHT * 0.90);
    }
};

var note = {
    x: CANVAS_WIDTH/2 - noteSvg.width/2,
    y: CANVAS_HEIGHT/2 - noteSvg.height/2,
    width: 0,
    height: 0,
    color: '#fff',
    draw: function() {
        this.width = noteSvg.width;
        this.height = noteSvg.height;

        canvas.drawImage(noteSvg, this.x, this.y);

        canvas.fillStyle = this.color;
        canvas.font = '16px sans-serif';
        canvas.fillText('Touch me to read', this.x - 45, this.y - 20);
    }
};

function EnemyCyclops(I){
    I = I || {};
    I.id = Math.round(Math.random() * 100000);
    I.xMultiplier = Math.random() > 0.5 ? 1 : -1;
    I.yMultiplier = Math.random() > 0.5 ? 1 : -1;;
    I.x = Math.round(Math.random() * (CANVAS_WIDTH - 50));
    I.y = Math.round(Math.random() * 200);
    I.color = "#fff";
    I.radius = 10;
    I.speed = 5;
    I.width = 0;
    I.height = 0;
    I.maxHealth = 1;
    I.health = 1;
    I.damage = 0.2;

    I.draw = function(){
        I.width = cyclops.width;
        I.height = cyclops.width;
 
        canvas.drawImage(cyclops, this.x, this.y);
        canvas.fillStyle = this.color;
        canvas.fill();

        canvas.fillStyle = this.color;
        canvas.fill();
        canvas.fillRect(this.x + 1, this.y - 5, 30/I.maxHealth * I.health, 5);
    }

    I.update = function(){
        I.x += 2 * I.xMultiplier;
        I.y += 2 * I.yMultiplier;

        if(I.x + cyclops.width >= CANVAS_WIDTH || I.x < 0){
            I.xMultiplier *= -1;
        }

        if(I.y + cyclops.height >= CANVAS_HEIGHT || I.y < 0){
            I.yMultiplier *= -1;
        }
        
        if(player.isAttacking){
            var a = I.x - (player.x + player.width/2);
            var a1 = I.x + cyclops.width - (player.x + player.width/2);
            var b = I.y - (player.y + player.height/2);
            var b1 = I.y + cyclops.height - (player.y + player.height/2);

            if(Math.hypot(a, b) <= player.attackRadius
            || Math.hypot(a1, b) <= player.attackRadius
            || Math.hypot(a, b1) <= player.attackRadius
            || Math.hypot(a1, b1) <= player.attackRadius){
                I.health -= I.damage;
            }

            if(I.health <= 0){
                enemies.splice(enemies.findIndex(x => x.id === I.id), 1);
            }
        }
    }

    return I;
}

function EnemyCyclopsFollow(I){
    I = I || {};
    I.id = Math.round(Math.random() * 100000);
    I.xMultiplier = Math.random() > 0.5 ? 1 : -1;
    I.yMultiplier = Math.random() > 0.5 ? 1 : -1;
    I.x = Math.round(Math.random() * (CANVAS_WIDTH - 50));
    I.y = Math.round(Math.random() * 200);
    I.color = "#fff";
    I.radius = 10;
    I.speed = Math.random() * 2 + 2;
    I.width = 0;
    I.height = 0;
    I.exhaust = FPS * 3;
    I.gainEnergy = 0;
    I.maxExhaust = FPS * (Math.random() * 2 + 2);
    I.maxHealth = 3;
    I.health = 3;
    I.damage = 0.2;

    I.draw = function(){
        I.width = cyclops.width;
        I.height = cyclops.width;

        canvas.drawImage(cyclops, this.x, this.y);
        canvas.fillStyle = this.color;
        canvas.fill();

        canvas.fillStyle = this.color;
        canvas.fill();
        canvas.fillRect(this.x + 1, this.y - 5, 30/I.maxHealth * I.health, 5);
    }

    I.update = function(){

        if(I.exhaust <= 0){
            I.x += 2 * I.xMultiplier;
            I.y += 2 * I.yMultiplier;
            I.gainEnergy += Math.random() > 0.5 ? 3 : 0;
        }else{
            var v = [player.x - I.x, player.y - I.y];
            var vNormalized = Math.hypot(v[0], v[1]);
            I.x += v[0]/vNormalized * I.speed;
            I.y += v[1]/vNormalized * I.speed;
            I.exhaust--;
        }

        if(I.gainEnergy >= I.maxExhaust){
            I.exhaust = I.maxExhaust;
            I.gainEnergy = 0;
        }        

        if(I.x + cyclops.width >= CANVAS_WIDTH || I.x < 0){
            I.xMultiplier *= -1;
        }

        if(I.y + cyclops.height >= CANVAS_HEIGHT || I.y < 0){
            I.yMultiplier *= -1;
        }
        
        if(player.isAttacking){
            var a = I.x - (player.x + player.width/2);
            var a1 = I.x + cyclops.width - (player.x + player.width/2);
            var b = I.y - (player.y + player.height/2);
            var b1 = I.y + cyclops.height - (player.y + player.height/2);

            if(Math.hypot(a, b) <= player.attackRadius
            || Math.hypot(a1, b) <= player.attackRadius
            || Math.hypot(a, b1) <= player.attackRadius
            || Math.hypot(a1, b1) <= player.attackRadius){
                I.health -= I.damage;
            }

            if(I.health <= 0){
                enemies.splice(enemies.findIndex(x => x.id === I.id), 1);
            }
        }
    }

    return I;
}

function EnemyQuadLaser(I){
    I = I || {};
    I.id = Math.round(Math.random() * 100000);
    I.xMultiplier = Math.random() > 0.5 ? 1 : -1;
    I.yMultiplier = Math.random() > 0.5 ? 1 : -1;
    I.x = CANVAS_WIDTH/2; //Math.round(Math.random() * (CANVAS_WIDTH - 50));
    I.y = CANVAS_HEIGHT/2; //Math.round(Math.random() * 200);
    I.color = "#fff";
    I.r = 1000;
    I.theta = 45;
    I.width = 0;
    I.height = 0;
    I.rotSpeed = 0.3;
    I.coolDownTime = FPS * 5;
    I.time = 0,
    I.isFiring = false,
    I.timeModifier = 0,
    I.showdash = false,
    I.isQuadLaser = true,

    I.draw = function() {
        canvas.save();
        canvas.fillRect(I.x-10, I.y-5, 20, 10);
        canvas.translate(I.x, I.y);
        canvas.rotate((Math.PI / 180) * I.theta);
        canvas.translate(-I.x, -I.y);
        canvas.restore();

        if(I.isFiring || (I.showdash && I.time % FPS <= 30) ){
            canvas.beginPath();
            I.showdash ? canvas.setLineDash([1, 3]) : canvas.setLineDash([]);
            canvas.moveTo(I.x, I.y);
            canvas.lineTo(I.x + I.r * Math.cos(Math.PI * I.theta / 180.0), I.y + I.r * Math.sin(Math.PI * I.theta / 180.0));
            canvas.strokeStyle = this.color;
            canvas.stroke();
            
            canvas.beginPath();
            I.showdash ? canvas.setLineDash([1, 3]) : canvas.setLineDash([]);
            canvas.moveTo(I.x, I.y);
            canvas.lineTo(I.x + I.r * Math.cos(Math.PI * (180 + I.theta) / 180.0), I.y + I.r * Math.sin(Math.PI * (180 + I.theta) / 180.0));
            canvas.strokeStyle = this.color;
            canvas.stroke();

            canvas.beginPath();
            I.showdash ? canvas.setLineDash([1, 3]) : canvas.setLineDash([]);
            canvas.moveTo(I.x, I.y);
            canvas.lineTo(I.x + I.r * Math.cos(Math.PI * (90 + I.theta) / 180.0), I.y + I.r * Math.sin(Math.PI * (90 + I.theta) / 180.0));
            canvas.strokeStyle = this.color;
            canvas.stroke();

            canvas.beginPath();
            I.showdash ? canvas.setLineDash([1, 3]) : canvas.setLineDash([]);
            canvas.moveTo(I.x, I.y);
            canvas.lineTo(I.x + I.r * Math.cos(Math.PI * (270 + I.theta) / 180.0), I.y + I.r * Math.sin(Math.PI * (270 + I.theta) / 180.0));
            canvas.strokeStyle = this.color;
            canvas.stroke();
        }
    }

    I.update = function(){
        I.theta += I.rotSpeed;

        if(I.time <= 0){
            I.isFiring = true;
            I.timeModifier = 2;
        }else if(I.time >= I.coolDownTime){
            I.isFiring = false;
            I.timeModifier = -1;
        }

        I.time += I.timeModifier;

        I.showdash = !I.isFiring && I.time < FPS * 3 && I.timeModifier < 0;

        const line1 = lineRectCollide(I.x, 
            I.y, 
            I.x + I.r * Math.cos(Math.PI * I.theta / 180.0), 
            I.y + I.r * Math.sin(Math.PI * I.theta / 180.0), 
            player.x,
            player.y,
            player.width,
            player.height);
        const line2 = lineRectCollide(I.x, 
            I.y, 
            I.x + I.r * Math.cos(Math.PI * (180 + I.theta) / 180.0), 
            I.y + I.r * Math.sin(Math.PI * (180 + I.theta) / 180.0), 
            player.x,
            player.y,
            player.width,
            player.height);
        const line3 = lineRectCollide(I.x, 
            I.y, 
            I.x + I.r * Math.cos(Math.PI * (90 + I.theta) / 180.0), 
            I.y + I.r * Math.sin(Math.PI * (90 + I.theta) / 180.0), 
            player.x,
            player.y,
            player.width,
            player.height);
        const line4 = lineRectCollide(I.x, 
            I.y, 
            I.x + I.r * Math.cos(Math.PI * (270 + I.theta) / 180.0), 
            I.y + I.r * Math.sin(Math.PI * (270 + I.theta) / 180.0), 
            player.x,
            player.y,
            player.width,
            player.height); 

        if(line1 || line2 || line3 || line4 ){
            isGameOver = I.isFiring;
        }
    }

    return I;
}

// Setup keyboard controls.
$(document).keydown(function(e){
    if(e.key == "Right" || e.key == "ArrowRight" || e.key == "d"){
        rightKeyDown = true;
    }
    if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "a"){
        leftKeyDown = true;
    }
    if(e.key == "Up" || e.key == "ArrowUp" || e.key == "w"){
        upKeyDown = true;
    }
    if(e.key == "Down" || e.key == "ArrowDown" || e.key == "s"){
        downKeyDown = true;
    }
    if(e.key == " " ){
        spaceKeyDown = true;
    }
    if(e.key == "Enter"){
        clearInterval(gameLoop);
        isGameOver = false;
        start();
    }
});

$(document).keyup(function(e){
    if(e.key == "Right" || e.key == "ArrowRight" || e.key == "d"){
        rightKeyDown = false;
    }
    if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "a"){
        leftKeyDown = false;
    }
    if(e.key == "Up" || e.key == "ArrowUp" || e.key == "w"){
        upKeyDown = false;
    }
    if(e.key == "Down" || e.key == "ArrowDown" || e.key == "s"){
        downKeyDown = false;
    }    
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) { 
        code += e.key;
        code = code.slice(1);
    }
});

// Text to paragraph
function wrapText(text, x, y, maxWidth, fontFace, fontSize = 18){
    var words = text.split(' ');
    var line = '';
    var lineHeight=16*1.286; // a good approx for 10-18px sizes

    canvas.font=`${fontSize}px ${fontFace}`;
    canvas.textBaseline='top';
    canvas.fillStyle = '#fff';

    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = canvas.measureText(testLine);
        var testWidth = metrics.width;
        if(testWidth > maxWidth) {
            canvas.fillText(line, x, y);
            if(n<words.length-1){
                line = words[n] + ' ';
                y += lineHeight;
            }
        }
        else {
            line = testLine;
        }
    }
    canvas.fillText(line, x, y);
    canvas.textBaseline = 'alphabetic';
}

// Collision detection.
function isCollided(rect1, rect2){
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y) {
            return true;
    }

    return false;
}

function lineCollide(x1, y1, x2, y2, x3, y3, x4, y4){
    const uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    const uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true
    }

    return false;
}

function lineRectCollide(x1, y1, x2, y2, rx, ry, rw, rh){
    const left =   lineCollide(x1,y1,x2,y2, rx,ry,rx, ry+rh);
    const right =  lineCollide(x1,y1,x2,y2, rx+rw,ry, rx+rw,ry+rh);
    const top =    lineCollide(x1,y1,x2,y2, rx,ry, rx+rw,ry);
    const bottom = lineCollide(x1,y1,x2,y2, rx,ry+rh, rx+rw,ry+rh);

    if (left || right || top || bottom) {
        return true;
    }
    return false;
}

// Initialize game loop.

function selectEnemies(){
    const enemySelection = enemiesStarterPack[level];
    enemies = [];

    if(!enemySelection){
        return [];
    }

    if(enemiesStarterPack.length <= level){
        enemySelection = enemiesStarterPack[enemiesStarterPack.length - 1];
    }

    for(var i = 0; i < enemySelection[0]; i++){
        var e = EnemyCyclops();
        e.speed = Math.random() * 4 + 1;
        e.damage = Math.random() + 0.1;
        enemies.push(e);
    }

    for(var i = 0; i < enemySelection[1]; i++){
        var e = EnemyCyclopsFollow();
        e.speed = Math.random() * 3 + 2;
        e.damage = Math.random() + 0.1;
        enemies.push(e);
    }

    for(var i = 0; i < enemySelection[2]; i++){
        var e = EnemyQuadLaser();
        enemies.push(e);
    }
}

function start(){

    selectEnemies();

    if(level >= maxLevel){
        isVictorious = true;
    }

    canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if(gameLoop > -1){
        clearInterval(gameLoop);
    }

    player.x = 400;
    player.y = 400;

    gameLoop = setInterval(function() {
        update();
        draw();
    }, 1000/FPS);
}

var skipDraw = false;
function update() {
    movePlayer();
    attack();
    player.update();

    // Enemy movement.
    enemies.forEach(e => {
        e.update();
    });

    if(isNoteShowing){
        var jumpLevel = notes.findIndex(x => x.code === code);
        if(jumpLevel >= 0)
        {
            console.log('Code matched.');
            level = jumpLevel + 1;
            code = 'CODE';
            skipDraw = true;
            // Start next level.
            //start();
        }
    }
}

function draw() {
    if(skipDraw){
        skipDraw = false;
        start();
        return;
    }

    canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    levelHUD.draw();
    
    if(isVictorious){
        victoryText.draw();

        setTimeout(() => {
            location.href = videoUrl;
        }, 5000);

        clearInterval(gameLoop);

        return;
    }

    if(isGameOver){
        gameOverText.draw();
        return;
    }
    
    for(var i = 0; i < enemies.length; i++){
        enemies[i].draw();

        isGameOver = isCollided(enemies[i], player);

        if(isGameOver){
            break;
        }
    }

    player.draw();

    if(enemies.length === 1 && enemies[0].isQuadLaser){
        enemies.pop();
    }

    if(enemies.length === 0){
        note.draw();
        
        isNoteShowing = isCollided(note, player);
        
        if(isNoteShowing){
            noteEnlarged.draw();
        }
    }
}

function movePlayer(){
    if (upKeyDown) {
        player.y -= player.speed;
        if(player.y < 0){
            player.y = 0;
        }
    }

    if (downKeyDown) {
        player.y += player.speed;
        if(player.y + player.height > CANVAS_HEIGHT){
            player.y = CANVAS_HEIGHT - player.height;
        }
    }

    if (leftKeyDown) {
        player.x -= player.speed;
        if(player.x < 0){
            player.x = 0;
        }
    }

    if (rightKeyDown) {
        player.x += player.speed;
        if(player.x + player.width > CANVAS_WIDTH){
            player.x = CANVAS_WIDTH - player.width;
        }
    }
}

function attack(){
    player.isAttacking = spaceKeyDown;
    if(spaceKeyDown && player.attackMeter >= 3){
        player.attackRadius += 10;

        if(player.attackRadius > player.maxAttackRadius){
            player.attackRadius = 0;
            player.attackMeter -= player.attackMeter - 3 <= 0 ? 0 : 3;
            spaceKeyDown = false;
        }
    }else{
        player.attackRadius = 0;
        spaceKeyDown = false;
    }
}