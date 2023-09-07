#pragma once
#include "Engine/Entities/EntitySystem.h"

//Generic Bullet capsule collider
struct CapsuleCollider : public Component {
    CPROPERTY(NET, SAVE)
    float Height = 1.6;
    CPROPERTY(NET, SAVE)
    float Width = 0.5;

    DECLARE_COMPONENT_METHODS(CapsuleCollider)
};