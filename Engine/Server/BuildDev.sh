#!/bin/bash

cd() {
    RED='\033[0;31m'
    RESET='\033[0m'
    builtin cd "$@" || { echo -e "${RED}Failed to change directory${RESET}" >&2; exit 1; }
}
to_lower() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

base_path="$(cd "$(dirname "$0")" && pwd)"
build_dir=${base_path}/build
server_build_dir=${build_dir}/server_build
wasm_build_dir=${build_dir}/wasm_build
run_tests=0
project_Name=BabylonBoost
project_Name_Lower=$(to_lower "${project_Name}")

cd ${base_path}

# Define color variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

set -e

# --- PARAMETER PARSING SECTION --- #

while [ $# -gt 0 ]; do
  case "$1" in
    -t|--test)
      run_tests=1
      shift
      ;;
    --nowasm)
      no_wasm=1
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
  esac
done

# --- END PARAMETER PARSING SECTION --- #

# --- PATH TO CLIENT SECTION --- #

CLIENT_INSTALLATION_PATH="${base_path}/../Client/src"
mkdir -p "$CLIENT_INSTALLATION_PATH/Autogenerated"


# --- END PATH TO CLIENT SECTION --- #

# --- TOOLS MISC SECTION --- #

echo -e "${MAGENTA}Starting Prometheus${RESET}"
cd Tools/prometheus-2.44.0.linux-amd64
./prometheus --config.file=prometheus.yml > /dev/null 2>&1 &
cd ../../

echo -e "${MAGENTA}Creating new build directories${RESET}"
mkdir -p "$build_dir"
cd "$build_dir"
mkdir -p "$server_build_dir"
mkdir -p "$wasm_build_dir"
cd "../"

echo -e "${MAGENTA}Copying .env file${RESET}"
cp ./.env "$server_build_dir/.env"
cp ./.env "$wasm_build_dir/.env"

# --- END TOOLS MISC SECTION --- #

# --- AUTOGENERATION SECTION --- #

echo -e "${MAGENTA}Autogenerating Files${RESET}"
cd "Tools/Autogeneration" 
if [ "Autogenerator.ts" -nt "build/Autogenerator.js" ]; then
  echo "Autogenerator.ts has been changed. Recompiling..."
  tsc Autogenerator.ts --outDir build --esModuleInterop
else
  echo "Autogenerator.js is up to date. Skipping compilation. To force recompile re-save Autogenerator.ts"
fi
cd build
if ! node Autogenerator.js;
  then echo -e "${RED}Code Autogeneration Failed. Exiting.${RESET}" 
  exit 1 
fi 

cp ${build_dir}/Autogeneration/ClientTypings_autogenerated.ts $CLIENT_INSTALLATION_PATH/Autogenerated/${project_Name}_ServerTypings_autogenerated.ts || exit

# --- END AUTOGENERATION SECTION --- #

# --- BUILD SECTION --- #

echo -e "${MAGENTA}Building Server${RESET}"
cd "$server_build_dir"
cmake -G "Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE=Tools/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Debug  ../../
cmake --build . --config Debug --parallel 8

# --- END BUILD SECTION --- #

# --- WASM SECTION --- #

if [ -z "$no_wasm" ]; then
    echo -e "${MAGENTA}Building WASM${RESET}"
    cd "$wasm_build_dir"
    source ${base_path}/Tools/Emscripten/emsdk/emsdk_env.sh
    emmake cmake -G "Unix Makefiles" \
      -DCMAKE_TOOLCHAIN_FILE=${base_path}/Tools/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Debug \
      -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=${base_path}/Tools/Emscripten/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_BUILD_TYPE=Debug  ../../
    cmake --build . --config Debug --parallel 8

    #Copy WASM files over to client
    cp ./${project_Name_Lower}_WASM_autogenerated.wasm "${CLIENT_INSTALLATION_PATH}/Autogenerated/${project_Name}_WASM_autogenerated.wasm"
    cp ./${project_Name_Lower}_WASM_autogenerated.js "${CLIENT_INSTALLATION_PATH}/Autogenerated/${project_Name}_WASM_autogenerated.js"
fi

# --- END WASM SECTION --- #

# --- TEST SECTION --- #

if [ $? -eq 0 ]
then
  #Run tests?
  if [ $run_tests -eq 1 ]; then
    echo -e "${MAGENTA}Running Unit Tests...${RESET}"
    cd "$server_build_dir"
    ./runUnitTests --output-on-failure  --gtest_also_run_disabled_tests
    if [ $? -ne 0 ]; then
      echo -e "${RED}Server Unit Tests failed${RESET}"
      exit 1
    fi

    if [ -z "$no_wasm" ]; then
      cd "$wasm_build_dir"
      ctest -V
    fi
    
  fi
  ##All good - start server
  echo -e "${MAGENTA}Build Done${RESET}"
  exit 0
else
  #Failed - exit
  echo -e "${RED}Build failed${RESET}"
  exit 1
fi

# --- END TEST SECTION --- #