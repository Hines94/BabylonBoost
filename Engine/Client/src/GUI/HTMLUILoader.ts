import { AsyncImageDescription } from "@engine/AsyncAssets";
import { GameEcosystem } from "@engine/GameEcosystem";
import { AsyncArrayBufferLoader, AsyncMsgpackLoader } from "@engine/Utils/StandardAsyncLoaders";
import { decode } from "@msgpack/msgpack";

/** Load UI from saved S3 object into a html element */
export async function LoadUIContent(
    awsPath: string,
    filename: string,
    ecosystem: GameEcosystem,
    owningDiv: HTMLElement = undefined
) {
    const loader = AsyncMsgpackLoader.GetMsgpackLoader(awsPath, filename);
    await loader.getWaitForFullyLoadPromise();
    var div = owningDiv;
    if (div === undefined) {
        div = ecosystem.doc.createElement("div");
        ecosystem.doc.getElementById("GameUI").appendChild(div);
    }
    div.innerHTML = loader.msgpackData as string;
    SetupLoadedHTMLUI(div);
}

/** Given an element which has loaded the text content from UI - load this element */
export async function SetupLoadedHTMLUI(element: HTMLElement) {
    //Load other UI
    await setupElementUI(element);

    //Load images
    element.querySelectorAll("div[data-bgpath]").forEach(div => {
        const path = div.getAttribute("data-bgpath");
        const filename = div.getAttribute("data-bgfilename");
        const hasAlpha = div.getAttribute("data-bghasalpha") === "true";

        const asyncImage = new AsyncImageDescription(path, filename, hasAlpha);
        asyncImage.SetupDivAsImage(div as HTMLDivElement);
    });

    //Setup an element's UI - recursive loading
    async function setupElementUI(ele: HTMLElement) {
        const UIElements = ele.querySelectorAll("div[data-uipath]");
        for (var i = 0; i < UIElements.length; i++) {
            const div = UIElements[i];
            if ((div as any).loadedIn !== undefined) {
                continue;
            }
            const path = div.getAttribute("data-uipath");
            const filename = div.getAttribute("data-uifilename");

            const loader = AsyncMsgpackLoader.GetMsgpackLoader(path, filename);
            await loader.getWaitForFullyLoadPromise();
            div.innerHTML = loader.msgpackData as string;
            //Recursive load
            await setupElementUI(div as HTMLElement);
        }
    }
}