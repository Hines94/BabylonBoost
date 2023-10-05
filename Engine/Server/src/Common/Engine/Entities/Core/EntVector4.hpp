#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <msgpack.hpp>
#include <nlohmann/json.hpp>

struct EntVector4 {
    //Tracked for changes if vector4 is tracked
    CPROPERTY(float, X, NO_DEFAULT);
    //Tracked for changes if vector4 is tracked
    CPROPERTY(float, Y, NO_DEFAULT);
    //Tracked for changes if vector4 is tracked
    CPROPERTY(float, Z, NO_DEFAULT);
    //Tracked for changes if vector4 is tracked
    CPROPERTY(float, W, NO_DEFAULT);

    EntVector4(float x = 0.0f, float y = 0.0f, float z = 0.0f, float w = 0.0f)
        : X(x), Y(y), Z(z), W(w) {}

    bool operator==(const EntVector4& other) const {
        return X == other.X && Y == other.Y && Z == other.Z && W == other.W;
    }

    bool operator!=(const EntVector4& other) const {
        return !(*this == other);
    }

    friend std::ostream& operator<<(std::ostream& os, const EntVector4& obj);

    void Set(EntVector4 other) {
        X = other.X;
        Y = other.Y;
        Z = other.Z;
        W = other.W;
    }

    //TODO: This could potentially be more efficient by storing as a Array but far harder client side
    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::map<std::string, float> data = {{"X", X}, {"Y", Y}, {"Z", Z}, {"W", W}};
        pk.pack(data);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::map<std::string, float> data;
        o.convert(data);
        X = data["X"];
        Y = data["Y"];
        Z = data["Z"];
        W = data["W"];
    }
};

//---- AUTOGENERATED ---
#include "Engine/Entities/Core/EntVector4_autogenerated.h"
//--- AUTOGENERATED END ---