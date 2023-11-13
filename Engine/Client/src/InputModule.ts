import { Observable } from "@babylonjs/core/Misc/observable.js";
import { SimpleWeightedAverageSmooth } from "../../Shared/src/Utils/MathUtils";
import { UpdateDynamicTextureChecks } from "./GUI/AdvancedDynamicTextureTracker";
import { DeviceSourceManager, DeviceType, PointerInput, Vector2 } from "@babylonjs/core";
import { GameEcosystem } from "@engine/GameEcosystem";

const dynamicpropertyDSM = "___DYNAMICSOURCEMANAGER___";
export const mouseOverCanvas = "___MOUSEOVERECOSYSTEMCANVAS___";

/**
 * An input for a specific keybind. Contains useful methods for checking if we have used or not.
 * */
export class ButtonInput {
    wasActive = false;
    isActive = false;

    //TODO: Incorporate mouse binds?
    currentKeybinds: number[];

    constructor(defaultKeybinds: number[]) {
        this.currentKeybinds = defaultKeybinds;
    }

    UpdateValue(ecosystem: GameEcosystem) {
        const vals: number[] = [];
        //If we are typing then don't activate!
        if (ecosystem.controlHasFocus) {
            this.setNewActivity([0]);
        } else {
            for (var i = 0; i < this.currentKeybinds.length; i++) {
                vals.push(GetKeyboardValue(this.currentKeybinds[i], ecosystem));
            }
            this.setNewActivity(vals);
        }
    }

    /** ONLY Set in input module! */
    setNewActivity(values: number[]) {
        if (values.length === 0) {
            return;
        }
        //If we have an alternative key?
        var newval = values[0];
        for (var i = 0; i < values.length; i++) {
            if (values[i] === 1) {
                newval = 1;
                break;
            }
        }
        this.wasActive = this.isActive;
        this.isActive = newval === 1 ? true : false;
        if (this.wasJustActivated()) {
            this.onActivateKey.notifyObservers(this);
        } else if (this.wasJustDeactivated()) {
            this.onDeactivateKey.notifyObservers(this);
        }
    }

    /** Check if we have just pressed this button or not */
    wasJustActivated() {
        return this.wasActive === false && this.isActive === true;
    }

    /**Check if we have just released the key for this button */
    wasJustDeactivated() {
        return this.wasActive === true && this.isActive === false;
    }

    /** Will be called when we first press this key down */
    onActivateKey = new Observable<ButtonInput>();
    /** Will be called when we first release this key */
    onDeactivateKey = new Observable<ButtonInput>();
}

//Key values
const AKEY = 65;
const WKEY = 87;
const SKEY = 83;
const DKEY = 68;
const BKEY = 66;
const XKEY = 88;
const YKEY = 89;
const ZKEY = 90;
const PKEY = 80;
const ALTKEY = 18;
const INSERTKEY = 45;
const ARRUPKEY = 38;
const ARRDOWNKEY = 40;
const ARRLEFTKEY = 37;
const ARRRIGHTKEY = 39;
const LEFTMOUSE = 2;
const RIGHTMOUSE = 4;
const MIDDLEMOUSE = 3;
const LEFTCONTROL = 17; //CAREFUL WITH THIS - Shortcut for many Chrome functions like close window
const CAPSKEY = 20;
const HOME = 36;
const END = 35;
const ENTER = 13;
const DELETE = 46;
const PGUP = 33;
const PGDWN = 34;
const LEFTSHIFT = 16;
const SPACE = 32;
const CKEY = 67;
const QKEY = 81;
const EKEY = 69;
const NKEY = 78;
const VKEY = 86;
const TKEY = 84;
const GKEY = 71;
const RKEY = 82;
const FKEY = 70;
const LKEY = 76;
const HKEY = 72;
const ONEKEY = 49;
const TWOKEY = 50;
const THREEKEY = 51;
const FOURKEY = 52;
const FIVEKEY = 53;
const SIXKEY = 54;
const SEVENKEY = 55;
const EIGHTKEY = 56;
const NINEKEY = 57;
const PERIODKEY = 110;
const ZEROKEY = 48;
const TILDEKEY = 192;
const TILDEKEYALT = 223;
const IKEY = 73;

/** Contains information on all of our relevant keybinds to play the game */
export class WindowInputValues {
    mouseWheel = 0;
    forward = 0;
    side = 0;
    up = 0;
    mouseXDelta = 0;
    mouseYDelta = 0;
    /** Note: This has some slight input lag! */
    mouseXPosition = 0;
    /** Note: This has some slight input lag! */
    mouseYPosition = 0;
    roll = 0;

    primaryClick = new ButtonInput([]);
    secondaryClick = new ButtonInput([]);
    middleClick = new ButtonInput([]);

    //CAREFUL: Holding this whilst clicking etc can lead to big problems with browser keys
    LEFTCONTROLKey = new ButtonInput([LEFTCONTROL]);
    LEFTSHIFTKey = new ButtonInput([LEFTSHIFT]);
    LEFTALTKey = new ButtonInput([ALTKEY]);
    CAPSKey = new ButtonInput([CAPSKEY]);
    //Arrows
    ARROWUPKey = new ButtonInput([ARRUPKEY]);
    ARROWDOWNKey = new ButtonInput([ARRDOWNKEY]);
    ARROWLEFTKey = new ButtonInput([ARRLEFTKEY]);
    ARROWRIGHTKey = new ButtonInput([ARRRIGHTKEY]);
    //Numbers
    ZEROKey = new ButtonInput([ZEROKEY]);
    ONEKey = new ButtonInput([ONEKEY]);
    TWOKey = new ButtonInput([TWOKEY]);
    THREEKey = new ButtonInput([THREEKEY]);
    FOURKey = new ButtonInput([FOURKEY]);
    FIVEKey = new ButtonInput([FIVEKEY]);
    SIXKey = new ButtonInput([SIXKEY]);
    SEVENKey = new ButtonInput([SEVENKEY]);
    EIGHTKey = new ButtonInput([EIGHTKEY]);
    NINEKey = new ButtonInput([NINEKEY]);
    TILDEKey = new ButtonInput([TILDEKEY, TILDEKEYALT]);

    //General Keys
    XKey = new ButtonInput([XKEY]);
    YKey = new ButtonInput([YKEY]);
    ZKey = new ButtonInput([ZKEY]);
    PKey = new ButtonInput([PKEY]);
    FKey = new ButtonInput([FKEY]);
    IKey = new ButtonInput([IKEY]);
    TKey = new ButtonInput([TKEY]);
    GKey = new ButtonInput([GKEY]);
    HKey = new ButtonInput([HKEY]);
    VKey = new ButtonInput([VKEY]);
    BKey = new ButtonInput([BKEY]);
    EKey = new ButtonInput([EKEY]);
    RKey = new ButtonInput([RKEY]);

    /** Given a number ty to get the correct Key */
    GetNumberKey(index: Number): ButtonInput {
        if (index === 0) {
            return this.ZEROKey;
        } else if (index === 1) {
            return this.ONEKey;
        } else if (index === 2) {
            return this.TWOKey;
        } else if (index === 3) {
            return this.THREEKey;
        } else if (index === 4) {
            return this.FOURKey;
        } else if (index === 5) {
            return this.FIVEKey;
        } else if (index === 6) {
            return this.SIXKey;
        } else if (index === 7) {
            return this.SEVENKey;
        } else if (index === 8) {
            return this.EIGHTKey;
        } else if (index === 9) {
            return this.NINEKey;
        }
        return undefined;
    }

    /** Given a string input (Eg F) try to get the correct key */
    GetKey(stringKey: string): ButtonInput {
        const upperKey = stringKey.toUpperCase();
        var input = this.checkKeyExists(upperKey);
        if (input) {
            return input;
        }
        input = this.checkKeyExists(upperKey + "Key");
        if (input) {
            return input;
        }

        return undefined;
    }

    private checkKeyExists(checkKey: string) {
        if (checkKey in this) {
            var key = checkKey as keyof WindowInputValues;
            return this[key] as ButtonInput;
        }
        return undefined;
    }
}

export function SetupInputsModule(ecosystem: GameEcosystem) {
    ecosystem.dynamicProperties[dynamicpropertyDSM] = new DeviceSourceManager(ecosystem.scene.getEngine());
    (ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager).onDeviceConnectedObservable.add(
        deviceSource => {
            // If Mouse/Touch, add an Observer to capture scroll wheel
            if (deviceSource.deviceType === DeviceType.Mouse || deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.add(eventData => {
                    if (eventData.inputIndex === PointerInput.MouseWheelY) {
                        if (eventData.wheelDelta > 0) {
                            ecosystem.InputValues.mouseWheel = 1;
                        } else {
                            ecosystem.InputValues.mouseWheel = -1;
                        }
                    }
                    if (eventData.inputIndex === PointerInput.Move) {
                        RecordMouseChanges(eventData.movementX, eventData.movementY);
                    }
                });
            }
        }
    );
    ecosystem.dynamicProperties[mouseOverCanvas] = true;
    ecosystem.canvas.addEventListener("mouseenter", () => {
        ecosystem.dynamicProperties[mouseOverCanvas] = true;
    });
    ecosystem.canvas.addEventListener("mouseleave", () => {
        ecosystem.dynamicProperties[mouseOverCanvas] = false;
    });
}

export function ButtonClickWasLeftMouse(vec2WInfo: any): boolean {
    return vec2WInfo.buttonIndex === 0;
}

export function ButtonClickWasRightMouse(vec2WInfo: any): boolean {
    return vec2WInfo.buttonIndex === 2;
}

export function UpdateInputValues(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties[dynamicpropertyDSM] === undefined) {
        console.error("No device manager for input! Did you call SetupDeviceManager?");
        return;
    }
    const dsm = ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager;

    UpdateDynamicTextureChecks(ecosystem);
    const scaling = ecosystem.scene.getEngine().getHardwareScalingLevel();
    ecosystem.InputValues.mouseXPosition = ecosystem.scene.pointerX / scaling;
    ecosystem.InputValues.mouseYPosition = ecosystem.scene.pointerY / scaling;

    ecosystem.InputValues.forward = 0;
    ecosystem.InputValues.side = 0;

    //TODO what if not keyboard mouse (eg touch or gamepad)

    //Get all keyboard values
    if (dsm.getDeviceSource(DeviceType.Keyboard)) {
        for (const key in ecosystem.InputValues) {
            if (ecosystem.InputValues.hasOwnProperty(key)) {
                const value = ecosystem.InputValues[key as keyof WindowInputValues];
                if (value instanceof ButtonInput) {
                    value.UpdateValue(ecosystem);
                }
            }
        }
        ecosystem.InputValues.forward = GetKeyboardAxis(WKEY, SKEY, ecosystem);
        ecosystem.InputValues.side = GetKeyboardAxis(DKEY, AKEY, ecosystem);
        ecosystem.InputValues.up = GetKeyboardAxis(SPACE, CKEY, ecosystem);
        ecosystem.InputValues.roll = GetKeyboardAxis(QKEY, EKEY, ecosystem);
    }
    //Get all mouse values
    if (dsm.getDeviceSource(DeviceType.Mouse)) {
        var PrimClickMade = dsm.getDeviceSource(DeviceType.Mouse).getInput(LEFTMOUSE);
        //Block click if over UI
        if (PrimClickMade === 1 && ecosystem.InputValues.primaryClick.wasActive === false) {
            if (ecosystem.hoveredOverGUI === true) {
                PrimClickMade = 0;
            }
        }
        ecosystem.InputValues.primaryClick.setNewActivity([PrimClickMade]);
        ecosystem.InputValues.middleClick.setNewActivity([dsm.getDeviceSource(DeviceType.Mouse).getInput(MIDDLEMOUSE)]);
        ecosystem.InputValues.secondaryClick.setNewActivity([
            dsm.getDeviceSource(DeviceType.Mouse).getInput(RIGHTMOUSE),
        ]);
    }
}

export function UpdateInputValuesEndFrame(ecosystem: GameEcosystem) {
    ecosystem.InputValues.mouseWheel = 0;

    ecosystem.InputValues.mouseYDelta = SimpleWeightedAverageSmooth(
        ecosystem.InputValues.mouseYDelta,
        frameMouseYChanges,
        ecosystem.deltaTime,
        0.02
    );
    ecosystem.InputValues.mouseXDelta = SimpleWeightedAverageSmooth(
        ecosystem.InputValues.mouseXDelta,
        frameMouseXChanges,
        ecosystem.deltaTime,
        0.02
    );
    frameMouseXChanges = 0;
    frameMouseYChanges = 0;
}

//Normalise so we are not moving faster with horiz and vertical at the same time
export function GetNormalizedVertHorizInput(ecosystem: GameEcosystem) {
    var DesMove = new Vector2();
    DesMove.x = ecosystem.InputValues.side;
    DesMove.y = ecosystem.InputValues.forward;
    if (DesMove.x !== 0 || DesMove.y !== 0) {
        return DesMove.normalize();
    }
    return DesMove;
}

//A axis with positive/negative
function GetKeyboardAxis(PosInput: number, NegInput: number, ecosystem: GameEcosystem) {
    //If we are typing then ignore!
    if (ecosystem.controlHasFocus) {
        return 0;
    }

    var Ret = 0;
    //POS
    if (GetKeyboardValue(PosInput, ecosystem) === 1) {
        Ret += 1;
    }
    //NEG
    if (GetKeyboardValue(NegInput, ecosystem) === 1) {
        Ret -= 1;
    }
    return Ret;
}

//Helper function for getting single keyboard val
function GetKeyboardValue(input: number, ecosystem: GameEcosystem) {
    const dsm = ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager;
    return dsm.getDeviceSource(DeviceType.Keyboard).getInput(input);
}

let frameMouseXChanges = 0;
let frameMouseYChanges = 0;
function RecordMouseChanges(x: number, y: number) {
    frameMouseXChanges += x;
    frameMouseYChanges += y;
}
