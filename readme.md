# Building FFMPEG in MSYS2 on Windows

This guide walks through the process of building FFMPEG from source using MSYS2 on Windows, including optional support for NVIDIA CUDA and Intel VPL.

## Prerequisites

Before starting, ensure you have MSYS2 properly installed on your Windows system.

## Basic Setup

First, update your MSYS2 installation and install the required dependencies:

```bash
pacman -Syu

# Install required packages
pacman -S mingw-w64-x86_64-chromaprint
pacman -S mingw-w64-x86_64-libass mingw-w64-x86_64-pkg-config
pacman -S mingw-w64-x86_64-libbluray
pacman -S mingw-w64-x86_64-dav1d
pacman -S mingw-w64-x86_64-fdk-aac
pacman -S mingw-w64-x86_64-lame
pacman -S mingw-w64-x86_64-libopenmpt
pacman -S mingw-w64-x86_64-libtheora
pacman -S mingw-w64-x86_64-libvpx
pacman -S mingw-w64-x86_64-libwebp
pacman -S mingw-w64-x86_64-x264
pacman -S mingw-w64-x86_64-opencl-headers
pacman -S nasm yasm
pacman -S diffutils
pacman -S make
```

## Optional: Build Intel VPL Support

If you need Intel VPL support (enabled with `--enable-libvpl`), follow these steps:

```bash
# Install additional dependencies for VPL
pacman -S mingw-w64-x86_64-cmake
pacman -S mingw-w64-x86_64-make mingw-w64-x86_64-ninja
pacman -S mingw-w64-x86_64-gcc

# Clone and build libvpl
cd ~
git clone https://github.com/intel/libvpl
cd libvpl
export VPL_INSTALL_DIR=`pwd`/../_vplinstall

mkdir -p build && cd build

cmake .. \
  -G "MinGW Makefiles" \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_TOOLS=OFF \
  -DCMAKE_INSTALL_PREFIX=/mingw64

mingw32-make -j$(nproc)
mingw32-make install
```

## Optional: NVIDIA CUDA Support

To enable NVIDIA CUDA support (for `--enable-cuda`, `--enable-cuvid`, `--enable-nvdec`, `--enable-nvenc`, etc.), follow these steps:

1. Download and install the NVIDIA CUDA toolkit from the [official website](https://developer.nvidia.com/cuda-downloads). This guide uses CUDA 11.8, compatible with TESLA P4.

2. Create symbolic links so the compiler can find CUDA:

```bash
mkdir -p /mingw64/cuda
ln -s "/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/include" /mingw64/cuda/include
ln -s "/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/lib/x64" /mingw64/cuda/lib
```

3. Set up the paths needed for NVCC (required for `scale_cuda`):

```bash
export PATH="/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/bin:$PATH"
export PATH="/c/Program Files (x86)/Microsoft Visual Studio/2019/BuildTools/VC/Tools/MSVC/14.29.30133/bin/Hostx64/x64:$PATH"
```

4. Install NVIDIA codec headers:

```bash
git clone https://github.com/FFmpeg/nv-codec-headers.git
cd nv-codec-headers
git checkout n12.2.72.0  # Using version 12.2 for TESLA P4 compatibility
make install PREFIX=/mingw64
```

## Building FFMPEG

Now we can build FFMPEG with our desired configuration:

```bash
# Navigate to your FFMPEG source directory
cd jellyfin-ffmpeg  # Or your FFMPEG source directory

./configure \
  --extra-version=Jellyfin \
  --disable-ffplay \
  --disable-debug \
  --disable-doc \
  --disable-sdl2 \
  --disable-ptx-compression \
  --enable-lto=thin \
  --enable-gpl \
  --enable-version3 \
  --enable-schannel \
  --enable-iconv \
  --enable-libxml2 \
  --enable-zlib \
  --enable-lzma \
  --enable-gmp \
  --enable-chromaprint \
  --enable-libfreetype \
  --enable-libfribidi \
  --enable-libfontconfig \
  --enable-libharfbuzz \
  --enable-libass \
  --enable-libbluray \
  --enable-libmp3lame \
  --enable-libopus \
  --enable-libtheora \
  --enable-libvorbis \
  --enable-libopenmpt \
  --enable-libwebp \
  --enable-libvpx \
  --enable-libzimg \
  --enable-libx264 \
  --enable-libx265 \
  --enable-libdav1d \
  --enable-libfdk-aac \
  --enable-dxva2 \
  --enable-d3d11va \
  --enable-d3d12va \
  --enable-libvpl \
  --enable-ffnvcodec \
  --enable-cuda \
  --enable-cuda-nvcc \
  --enable-cuvid \
  --enable-nvdec \
  --enable-nvenc \
  --enable-static \
  --disable-shared \
  --enable-ffnvcodec \
  --enable-libplacebo \
  --pkg-config-flags="--static" \
  --extra-cflags="-I/mingw64/cuda/include -I/mingw64/codec/include" \
  --extra-ldflags="-L/mingw64/cuda/lib -L/mingw64/codec/lib" \
  --enable-nonfree

# Build using all available CPU cores
make -j$(nproc)
```

## Notes

The following features were noted as removed but may be needed:
- `--enable-libsvtav1`
- `--enable-opencl`
- `--enable-amf`
- `--enable-cuda-llvm` (did not work with `pacman -S mingw-w64-x86_64-llvm`)


## License

This build configuration enables non-free components (`--enable-nonfree`), which may affect the licensing of your resulting binary. Ensure you understand the implications for your use case.