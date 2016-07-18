var FPS = 60;
var CUTOFF = 140;
var DATA_LEN = 64;
var CHANGE_LOC = 5;
var controller;
var n = navigator;
$(document).ready(function () {
    n.getUserMedia = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia || n.msGetUserMedia;
    if (n.getUserMedia) {
        n.getUserMedia({ audio: true }, function (stream) {
            var colorController = new ColorController();
            var vis = new Vis(colorController.colors);
            controller = new MainController(new AudioController(stream), colorController, vis);
            loop();
        }, function (err) {
            console.log(err.name);
        });
    }
    ;
});
var AudioController = (function () {
    function AudioController(stream) {
        this.context = new AudioContext();
        this.analyzer = this.context.createAnalyser();
        this.microphone = this.context.createMediaStreamSource(stream);
        this.microphone.connect(this.analyzer);
        this.analyzer.fftSize = DATA_LEN;
    }
    return AudioController;
}());
var MainController = (function () {
    function MainController(audio, color, vis) {
        this.audio = audio;
        this.color = color;
        this.vis = vis;
        this.connectButton();
    }
    MainController.prototype.connectButton = function () {
        $('#color-button').click(function () {
            this.color.change();
            this.vis.updateColor(this.color.colors);
        }.bind(this));
    };
    MainController.prototype.update = function () {
        this.vis.update(this.audio);
        if (this.vis.frequencyData[CHANGE_LOC] > CUTOFF && this.color.shouldChange) {
            this.color.change();
            this.vis.updateColor(this.color.colors);
            this.color.shouldChange = false;
        }
        if (this.vis.frequencyData[5] < CUTOFF)
            this.color.shouldChange = true;
    };
    MainController.prototype.loop = function () {
        requestAnimationFrame(this.loop);
        this.now = Date.now();
        this.delta = this.now - this.then;
        if (this.delta > MainController.interval) {
            this.then = this.now - (this.delta % MainController.interval);
            this.update();
        }
    };
    MainController.interval = 1000 / FPS;
    return MainController;
}());
var ColorController = (function () {
    function ColorController() {
        this.shouldChange = false;
        this.background = $('body');
        this.change();
    }
    ColorController.prototype.change = function () {
        var random = Math.floor(Math.random() * ColorController.palettes.length);
        this.colors = ColorController.palettes[random];
        random = Math.floor(Math.random() * this.colors.length);
        this.background.css("background", this.colors[random]);
    };
    ColorController.prototype.randomColor = function () {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    };
    ColorController.palettes = [
        ["#71A7FE", "#399AE7", "#3B407C", "#547AB1", "#CEAFC0"],
        ["#EFBC9B", "#EE92C2", "#9D6A89", "#725D68", "#A8B4A5"],
        ["#48639C", "#4C4C9D", "#712F79", "#976391", "#F7996E"],
        ["#310A31", "#847996", "#88B7B5", "#A7CAB1", "#F4ECD6"],
        ["#2D728F", "#3B8EA5", "#F5EE9E", "#F49E4C", "#AB3428"]
    ];
    return ColorController;
}());
var Vis = (function () {
    function Vis(colors) {
        this.svg = d3.select(Vis.container)
            .append('svg')
            .attr('height', Vis.height)
            .attr('width', Vis.width);
        this.frequencyData = new Uint8Array(DATA_LEN);
        this.circles = new Array(this.frequencyData.length);
        this.generateCircles(colors);
    }
    Vis.prototype.generateCircles = function (colors) {
        for (var i = this.frequencyData.length - 1; i >= 0; i--) {
            var random = Math.floor(Math.random() * colors.length);
            this.circles[i] = this.svg.append('circle')
                .attr('cx', Vis.width / 2)
                .attr('cy', Vis.height / 2)
                .attr('r', this.frequencyData[i])
                .style('fill', colors[random]);
        }
    };
    Vis.prototype.updateColor = function (colors) {
        for (var i = 0; i < this.circles.length; i++) {
            var random = Math.floor(Math.random() * colors.length);
            this.circles[i].style("fill", colors[random]);
        }
    };
    Vis.prototype.update = function (audio) {
        audio.analyzer.getByteFrequencyData(this.frequencyData);
        this.draw();
    };
    Vis.prototype.draw = function () {
        for (var i = 0; i < this.circles.length; i++) {
            this.circles[i].attr('r', ((i * i) / 64) * this.frequencyData[i]);
        }
    };
    Vis.container = '#container';
    Vis.height = $(Vis.container).height();
    Vis.width = $(Vis.container).width();
    return Vis;
}());
var now;
var then = Date.now();
var interval = 1000 / FPS;
var delta;
function loop() {
    requestAnimationFrame(loop);
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
        then = now - (delta % interval);
        controller.update();
    }
}
//# sourceMappingURL=main.js.map