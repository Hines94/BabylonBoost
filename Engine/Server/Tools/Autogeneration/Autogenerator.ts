//@ts-ignore
import * as fs from 'fs';
//@ts-ignore
import * as path from 'path';
import { RunBodyAutogeneration, RunBodyPrepass } from './BodyMethods/BodyAutogeneration';
import { UpdateStructsProperties } from './Utils/ComponentPropertyReader';
import { GenerateComponentLoader } from './Utils/ComponentLoadGenerator';
import { FinishClientAutoTypings } from './ClientTypings/ClientTypingsAutogenerator';

export const sourcePath = "../../../src";
export const buildPath = "../../../build/Autogeneration";

//Process a file and search for any candidates for autogeneration
function processFile(filePath: string) {
    //Get properties and check if any point in creation
    let code = fs.readFileSync(filePath, 'utf-8');
    UpdateStructsProperties(code,filePath);
    RunBodyAutogeneration(code,filePath);
}

export function CreateAutogenFile(filePath: string,extension:string = ".cpp") {
    let fileNameExten = path.basename(filePath);
    let fileName = path.basename(filePath, path.extname(filePath)); // get the file name without extension
    let relativeDir = path.relative(sourcePath, path.dirname(filePath)); // get the relative directory path of the file
    let outputDir = path.join(buildPath, relativeDir); // get the corresponding directory in the build folder
    fs.mkdirSync(outputDir, { recursive: true }); // create the directory if it doesn't exist
    let outputFile = path.join(outputDir, `${fileName}_autogenerated${extension}`);
    return { relativeDir, fileNameExten, outputFile };
}

//Process a directory and search for any candidates for autogeneration
export function RecursiveDirectoryProcess(dirPath: string,processMethod:(filePath:string)=>void) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            RecursiveDirectoryProcess(path.join(dirPath, entry.name),processMethod);
        } else if (entry.isFile() && (entry.name.endsWith('.h') || entry.name.endsWith('.hpp'))) {
            processMethod(path.join(dirPath, entry.name))
        }
    }
}

async function RunAutogenerator() {
    //Prepasses
    RunBodyPrepass();
    //Autogeneration
    RecursiveDirectoryProcess(sourcePath,processFile);
    GenerateComponentLoader();
    FinishClientAutoTypings();
}

//Actual autogeneration
console.time('Autogenerator Runtime');
RunAutogenerator().then(()=>{
    console.timeEnd('Autogenerator Runtime');
})