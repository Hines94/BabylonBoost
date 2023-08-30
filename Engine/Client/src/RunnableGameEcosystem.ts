import { Color4, Engine, Observable, Scene, Vector3 } from "@babylonjs/core";
import { SceneSetupSettings } from "./Environment/SceneSetupSettings";
import { SetupInputsModule, UpdateInputValues, UpdateInputValuesEndFrame, WindowInputValues } from "./InputModule";
import { AngleToRad, SimpleWeightedSmoothWithSteps } from "./Utils/MathUtils";
import { GridFloorOverlay } from "./Environment/GridFloorOverlay";
import { UpdateAllTickables } from "./Utils/BaseTickableObject";
import { GameEcosystem } from "../../Shared/src/GameEcosystem";
import { v4 as uuidv4 } from "uuid";
import { UpdateSystemsLoop } from "./SystemsLoop";
import { PlayerCamera } from "./Camera/PlayerCamera";
import { GetGameSettings } from "./Settings";
import { setupAsyncManager } from "./Environment/AWSAssetSetup";

/** Custom game launch - eg editor or client side performance checks */
export class RunnableGameEcosystem implements GameEcosystem {
    //Maximum bounds of the world
    worldRadius = 50;
    worldHeight = 20;
    tileSize = 1;

    uuid = uuidv4();
    window: Window;
    canvas: HTMLCanvasElement;
    doc: Document;
    deltaTime = 0.00001;
    scene: Scene;
    dynamicProperties: { [key: string]: any } = {};
    InputValues = new WindowInputValues();

    wasmWrapper: ServerWASMModuleWrapper;
    engine: Engine;
    sceneSettings: SceneSetupSettings;
    gameSetup = false;
    camera: PlayerCamera;
    onUpdate = new Observable<GameEcosystem>();
    controlHasFocus: boolean;
    hoveredOverGUI: boolean;

    constructor(canvas: HTMLCanvasElement) {
        this.doc = canvas.ownerDocument;
        this.setupCanvas(canvas);
        this.setupEngineRunLoop(canvas);
    }

    dispose(): void {
        this.engine.dispose();
        this.wasmWrapper.dispose();
        delete this.wasmWrapper;
    }
    private waitLoadResolve: any;
    waitLoadedPromise: Promise<GameEcosystem> = new Promise((resolve, reject) => {
        this.waitLoadResolve = resolve;
    });

    setupCanvas(canvas: HTMLCanvasElement) {
        canvas.id = "gameCanvas";
        canvas.className = "gameCanvas";
        this.canvas = canvas;
        this.window = this.canvas.ownerDocument.defaultView;
        //Not worth using worker thread as communication too much!
    }

    async setupEngineRunLoop(canvas: HTMLCanvasElement) {
        await this.setupEngine(canvas);
        //Window resize utils
        const ecosystem = this;
        canvas.ownerDocument.defaultView.onresize = function () {
            ecosystem.engine.resize();
        };
        await setupAsyncManager();
        this.wasmWrapper = new ServerWASMModuleWrapper(await BabylonBoostWASM());
        await this.wasmWrapper.awaitWASMModuleReady();
        this.setupScene();
        this.camera = new PlayerCamera(this);
        GetGameSettings().OnSceneLoaded(this);
        this.waitLoadResolve(this);
        this.runGameLoop();
    }

    private async setupEngine(canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true, {}, true);
        // const engine = new WebGPUEngine(canvas);
        // await engine.initAsync();
        // this.engine = engine;
        this.engine.enableOfflineSupport = false;
    }

    async setupScene() {
        this.scene = new Scene(this.engine);
        this.sceneSettings = new SceneSetupSettings(this.scene);
        await this.sceneSettings.setupScene();

        this.setupBackground();
        this.setupExtras();

        //Perform setup on various systems
        SetupInputsModule(this);

        this.gameSetup = true;
    }

    runGameLoop(): void {
        this.engine.runRenderLoop(() => {
            if (this.gameSetup === false) {
                return;
            }
            if (this.scene == undefined) {
                console.error("No scene!");
                return;
            }
            //Make sure we don't need this!
            this.scene.cleanCachedTextureBuffer();
            this.updateTick();
            this.onUpdate.notifyObservers(this);
            this.updateLoop();
            if (this.scene.cameras.length > 0) {
                this.scene.render();
            }
        });
    }

    private setupBackground() {
        // const offset = 50;
        // const back = new GridFloorOverlay(scene,{gridWidthX:10,gridWidthY:10,gridTileSize:10,tileMargin:0.05,gridColor:new Color4(0.2,0.2,0.2,0.1)});
        // back.moveableNode.position = new Vector3(0,0,offset);
        // const floor = new GridFloorOverlay(scene,{gridWidthX:10,gridWidthY:10,gridTileSize:10,tileMargin:0.05,gridColor:new Color4(0.2,0.2,0.2,0.1)});
        // floor.moveableNode.position = new Vector3(0,-offset,0);
        // floor.moveableNode.rotation = new Vector3(AngleToRad(90),0,0);
        const smallfloor = new GridFloorOverlay(this.scene, {
            gridWidthX: 10,
            gridWidthY: 10,
            gridTileSize: 0.5,
            tileMargin: 0.05,
            gridColor: new Color4(0.1, 0.1, 0.1, 0.01),
        });
        smallfloor.moveableNode.rotation = new Vector3(AngleToRad(90), 0, 0);
        //const smallY = new GridFloorOverlay(scene,{gridWidthX:10,gridWidthY:10,gridTileSize:0.5,tileMargin:0.05,gridColor:new Color4(0,1,0,0.05)});
        //smallfloor.moveableNode.rotation = new Vector3(0,0,0);
    }

    protected setupExtras() {}

    private updateLoop() {
        UpdateInputValues(this);
        this.updateEcosystemLoop();
        UpdateInputValuesEndFrame(this);
    }

    /** General update for this ecosystem to update inputs etc */
    protected updateEcosystemLoop() {
        //Input values updated first so other systems know if we have clicked etc
        UpdateAllTickables(this);
        UpdateSystemsLoop(this, this.updateWindowSpecificSystems.bind(this));
        this.wasmWrapper.UpdateSingleGameLoop();
    }
    /** Specific window systems such as Editor systems or game specific systems */
    protected updateWindowSpecificSystems(ecosystem: GameEcosystem) {}

    /** Get our delta time */
    updateTick(): void {
        //This is more accurate than engine!
        var NewTick = performance.now();
        //Convert to S from ms
        const newDeltaTime = Math.max((NewTick - this.lastTick) / 1000, 0.0000001);
        this.deltaTime = SimpleWeightedSmoothWithSteps(this.deltaTime, newDeltaTime, 6);
        this.lastTick = NewTick;
    }
    lastTick = 0;
}
