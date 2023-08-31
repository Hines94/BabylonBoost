#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ExtractedMeshData.hpp"

//A mesh that can be used to move about a Navigatable Pawn
REQUIRE_OTHER_COMPONENTS(EntTransform)
struct NavigatableMesh : public Component {
    CPROPERTY(NET, SAVE)
    std::string AwsPath;
    CPROPERTY(NET, SAVE)
    std::string MeshName;

    ExtractedModelData* extractedModelData;

    void onComponentRemoved(EntityData* entData);

    DECLARE_COMPONENT_METHODS(NavigatableMesh)
};