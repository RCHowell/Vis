// Global Variables
let FPS: number = 60;
let CUTOFF: number = 140; // Cutoff Level For Changing Colors
let DATA_LEN: number = 64; // Number Of Circles To Draw
let CHANGE_LOC: number = 5; // Frequency To Watch For Changing Palette
let controller: MainController;
let n = <any>navigator;

$(document).ready(function () {
  // Relies On Users Having Chrome (for now)
  n.getUserMedia = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia || n.msGetUserMedia;
  if (n.getUserMedia) {
    n.getUserMedia({audio: true}, function(stream: any) {

        let colorController = new ColorController();
        let vis = new Vis(colorController.colors);
      
        controller = new MainController(
          new AudioController(stream),
          colorController,
          vis
        );
      
        loop();

    },
    function(err: any) {
      console.log(err.name);
    });
  };
});



// AudioController
// Contains microphone stream and relevant audio components
class AudioController {

    public analyzer: any;
    private microphone: any;
    private context: any;
    private element: any;

    constructor(stream: any) {
        // Initialize Analyzer With Microphone Stream
        this.context = new AudioContext();
        this.analyzer = this.context.createAnalyser();
        this.microphone = this.context.createMediaStreamSource(stream);
        this.microphone.connect(this.analyzer);
        this.analyzer.fftSize = DATA_LEN;
    }
}

// Main Controller
// Controller for Audio, Visualizer, and Color interaction
class MainController {
    
    private audio: AudioController;
    private color: ColorController;
    private vis: Vis;

    // Keep Track of Frames and Draw Visualizer
    private now: number;
    private then: number;
    private static interval = 1000 / FPS;
    private delta: number;

    constructor(audio: AudioController, color: ColorController, vis: Vis) {
        this.audio = audio;
        this.color = color;
        this.vis = vis;
        this.connectButton();
    }

    connectButton(): void {
        $('#color-button').click(function() {
            this.color.change();
            this.vis.updateColor(this.color.colors);
        }.bind(this)); // Bind Must Be Used So That Change Can Be Called
    }

    update(): void {
        this.vis.update(this.audio);

        // Start Change Color Rules
        // Essentially This Changes The Palette At A Peak In Intensity
        if (this.vis.frequencyData[CHANGE_LOC] > CUTOFF && this.color.shouldChange) {
            this.color.change();
            this.vis.updateColor(this.color.colors);
            this.color.shouldChange = false;
        }
        if (this.vis.frequencyData[5] < CUTOFF) this.color.shouldChange = true;
        // End Change Color Rules
    }

    loop(): void {
        requestAnimationFrame(this.loop);
        this.now = Date.now();
        this.delta = this.now - this.then;
        if (this.delta > MainController.interval) {
            this.then = this.now - (this.delta % MainController.interval);
            this.update();
        }
    }
}

// ColorController
// Contains palette switching logic
class ColorController {

    // Five Palettes For Now, But The Code Allows For However Many
    // Note: Palettes Do Not Have To Be Of Length Five
    private static palettes = [
        ["#71A7FE", "#399AE7", "#3B407C", "#547AB1", "#CEAFC0"],
        ["#EFBC9B", "#EE92C2", "#9D6A89", "#725D68", "#A8B4A5"],
        ["#48639C", "#4C4C9D", "#712F79", "#976391", "#F7996E"],
        ["#310A31", "#847996", "#88B7B5", "#A7CAB1", "#F4ECD6"],
        ["#2D728F", "#3B8EA5", "#F5EE9E", "#F49E4C", "#AB3428"]
    ];
    public colors: string[];
    private background: any;
    private count: number;
    public shouldChange: boolean;
    
    constructor() {
        this.shouldChange = false;
        this.background = $('body');
        this.change();
    }

    change(): void {
        let random = Math.floor(Math.random() * ColorController.palettes.length);
        this.colors = ColorController.palettes[random];
        // New Random For Changing Background Color
        random = Math.floor(Math.random() * this.colors.length);
        this.background.css("background", this.colors[random]);
    }

    randomColor(): string {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }
}

// Visualizer class
class Vis {

    public frequencyData: Uint8Array;
    private static container = '#container';
    private static height = $(Vis.container).height();
    private static width = $(Vis.container).width();
    private svg: any;
    private circles: any[];

    constructor(colors: string[]) {
        this.svg = d3.select(Vis.container)
            .append('svg')
            .attr('height', Vis.height)
            .attr('width', Vis.width);
        this.frequencyData = new Uint8Array(DATA_LEN);
        this.circles = new Array(this.frequencyData.length);
        this.generateCircles(colors);
    }

    generateCircles(colors: string[]): void {
        for (let i = this.frequencyData.length - 1; i >= 0; i--) {
            let random = Math.floor(Math.random() * colors.length);
            this.circles[i] = this.svg.append('circle')
                .attr('cx', Vis.width / 2)
                .attr('cy', Vis.height / 2)
                .attr('r', this.frequencyData[i])
                .style('fill', colors[random]);
        }
    }

    updateColor(colors: string[]): void {
        for (let i = 0; i < this.circles.length; i++) {
            let random = Math.floor(Math.random() * colors.length);
            this.circles[i].style("fill", colors[random]);
      }
    }

    update(audio: AudioController): void {
        audio.analyzer.getByteFrequencyData(this.frequencyData);
        this.draw();
    }

    draw(): void {
        for (let i = 0; i < this.circles.length; i++) {
            // ((i / 10) + 1) is used to make the circles larger
            // I tried some combinations and found this to fill the screen nicely
            this.circles[i].attr('r', ((i / 10) + 1) * this.frequencyData[i]);
        }
    }
}

// Keep Track of Frames and Draw Visualizer
let now: number;
let then = Date.now();
let interval = 1000 / FPS;
let delta: number;

// Loops at Designated FPS
function loop() {
  requestAnimationFrame(loop);
  now = Date.now();
  delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    // Here's Where Stuff Happens
    controller.update();
  }
}
