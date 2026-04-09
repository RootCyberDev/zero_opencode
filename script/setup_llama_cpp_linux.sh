#!/usr/bin/env bash
set -euo pipefail

# Basado en la documentación oficial de llama.cpp:
# - https://github.com/ggml-org/llama.cpp
# - llama-server / --hf-repo / --hf-file / CUDA build

LLAMA_CPP_HOME="${LLAMA_CPP_HOME:-$HOME/.local/share/zeroagents/llama.cpp}"
LLAMA_CPP_REPO="${LLAMA_CPP_REPO:-https://github.com/ggml-org/llama.cpp.git}"
LLAMA_CPP_SRC="${LLAMA_CPP_SRC:-$LLAMA_CPP_HOME/src}"
LLAMA_CPP_BUILD="${LLAMA_CPP_BUILD:-$LLAMA_CPP_SRC/build}"
LLAMA_SERVER_BIN="${LLAMA_SERVER_BIN:-$LLAMA_CPP_BUILD/bin/llama-server}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8001}"
API_KEY="${API_KEY:-change-me}"
HF_HOME="${HF_HOME:-$LLAMA_CPP_HOME/huggingface}"
HUGGINGFACE_HUB_CACHE="${HUGGINGFACE_HUB_CACHE:-$HF_HOME/hub}"
HF_REPO="${HF_REPO:-unsloth/Qwen3.5-9B-GGUF}"
HF_FILE="${HF_FILE:-Qwen3.5-9B-Q8_0.gguf}"
CTX_SIZE="${CTX_SIZE:-131072}"
N_GPU_LAYERS="${N_GPU_LAYERS:-999}"
PARALLEL="${PARALLEL:-1}"
CONT_BATCHING="${CONT_BATCHING:-1}"
JINJA="${JINJA:-1}"
SYSTEMD_SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-zeroagents-llama-cpp}"
SYSTEMD_UNIT_PATH="${SYSTEMD_UNIT_PATH:-/etc/systemd/system/${SYSTEMD_SERVICE_NAME}.service}"
RUN_AS_USER="${RUN_AS_USER:-$USER}"
PURGE_DATA="${PURGE_DATA:-0}"

usage() {
  cat <<'EOF'
Uso:
  bash scripts/setup_llama_cpp_linux.sh install
  bash scripts/setup_llama_cpp_linux.sh serve
  bash scripts/setup_llama_cpp_linux.sh health
  bash scripts/setup_llama_cpp_linux.sh uninstall

Variables útiles:
  LLAMA_CPP_HOME
  HF_HOME
  HF_REPO
  HF_FILE
  HOST
  PORT
  API_KEY
  CTX_SIZE
  N_GPU_LAYERS
  PARALLEL
  CONT_BATCHING=1
  JINJA=1
  SYSTEMD_SERVICE_NAME
  RUN_AS_USER
  PURGE_DATA=1
EOF
}

require_linux() {
  if [[ "${OSTYPE:-}" != linux* ]]; then
    echo "Este script solo soporta Linux."
    exit 1
  fi
}

require_sudo() {
  if ! command -v sudo >/dev/null 2>&1; then
    echo "No se encontró sudo. Se requiere para instalar o desinstalar el servicio systemd."
    exit 1
  fi
}

require_nvidia() {
  if ! command -v nvidia-smi >/dev/null 2>&1; then
    echo "No se encontró nvidia-smi. Verifica drivers NVIDIA antes de instalar llama.cpp con CUDA."
    exit 1
  fi
}

ensure_apt_package() {
  local package="$1"
  if dpkg -s "$package" >/dev/null 2>&1; then
    return 0
  fi
  sudo apt-get update
  sudo apt-get install -y "$package"
}

ensure_system_dependencies() {
  require_linux
  require_sudo
  require_nvidia

  if command -v apt-get >/dev/null 2>&1 && command -v dpkg >/dev/null 2>&1; then
    ensure_apt_package build-essential
    ensure_apt_package gcc
    ensure_apt_package g++
    ensure_apt_package cmake
    ensure_apt_package git
    ensure_apt_package curl
    ensure_apt_package pkg-config
    ensure_apt_package libssl-dev
  else
    echo "No se detectó apt-get. Instala manualmente build-essential, cmake, git, curl, gcc, g++, pkg-config y libssl-dev."
    exit 1
  fi

  if ! ldconfig -p | grep -q "libcuda.so.1"; then
    echo "No se encontró libcuda.so.1 en ldconfig. Verifica drivers NVIDIA y runtime CUDA del host."
    exit 1
  fi
}

prepare_cache() {
  mkdir -p "$HF_HOME" "$HUGGINGFACE_HUB_CACHE" "$LLAMA_CPP_HOME/models"
  find "$HF_HOME" -name "*.lock" -delete 2>/dev/null || true
  chown -R "${RUN_AS_USER}:${RUN_AS_USER}" "$LLAMA_CPP_HOME" "$HF_HOME" 2>/dev/null || true
}

build_llama_cpp() {
  if [[ ! -d "$LLAMA_CPP_SRC/.git" ]]; then
    git clone --depth=1 "$LLAMA_CPP_REPO" "$LLAMA_CPP_SRC"
  else
    git -C "$LLAMA_CPP_SRC" pull --ff-only
  fi

  cmake -S "$LLAMA_CPP_SRC" -B "$LLAMA_CPP_BUILD" -DGGML_CUDA=ON -DLLAMA_CURL=ON -DLLAMA_OPENSSL=ON
  cmake --build "$LLAMA_CPP_BUILD" --config Release -j"$(nproc)"
}

build_server_args() {
  local args=(
    --hf-repo "$HF_REPO"
    --hf-file "$HF_FILE"
    --host "$HOST"
    --port "$PORT"
    --ctx-size "$CTX_SIZE"
    --cache-type-k q4_0
    --cache-type-v q4_0
    --parallel "$PARALLEL"
    --n-gpu-layers "$N_GPU_LAYERS"
    --api-key "$API_KEY"
  )

  if [[ "$CONT_BATCHING" == "1" ]]; then
    args+=(--cont-batching)
  fi

  if [[ "$JINJA" == "1" ]]; then
    args+=(--jinja)
  fi

  printf '%q ' "${args[@]}"
}

install_llama_cpp() {
  ensure_system_dependencies
  require_sudo

  mkdir -p "$LLAMA_CPP_HOME"
  prepare_cache
  build_llama_cpp

  if [[ ! -x "$LLAMA_SERVER_BIN" ]]; then
    echo "No se encontró llama-server en $LLAMA_SERVER_BIN"
    exit 1
  fi

  sudo mkdir -p /etc/systemd/system
  sudo tee "$SYSTEMD_UNIT_PATH" >/dev/null <<EOF
[Unit]
Description=ZeroAgents llama.cpp Service
After=network-online.target
Wants=network-online.target
After=nvidia-persistenced.service
Wants=nvidia-persistenced.service
After=nvidia-fabricmanager.service
Wants=nvidia-fabricmanager.service

[Service]
Type=simple
User=${RUN_AS_USER}
WorkingDirectory=${LLAMA_CPP_HOME}
Environment=HOME=${HOME}
Environment=HF_HOME=${HF_HOME}
Environment=HUGGINGFACE_HUB_CACHE=${HUGGINGFACE_HUB_CACHE}
ExecStartPre=/usr/bin/test -e /dev/nvidiactl
ExecStartPre=/usr/bin/test -e /dev/nvidia0
ExecStart=${LLAMA_SERVER_BIN} $(build_server_args)
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable --now "$SYSTEMD_SERVICE_NAME"

  echo "Servicio instalado y levantado: $SYSTEMD_SERVICE_NAME"
  sudo systemctl --no-pager --full status "$SYSTEMD_SERVICE_NAME" || true
}

serve_llama_cpp() {
  if [[ ! -x "$LLAMA_SERVER_BIN" ]]; then
    echo "No se encontró llama-server. Ejecuta primero: bash scripts/setup_llama_cpp_linux.sh install"
    exit 1
  fi

  prepare_cache

  HF_HOME="$HF_HOME" \
  HUGGINGFACE_HUB_CACHE="$HUGGINGFACE_HUB_CACHE" \
  exec "$LLAMA_SERVER_BIN" $(build_server_args)
}

uninstall_llama_cpp() {
  require_linux
  require_sudo

  if sudo test -f "$SYSTEMD_UNIT_PATH"; then
    sudo systemctl stop "$SYSTEMD_SERVICE_NAME" || true
    sudo systemctl disable "$SYSTEMD_SERVICE_NAME" || true
    sudo rm -f "$SYSTEMD_UNIT_PATH"
    sudo systemctl daemon-reload
    sudo systemctl reset-failed || true
    echo "Servicio eliminado: $SYSTEMD_SERVICE_NAME"
  fi

  if [[ "$PURGE_DATA" == "1" ]]; then
    rm -rf "$LLAMA_CPP_HOME"
    echo "Instalación local eliminada: $LLAMA_CPP_HOME"
  else
    echo "La instalación local se conserva en: $LLAMA_CPP_HOME"
    echo "Usa PURGE_DATA=1 para eliminarla completamente."
  fi
}

COMMAND="${1:-}"

case "$COMMAND" in
  install)
    install_llama_cpp
    ;;
  serve)
    serve_llama_cpp
    ;;
  health)
    curl -fsS -H "Authorization: Bearer $API_KEY" "http://localhost:${PORT}/health"
    echo
    echo "llama.cpp responde correctamente en http://localhost:${PORT}"
    ;;
  uninstall)
    uninstall_llama_cpp
    ;;
  *)
    usage
    exit 1
    ;;
esac
