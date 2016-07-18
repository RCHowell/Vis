declare let FPS: number;
declare let CUTOFF: number;
declare let DATA_LEN: number;
declare let CHANGE_LOC: number;
declare let controller: MainController;
declare let n: any;
declare class AudioController {
    analyzer: any;
    private microphone;
    private context;
    private element;
    constructor(stream: any);
}
declare class MainController {
    private audio;
    private color;
    private vis;
    private now;
    private then;
    private static interval;
    private delta;
    constructor(audio: AudioController, color: ColorController, vis: Vis);
    connectButton(): void;
    update(): void;
    loop(): void;
}
declare class ColorController {
    private static palettes;
    colors: string[];
    private background;
    private count;
    shouldChange: boolean;
    constructor();
    change(): void;
    randomColor(): string;
}
declare class Vis {
    frequencyData: Uint8Array;
    private static container;
    private static height;
    private static width;
    private svg;
    private circles;
    constructor(colors: string[]);
    generateCircles(colors: string[]): void;
    updateColor(colors: string[]): void;
    update(audio: AudioController): void;
    draw(): void;
}
declare let now: number;
declare let then: number;
declare let interval: number;
declare let delta: number;
declare function loop(): void;
