import { decode } from "@msgpack/msgpack";
import { Component, FindSavedProperty, registeredComponents } from "./Component";
import { EntitySavedTypings, GetTypingsCompIndex } from "./EntitySaver";
import { EntitySystem } from "./EntitySystem";
import { EntityLoadMapping } from "./EntityData";

export class EntityTemplate {
    typings:EntitySavedTypings;
    entityData:{ [ent:number]: any } = {};

    DoesEntityExist(ent:number) : boolean {
        return this.entityData[ent] !== undefined;
    }

    GetEntityComponent<T extends Component>(ent:number,type: { new(): T }, mapping:EntityLoadMapping): T | undefined {
        if(!this.DoesEntityExist(ent)) {
            return undefined;
        }
        const compName = type.name;
        const compNames = Object.keys(this.typings);
        if(!compNames.includes(compName)) {
            return undefined;
        }
        const compData = this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
        if(!compData){
            return undefined;
        }
        const ret = new type();
        const params = Object.keys(compData);
        for(var i = 0; i < params.length;i++) {
            const paramIndex = parseInt(params[i]);
            const paramName = this.typings[compName][paramIndex];
            const propIdentifier = FindSavedProperty(compName,paramName);
            if(propIdentifier.type["LoadSaveableData"]) {
                ret[paramName] = propIdentifier.type.LoadSaveableData(mapping[ent],ret,paramName,compData[paramIndex],mapping);
            } else {
                ret[paramName] = compData[paramIndex];
            }
        }
        return ret;
    }

    GetRawComponentData(ent:number,compName:string) : any {
        if(!this.DoesEntityExist(ent)) {
            return undefined;
        }
        const compNames = Object.keys(this.typings);
        if(!compNames.includes(compName)) {
            return undefined;
        }
        return this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
    }
}

export class EntityLoader {
    static GetEntityTemplateFromMsgpack(data:number[] | Uint8Array) : EntityTemplate {
        const template = new EntityTemplate();
        const decodedItem = decode(data);
        template.typings = decodedItem["T"];
        template.entityData = decodedItem["C"];
        return template;
    }

    static LoadTemplateIntoNewEntities(template:EntityTemplate,system:EntitySystem) {
        const allEnts = Object.keys(template.entityData);
        const entMappings:EntityLoadMapping = {};
        allEnts.forEach(e=>{
            const newEnt = system.AddEntity();
            entMappings[e] = newEnt;
        });
        allEnts.forEach(e=>{
            const originalEntId = parseInt(e);
            const comps = Object.keys(template.entityData[originalEntId]);
            for(var c = 0; c < comps.length;c++){
                const compName = Object.keys(template.typings)[parseInt(comps[c])];
                const compType = registeredComponents[compName];
                if(!compType) {
                    console.error("No registered comp type for: " + compName);
                    continue;
                }
                const compData = template.GetEntityComponent(originalEntId,compType as any,entMappings);
                system.AddSetComponentToEntity(entMappings[e],compData);
            }
        })
    }
}