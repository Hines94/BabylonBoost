#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <unordered_map>

//Includes methods to load a component in fresh from the type (name)
namespace ComponentLoader {
    //Autogenerated in ComponentLoader_autogenerated.cpp
    Component* GetComponentFromName(const std::string& Name);
    std::type_index GetTypeFromComponent(Component* comp);
    //Easy util - uses GetComponent behind scenes
    std::type_index GetComponentTypeFromName(const std::string& Name);
    //Autogenerated in ComponentLoader_autogenerated.cpp
    std::string GetComponentNameFromType(const std::type_index& Type);
    //Autogenerated in ComponentLoader_autogenerated.cpp
    std::string GetNameFromComponent(Component* comp);

    Component* GetDefaultComponent(const std::string& Name);

    bool ShouldSaveComponent(const std::type_index& CompType);
    bool ShouldNetworkComponent(const std::type_index& CompType);

    static std::unordered_map<std::string, std::type_index> TypesToNames;
    static std::unordered_map<std::string, Component*> DefaultComponents;

} // namespace ComponentLoader