import { ModelSpecifier } from "@BabylonBurstClient/Autogenerated/babylonburst_ServerTypings_autogenerated";
import { CreateHiddenComponentElements, JSONEditor, CustomInspectorComp, RequiresSetupForCustom } from "./CustomInspectorComponents";
import { ModelPaths, onModelPathsChangeObserver } from "../../Utils/EditorModelSpecifier";
import { ShowToastError } from "@BabylonBurstClient/HTML/HTMLToastItem";

/** For models - easy dropdown to pick */
export class CustomModelInspectorComp implements CustomInspectorComp {
    BuildCustomElement(editor: JSONEditor): boolean {
        if(!RequiresSetupForCustom("ModelSpecifier",editor)){
            return false;
        }
        ProcessModelSpecifierComp(editor);
        return true;
    }

}

function ProcessModelSpecifierComp(modelEditor:JSONEditor){

    //Hide all children
    CreateHiddenComponentElements(modelEditor,"Custom Type Model Spec");

    //TODO: Make this list/input stuff generic
    if(!modelEditor.container.ownerDocument.getElementById("___ModelsList___")) {
        const modelsList = modelEditor.container.ownerDocument.createElement("datalist");
        modelsList.id = '___ModelsList___';
        SetDatalistModelSpecififers(modelsList);
        onModelPathsChangeObserver.add(newList=>{
            SetDatalistModelSpecififers(modelsList);
        })
        modelEditor.container.ownerDocument.body.appendChild(modelsList);
    }

    const input = modelEditor.container.ownerDocument.createElement("input");
    input.setAttribute('list', '___ModelsList___');
    input.setAttribute('name', 'addModels');
    input.classList.add('form-control');
    input.style.marginBottom = '5px';

    const existData = modelEditor.getValue() as ModelSpecifier;
    input.value = GetModelSpecifierAbbrevText(existData);
    

    input.addEventListener("change",()=>{
        const selectedText = input.value;
        const optionsList = input.ownerDocument.getElementById('___ModelsList___');
        const option = Array.from(optionsList.querySelectorAll('option')).find(opt => opt.innerText === selectedText);
        if (option) {
            const value = JSON.parse(option.getAttribute("data-model")) as ModelSpecifier;
            modelEditor.setValue(value);
        } else {
            ShowToastError("Issue finding value for mesh option " + selectedText);
        }
    })

    modelEditor.container.appendChild(input);
}

function GetModelSpecifierAbbrevText(element:ModelSpecifier) {
    if(!element || !element.FilePath) {
        return "";
    }
    return  element.FilePath.replace("~7~","").replace(".zip","") + " - " + element.MeshName;
}

function SetDatalistModelSpecififers(list:HTMLDataListElement) {
    if(!list) {
        return;
    }
    while(list.firstChild){
        list.firstChild.remove();
    }
    for(var i = 0; i < ModelPaths.length;i++) {
        const opt = list.ownerDocument.createElement("option");
        opt.innerText = GetModelSpecifierAbbrevText(ModelPaths[i].specifier);
        opt.setAttribute("data-model",JSON.stringify(ModelPaths[i].specifier));
        list.appendChild(opt);
    }
}
