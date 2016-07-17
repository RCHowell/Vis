// Global Variables
var FPS = 60;
var CUTOFF = 140; // Cutoff Level For Changing Colors
var DATA_LEN = 20; // Number Of Circles To Draw
var CHANGE_LOC = 5; // Frequency To Watch For Changing Palette

$(document).ready(function () {
  // Relies On Users Having Chrome (for now)
  if (navigator.webkitGetUserMedia) {
    navigator.webkitGetUserMedia({audio: true}, function(stream) {
      // Setup
      Audio.init(stream);
      Color.init(Vis);
      Vis.init();
      loop();
    },
    function(err) {
      console.log(err.name);
    });
  };
});


var Audio = {
  playing: false,
  analyzer: undefined,
  microphone: undefined,
  context: undefined,
  element: undefined,
  toggleAudio: function() {
    (this.playing) ? this.element.pause() : this.element.play();
    playing = !playing;
  },
  init: function(stream) {
    // Initialize Analyzer With Microphone Stream
    this.context = new AudioContext();
    this.analyzer = this.context.createAnalyser();
    this.microphone = this.context.createMediaStreamSource(stream);
    this.microphone.connect(this.analyzer);
  }
}

var Color = {
  init: function(vis) {
    var random = Math.floor(Math.random() * this.palettes.length);
    this.colors = this.palettes[random];
    this.connectButton(vis);
  },
  colors: undefined,
  // Five Palettes For Now, But The Code Allows For However Many
  // Note: Palettes Do Not Have To Be Of Length Five
  palettes: [
    ["#71A7FE", "#399AE7", "#3B407C", "#547AB1", "#CEAFC0"],
    ["#EFBC9B", "#EE92C2", "#9D6A89", "#725D68", "#A8B4A5"],
    ["#48639C", "#4C4C9D", "#712F79", "#976391", "#F7996E"],
    ["#310A31", "#847996", "#88B7B5", "#A7CAB1", "#F4ECD6"],
    ["#2D728F", "#3B8EA5", "#F5EE9E", "#F49E4C", "#AB3428"]
  ],
  background: $('body'), // Jquery Selector For Easy Reference
  count: 0,
  shouldChange: true,
  button: $('#color-button'), // Jquery Selector For Easy Reference
  connectButton: function(vis) {
    this.button.click(function() {
      this.change(vis);
    }.bind(this)); // Bind Must Be Used So That Change Can Be Called
  },
  change: function(vis) {
    var random = Math.floor(Math.random() * this.palettes.length);
    this.colors = this.palettes[random];
    // New Random For Changing Background Color
    random = Math.floor(Math.random() * this.colors.length);
    this.background.css("background", this.colors[random]);
    if (vis) {
      // Avoid Calling A Method on An Undefined Variable
      vis.updateColor();
    }
  }
}


var Vis = {
  init: function() {
    this.height = $(this.container).height();
    this.width = $(this.container).width();
    // Create A Container SVG For The Circles
    this.svg = d3.select(this.container).append('svg')
        .attr('height', this.height)
        .attr('width', this.width);
    this.bassData = this.frequencyData.slice(0, DATA_LEN);
    this.circles = new Array(this.bassData.length);
    // Initialize Circles
    for (var i = this.bassData.length - 1; i >= 0; i--) {
      var random = Math.floor(Math.random() * Color.colors.length);
      this.circles[i] = this.svg.append('circle')
                          .attr('cx', this.width / 2)
                          .attr('cy', this.height / 2)
                          .attr('r', this.bassData[i])
                          .style('fill', Color.colors[random]);
    }
  },
  // This Allows For Getting Data at 200 Different Frequencies
  frequencyData: new Uint8Array(200),
  container: '#container',
  height: undefined,
  width: undefined,
  svg: undefined,
  circles: undefined,
  updateColor: function() {
    if (this.circles) {
      // Loop Through Circles And Change Color To New Palette
      for (var i = 0; i < this.circles.length; i++) {
        var random = Math.floor(Math.random() * Color.colors.length);
        this.circles[i].style("fill", Color.colors[random]);
      }
    }
  },
  update: function() {
    // Get New Data From The Analyzer
    Audio.analyzer.getByteFrequencyData(this.frequencyData);
    this.bassData = this.frequencyData.slice(0, DATA_LEN);

    // Start Change Color Rules
    // Essentially This Changes The Palette At A Peak In Intensity
    if (this.bassData[CHANGE_LOC] > CUTOFF && Color.shouldChange) {
      Color.change();
      this.updateColor();
      Color.shouldChange = false;
    }
    if (this.bassData[5] < CUTOFF) Color.shouldChange = true;
    // End Change Color Rules

  },
  draw: function() {
    this.update(); // Update Analyzer Data Before Re-Drawing
    for (var i = 0; i < this.circles.length; i++) {
      this.circles[i].attr('r', (i / 10) * this.bassData[i]);
    }
  }
}


// Keep Track of Frames and Draw Visualizer
var now;
var then = Date.now();
var interval = 1000 / FPS;
var delta;

// Loops at Designated FPS
function loop() {
  requestAnimationFrame(loop);
  now = Date.now();
  delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    // Here's Where Stuff Happens
    Vis.draw();
  }
}
