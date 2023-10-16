import { Observable } from "@babylonjs/core";
import { ArraysContainEqualItems } from "../Utils/ArrayUtils";
import { Component, DeepSetupCallback } from "./Component";
import { EntityBucket } from "./EntityBucket";
import { EntityData } from "./EntityData"
import { EntityQuery } from "./EntityQuery";

export class EntitySystem {
    private SpawnedEntities:number = 0;
    private AllEntities:{[entId:number]:EntityData} = {};
    private EntityBuckets:EntityBucket[] = [];
    private ChangedComponents:{[enId:number]:string[]} = {};

    onEntityCreatedEv = new Observable<number>();
    onEntityRemovedEv = new Observable<number>();

    AddEntity(): EntityData {
        this.SpawnedEntities++;
        return this.CreateEntity(this.SpawnedEntities);
    }

    GetAllEntities() :{[entId:number]:EntityData} {
        return this.AllEntities;
    }

    EnsureEntity(entId:number) : EntityData {
        if(this.EntityExists(entId)){
            return this.GetEntityData(entId);
        }
        return this.CreateEntity(entId);
    }

    EntityExists(entId:number) : boolean {
        return this.AllEntities[entId] !== undefined;
    }

    GetEntityData(entId:number) : EntityData {
        return this.AllEntities[entId];
    }

    ResetSystem() {
        this.GetEntitiesWithData([],[]).iterateEntities((e)=>{
            this.RemoveEntity(e);
        })
        this.SpawnedEntities = 0;
        this.AllEntities = {};
        this.EntityBuckets = [];
        this.ChangedComponents = {};
    }

    RemoveComponent(en:number | EntityData,comp:typeof Component) {
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            return;
        }
        const component = entData.GetComponent(comp);
        if(!component) {
            return;
        }
        component.onComponentRemoved(entData);
        entData.Components = entData.Components.filter(c=>{c !== component});
        const newBucket = this.FindMakeBucket(entData.Components);
        newBucket.ChangeEntityToThisBucket(entData);
    }

    RemoveEntity(en:number | EntityData) {
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            console.warn("Tried to remove invalid ent: " + en);
            return;
        }
        const entId = this.getEntId(en);
        //Remove all components
        entData.Components.forEach((comp)=> {
            comp.onComponentRemoved(entData)
        });
        EntityBucket.RemoveEntityFromAnyBuckets(entData);
        delete(this.AllEntities[entData.EntityId]);
        entData.CleanEntity();
        this.onEntityRemovedEv.notifyObservers(entId);
    }

    GetEntitiesWithData(includeComps:typeof Component[],excludeComps:typeof Component[]): EntityQuery {
        //Setup
        const includeNames:string[] = [];
        includeComps.forEach(inc=>{
            includeNames.push(inc.name);
        })
        const excludeNames:string[] = [];
        excludeComps.forEach(exc=>{
            excludeNames.push(exc.name);
        })
        //Compare buckets
        const possibleBuckets:EntityBucket[] = [];
        this.EntityBuckets.forEach(b=>{
            for(var n = 0; n < includeNames.length;n++) {
                if(!b.SetComponents.includes(includeNames[n])) {
                    return;
                }
            }
            for(var n = 0; n < excludeNames.length;n++) {
                if(b.SetComponents.includes(excludeNames[n])) {
                    return;
                }
            }
            possibleBuckets.push(b);
        })

        const query = new EntityQuery(possibleBuckets);
        query.owningSystem =this;
        query.includeComponents = includeComps;
        return query;
    }

    AddSetComponentToEntity(en:number | EntityData, comp:Component) {
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            return;
        }
        DeepSetupCallback(comp,()=>{
            this.SetChangedComponent(en,comp);
        });
        entData.Components.push(comp);
        const newBucket = this.FindMakeBucket(entData.Components);
        newBucket.ChangeEntityToThisBucket(entData);
        comp.onComponentAdded(entData);
    }

    ResetChangedComponents() {
        for(let ent in this.ChangedComponents) {
            const entId = parseInt(ent);
            const comps = this.ChangedComponents[entId];
            const data = this.getEntData(entId);
            if(data === undefined) {
                continue;
            }
            for(var c = 0; c < comps.length;c++) {
                const comp = comps[c];
                const component = data.GetComponentByName(comp);
                if(component === undefined){
                    continue;
                }
                component.onComponentChanged(data);
            }
        }
        this.ChangedComponents = {};
    }

    IsChangedComponent(en:number | EntityData, comp:typeof Component) {
        const entId = this.getEntId(en);
        if(!entId) {
            return false;
        }
        if(!this.ChangedComponents[entId]) {
            return false;
        }
        return this.ChangedComponents[entId].includes(comp.prototype.constructor.name);
    }

    SetChangedComponent(en:number | EntityData, comp:Component) {
        const entId = this.getEntId(en);
        if(!entId) {
            return;
        }
        if(!this.ChangedComponents[entId]) {
            this.ChangedComponents[entId] = [];
        }

        const name = comp.constructor.name;
        if(!this.ChangedComponents[entId].includes(name)) {
            this.ChangedComponents[entId].push(name);
        }
    }
    
    private CreateEntity(entId:number):EntityData {
        const newEnt = new EntityData();
        newEnt.EntityId = entId;
        this.AllEntities[entId] = newEnt;
        const bucket = this.FindMakeBucket([]);
        bucket.ChangeEntityToThisBucket(newEnt);
        this.onEntityCreatedEv.notifyObservers(entId);
        newEnt.owningSystem = this;
        return newEnt;
    }

    private FindMakeBucket(comps:Component[]):EntityBucket {
        const compNames:string[] = [];
        comps.forEach(c=>{
            compNames.push(Component.GetComponentName(c));
        })
        for(var b = 0; b < this.EntityBuckets.length;b++) {
            if(ArraysContainEqualItems(this.EntityBuckets[b].SetComponents,compNames)) {
                return this.EntityBuckets[b];
            }
        }
        //New bucket
        const newBucket = new EntityBucket();
        comps.forEach(c=>{
            newBucket.SetComponents = compNames;
        })
        this.EntityBuckets.push(newBucket);
        return newBucket;
    }

    private getEntData(ent:number | EntityData) :EntityData {
        if (typeof ent === "number") {
            if(!this.EntityExists(ent)) {
                return new EntityData();
            }
            return this.GetEntityData(ent);
        } else {
            return ent;
        }
    }

    
    private getEntId(ent:number | EntityData) : number {
        if(ent === undefined) {
            return undefined;
        }
        if (typeof ent === "number") {
            return ent;
        } else {
            return ent.EntityId;
        }
    }

}