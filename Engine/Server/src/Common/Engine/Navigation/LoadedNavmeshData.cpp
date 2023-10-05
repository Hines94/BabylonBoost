#include "LoadedNavmeshData.h"
#include "NavmeshBuildSystemDebugMethods.cpp"
#include "recastnavigation/DetourCommon.h"
#include "recastnavigation/DetourMath.h"
#include "recastnavigation/DetourNavMeshQuery.h"
#include <cstdlib>

float frand() {
    return static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
}

void LoadedNavmeshData::onComponentAdded(EntityData* entData) {
    if (navmeshData.empty()) {
        std::cerr << "Navmesh data is empty" << std::endl;
        return;
    }
    try {
        //std::cout << "Navmesh data in size: " << navmeshData.size() << std::endl;
        auto status = loadednavmesh.init(navmeshData.data(), navmeshData.size(), DT_TILE_FREE_DATA);
        if (!dtStatusSucceed(status)) {
            std::cerr << "Failed to init navmesh with saved data: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " Data length: " << navmeshData.size() << std::endl;
        } else {
            std::cout << "Navmesh loaded succesfully. Num walkable polys: " << countWalkablePolygons() << ". num non walkable: " << countNonWalkablePolygons() << ". Num meshes in: " << savedSetup.size() << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error loading navmesh: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "Error loading navmesh: Unknown Error" << std::endl;
    }
}

bool LoadedNavmeshData::IsNavmeshValid() {
    // Check if there are tiles in the navmesh
    if (this->loadednavmesh.getMaxTiles() == 0) {
        std::cerr << "Navmesh not valid. 0 max tiles!" << std::endl;
        return false;
    }

    return true;
}

dtNavMeshQuery* LoadedNavmeshData::GetPremadeQuery(int maxNodes) {
    dtNavMeshQuery* navQuery = dtAllocNavMeshQuery();
    navQuery->init(&this->loadednavmesh, maxNodes);
    return navQuery;
}

std::optional<EntVector3> LoadedNavmeshData::GetRandomPointOnNavmesh() {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    const auto navQuery = GetPremadeQuery();

    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);
    float randomPt[3] = {0, 0, 0};
    dtPolyRef randomPoly;
    dtStatus status = navQuery->findRandomPoint(&filter, frand, &randomPoly, randomPt);

    if (dtStatusSucceed(status)) {
        dtFreeNavMeshQuery(navQuery);
        return EntVector3(randomPt[0], randomPt[1], randomPt[2]);
    } else {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get random point" << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}

std::optional<EntVector3> LoadedNavmeshData::GetRandomPointOnNavmeshInCircle(EntVector3 startPos, float maxRadius) {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    auto navQuery = GetPremadeQuery();

    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);

    float centerPos[3] = {startPos.X, startPos.Y, startPos.Z};
    float extents[3] = {maxRadius / 2, 100, maxRadius / 2};
    dtPolyRef centerPoly;
    dtStatus status = navQuery->findNearestPoly(centerPos, extents, &filter, &centerPoly, nullptr); // Get the polygon for the center position
    if (!dtStatusSucceed(status)) {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get nearest poly." << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }

    dtPolyRef randomPoly;
    float randomPt[3];
    dtFreeNavMeshQuery(navQuery);
    navQuery = GetPremadeQuery();
    status = navQuery->findRandomPointAroundCircle(centerPoly, centerPos, maxRadius, &filter, frand, &randomPoly, randomPt);

    if (dtStatusSucceed(status)) {
        dtFreeNavMeshQuery(navQuery);
        return EntVector3(randomPt[0], randomPt[1], randomPt[2]);
    } else {
        std::cerr << "Nav query failed " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get random point" << std::endl;

        if (!this->loadednavmesh.isValidPolyRef(centerPoly)) {
            std::cout << "Nav query failed from isValidPolyRef on centerPoly" << std::endl;
        }
        if (!dtVisfinite(centerPos)) {
            std::cout << "Nav query failed from center pos" << std::endl;
        }
        if (maxRadius < 0 || !dtMathIsfinite(maxRadius)) {
            std::cout << "Nav query failed from radius!" << std::endl;
        }

        //Is filter fail?
        const dtMeshTile* startTile = 0;
        const dtPoly* startPoly = 0;
        this->loadednavmesh.getTileAndPolyByRefUnsafe(centerPoly, &startTile, &startPoly);
        if (!filter.passFilter(centerPoly, startTile, startPoly)) {
            std::cout << "Nav query failed from filter! startPoly flags: " << startPoly->flags << std::endl;
        }

        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}

int LoadedNavmeshData::countWalkablePolygons() {
    int walkablePolyCount = 0;

    for (int i = 0; i < this->loadednavmesh.getMaxTiles(); ++i) {
        const dtMeshTile* tile = this->loadednavmesh.getTileAt(i, 0, 0);
        if (!tile) {
            continue;
        }
        for (int j = 0; j < tile->header->polyCount; ++j) {
            const dtPoly* poly = &tile->polys[j];

            // Check if the polygon is used and walkable
            if (poly->getArea() != RC_NULL_AREA && poly->flags != 0) {
                ++walkablePolyCount;
            }
        }
    }

    return walkablePolyCount;
}

int LoadedNavmeshData::countNonWalkablePolygons() {
    int nonWalkCount = 0;

    for (int i = 0; i < this->loadednavmesh.getMaxTiles(); ++i) {
        const dtMeshTile* tile = this->loadednavmesh.getTileAt(i, 0, 0);
        if (!tile) {
            continue;
        }
        for (int j = 0; j < tile->header->polyCount; ++j) {
            const dtPoly* poly = &tile->polys[j];

            // Check if the polygon is used and walkable
            if (poly->getArea() == RC_NULL_AREA || poly->flags == 0) {
                ++nonWalkCount;
            }
        }
    }

    return nonWalkCount;
}