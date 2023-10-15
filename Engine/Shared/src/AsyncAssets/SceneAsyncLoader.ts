import { ISceneLoaderAsyncResult, Observable, SceneLoader, DracoCompression, Mesh, Scene } from "@babylonjs/core";
import { AsyncAssetLoader, GetPreviouslyLoadedAWSAssetCustomPath } from "./Framework/AsyncAssetLoader.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";

export function GetSceneLoader(path: string, fileIndex: number, scene: Scene): SceneAsyncLoader {
    //NOTE: This relies on us setting up a seperate sceneID if we have multiple scenes
    //const customPath = GetAsyncSceneIdentifier(scene) + AsyncZipPuller.GetAssetFullPath(path,fileIndex);
    var ret = GetPreviouslyLoadedAWSAssetCustomPath(path);
    if (ret === null) {
        return new SceneAsyncLoader(path, fileIndex, scene);
    } else {
        const gltf = ret as SceneAsyncLoader;
        if (gltf === null) {
            console.error(
                "AWS Asset has been loaded incorrectly? Should be a GLTF? " + path + " Aborting loading process!"
            );
            return;
        }
        return gltf;
    }
}

/**
 * The acual "loader" for a GLTF scene. Will load from AWS and hide the loaded meshes via isVisible.
 */
export class SceneAsyncLoader extends AsyncAssetLoader {
    loadedGLTF: ISceneLoaderAsyncResult;
    onMeshLoaded = new Observable<SceneAsyncLoader>();
    extensionType: string;
    desiredScene: Scene = null;

    constructor(assetPath: string, fileIndex: number, scene: Scene) {
        super(assetPath, fileIndex, false);
        this.desiredScene = scene;
        if (scene !== undefined) {
            this.performAsyncLoad();
        }
    }

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.string;
    }

    override async onAsyncDataLoaded(dataFromZip: any): Promise<null> {
        const dataAsString = dataFromZip as string;

        var result = await SceneLoader.ImportMeshAsync(
            "",
            "data:".concat(dataAsString),
            "",
            this.desiredScene,
            null,
            this.extensionType
        );
        this.loadedGLTF = result;

        //Hide all of our meshes until we are ready to use them!
        this.SetMeshesHidden(false);

        this.onMeshLoaded.notifyObservers(this);

        return null;
    }

    SetMeshesHidden(bVisible: boolean) {
        for (var i = 0; i < this.loadedGLTF.meshes.length; i++) {
            this.loadedGLTF.meshes[i].isVisible = bVisible;
        }
    }

    extractMeshElements(meshName: string): Mesh[] {
        var foundMeshElements: Mesh[] = [];
        const LoadedMeshes = this.loadedGLTF.meshes;
        for (var i = 0; i < LoadedMeshes.length; i++) {
            if (LoadedMeshes[i].id.includes(meshName)) {
                const asMesh = LoadedMeshes[i] as Mesh;
                if (asMesh === null || asMesh === undefined) {
                    console.error("Mesh " + LoadedMeshes[i].name + " is not a mesh! Its abstract something...");
                } else {
                    foundMeshElements.push(LoadedMeshes[i] as Mesh);
                }
            }
        }
        return foundMeshElements;
    }

    override GetAssetFullPath(): string {
        const fullPath = GetAsyncSceneIdentifier(this.desiredScene) + super.GetAssetFullPath();
        return fullPath;
    }
    //TODO validate all meshes have definitions created!
}