#pragma once
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>
#include "tiny_gltf.h"
#include <optional>

class ModelLoader {
public:
    // Delete copy constructor and assignment operator
    ModelLoader(ModelLoader const&) = delete;
    void operator=(ModelLoader const&) = delete;

    // Access function for the unique Singleton instance
    static ModelLoader& getInstance() {
        // This is thread-safe in C++11 and later
        static ModelLoader instance;
        return instance;
    }

    std::optional<tinygltf::Model> GetModelFromFile(std::string filePath, int fileIndex);

private:
    // Private constructor so that no objects can be created
    ModelLoader() {}

    static std::mutex dataMutex;

    std::unordered_map<std::string, std::vector<uint8_t>> cachedModelData;

    std::map<std::string,tinygltf::Model> loadedModels;
};