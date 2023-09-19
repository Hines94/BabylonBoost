#include "Engine/Entities/EntitySystem.h"

// Used to identify entities that are spawned from prefabs
struct Prefab : public Component {

    DECLARE_COMPONENT_METHODS(Prefab)

    //Prefab Instance owner - Owns the 'instance' of this prefab
    CPROPERTY(EntityData*, InstanceOwner, NO_DEFAULT, NET, SAVE, EDREAD)

    //UUID that can be used to identify saved prefabs and diff vs their default components
    CPROPERTY(std::string, PrefabIdentifier, NO_DEFAULT, NET, SAVE, EDREAD)

    //Entity index vs this prefab (i.e we are entity 1 in the prefab)
    CPROPERTY(uint, EntityIndex, NO_DEFAULT, NET, SAVE, EDREAD)
};