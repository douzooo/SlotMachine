//Vars

var overlayElement = document.getElementById("overlay")
var spinButton = document.getElementById("spinButton")

const REEL_WIDTH = 172;
const SYMBOL_SIZE = 172;


//PIXI GAME
const app = new PIXI.Application({
    background: '#1d1d1d',
    resizeTo: document.getElementById("game"),
    view: document.getElementById("game")
});

document.getElementById("container").appendChild(app.view);

/***
 * Loading Screen
 */
const loadingContainer = new PIXI.Container();
const fillBackground = new PIXI.Graphics();
const progressBarOutline = new PIXI.Graphics();
const progressBar = new PIXI.Graphics();
progressBar.beginFill(0xff1111);
progressBar.drawRect(0, 0, 0.5, 30);
fillBackground.beginFill(0x1d1d1d)
fillBackground.drawRect(0, 0, app.screen.width, app.screen.height)
progressBarOutline.lineStyle(3, 0xFFFFFF);
progressBarOutline.drawRect(0, 0, 300, 30);
const progressBarX = (app.screen.width - progressBarOutline.width) / 2;
const progressBarY = (app.screen.height - progressBarOutline.height) / 2;
const progressBarOutlineX = progressBarX;
const progressBarOutlineY = progressBarY;
progressBar.position.set(progressBarX, progressBarY);
progressBarOutline.position.set(progressBarOutlineX, progressBarOutlineY);
loadingContainer.addChild(fillBackground, progressBar, progressBarOutline);
app.stage.addChild(loadingContainer)
//--------------------------

/**
 * Load the assets
 */
PIXI.Assets.load([
    './assets/Carrot.png',
    './assets/Salad.png',
    './assets/Apple.png',
    'https://pixijs.com/assets/flowerTop.png',
    'https://pixijs.com/assets/helmlok.png',
    'https://pixijs.com/assets/skully.png',
    './assets/bg.png',
    './assets/Container.png'
], (i) => {
    progressBar.width = 300 * i;
}).then(run);


let background, container, running = false;

function run() {


    const slotTextures = [
        PIXI.Texture.from('./assets/Carrot.png'),
        PIXI.Texture.from('./assets/Salad.png'),
        PIXI.Texture.from('./assets/Apple.png'),
        PIXI.Texture.from('https://pixijs.com/assets/skully.png'),
    ];

    app.stage.removeChild(loadingContainer);
    overlayElement.style.display = "block";
    console.log("loaded");

    // Init Scene
    const backgroundTexture = PIXI.Texture.from("./assets/bg.png");
    const containerTexture = PIXI.Texture.from("./assets/Container.png");
    background = new PIXI.Sprite(backgroundTexture);
    container = new PIXI.Container();

    // Add container background
    const containerBackground = new PIXI.Sprite(containerTexture);
    container.addChildAt(containerBackground, 0);
    container.x = (app.screen.width - container.width) / 2;
    container.y = (app.screen.height - container.height) / 2;

    const reels = [];
    const reelContainer = new PIXI.Container();

    reelContainer.y += 40
    reelContainer.x += 72

    for (let i = 0; i < 5; i++) {
        const rc = new PIXI.Container();

        rc.x = i * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel = {
            container: rc,
            symbols: [],
            position: 0,
            previousPosition: 0,
            blur: new PIXI.filters.BlurFilter(),
        };

        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [reel.blur];

        // Build the symbols
        for (let j = 0; j < 4; j++) {
            const symbol = new PIXI.Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
            // Scale the symbol to fit symbol area.

            symbol.y = j * SYMBOL_SIZE;
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
            reel.symbols.push(symbol);
            rc.addChild(symbol);
        }
        reels.push(reel);
    }

    container.addChild(reelContainer);

    const mask = new PIXI.Graphics();
    mask.beginFill(0, 1);

    mask.drawRect(0, 200,app.screen.width,540);

    // reelContainer.mask = mask;



    function startPlay() {
        if (running) return;
        running = true;

        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const target = r.position + 10 + i * 5;
            const time = 2500 + i * 600  ;

            tweenTo(r, 'position', target, time, backout(0.2), null, i === reels.length - 1 ? reelsComplete : null);
        }
    }

    // Reels done handler.
    function reelsComplete() {
        running = false;
        count = 0;
    }

    var count = 0;

    var setsymbols = [
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ]

    // Listen for animate update.
    app.ticker.add((delta) => {



        // Update the slots.
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            // Update blur filter y amount based on speed.
            // This would be better if calculated with time in mind also. Now blur depends on frame rate.

            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

            // Update symbol positions on reel.
            for (let j = 0; j < r.symbols.length; j++) {
                const s = r.symbols[j];
                const prevy = s.y;
                
                s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                if (s.y < 0 && prevy > SYMBOL_SIZE) {
                    count++;
                    // Detect going over and swap a texture.
                    // This should in proper product be determined from some logical reel.
                    if(count >= 53 + (1 * i)){
                        
                        console.log("Reel: " + i + " Symbol: " + j)
                        console.log(count)
                        s.texture = slotTextures[setsymbols[i][j]];
                        s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                        s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                        if(i = 4 && j == 3) break;
                    }
               }
            }
        }
    });

    resize();
    app.stage.addChildAt(background, 0);
    app.stage.addChild(container);

    // Events
    window.addEventListener("resize", resize);
    spinButton.addEventListener("click", () => {
        startPlay()
        spinButton.disabled = true;

        // Simulate spinning reels (replace with actual logic)
        setTimeout(() => {
            spinButton.disabled = false;
        }, 3000);
    });
}




function resize() {
    console.log("resize");

    // Check if the application is set to resize to the container
    if (app.resizeTo) {
        app.renderer.resize(app.resizeTo.clientWidth, app.resizeTo.clientHeight);
    }


    background.width = app.renderer.view.width;
    background.height = app.renderer.view.height;



    // Calculate the desired height of the container (70% of the screen height)
    const containerHeight = app.renderer.view.height * 0.7;

    // Calculate the corresponding width to maintain proportions
    const containerWidth = (containerHeight / container.height) * container.width;

    // Set the container size and position after resize
    container.width = containerWidth;
    container.height = containerHeight;
    container.x = (app.screen.width - container.width) / 2;
    container.y = (app.screen.height - container.height) / 2;

    // Recalculate the positions of the progress bar and outline
    progressBar.position.set((app.screen.width - progressBarOutline.width) / 2, (app.screen.height - progressBarOutline.height) / 2);
    progressBarOutline.position.set((app.screen.width - progressBarOutline.width) / 2, (app.screen.height - progressBarOutline.height) / 2);
}


const tweening = [];

function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };

    tweening.push(tween);

    return tween;
}
// Listen for animate update.
app.ticker.add((delta) => {
    const now = Date.now();
    const remove = [];

    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }
});

// Basic lerp funtion.
function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
function backout(amount) {
    return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}
