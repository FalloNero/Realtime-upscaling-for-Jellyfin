# Building FFMPEG in MSYS2 on Windows

## PreBuilt Libraries

For convenience, you can skip the build process by using the prebuilt binaries:

1. Copy the prebuilt ffmpeg.exe and all its DLLs from the ffmpeg_prebuilt folder or
2. Skip directly to the [Integrating with Jellyfin](#integrating-with-jellyfin) section

Note: The precompiled FFmpeg provided has been built without the `--enable-nonfree` flag, so `libfdk_aac`, `cuda-nvcc`, and `cuda-llvm` are not present. If you need these features, you'll need to build FFmpeg from source following the instructions below, which shouldn't be difficult.

Or follow the instructions below to build FFmpeg from source.

## Prerequisites

Before starting, ensure you have the following installed on your Windows system:
- MSYS2 (Mingw64 shell)
- Node.js (required for the transcoding script)
- Upscaling GLSL shader
1. Anime4K GLSL shaders ([available here](https://github.com/bloc97/Anime4K/tree/master))
2. FSR GLSL shader ([available here](https://gist.github.com/agyild/7e8951915b2bf24526a9343d951db214))
- A Vulkan-capable GPU (required for the Anime4K filter or any other GLSL filter)

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
pacman -S mingw-w64-x86_64-llvm
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

To enable NVIDIA CUDA support(for `--enable-cuda`, `--enable-cuvid`, `--enable-nvdec`, `--enable-nvenc`, `enable-cuda-llvm`), follow these steps:

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

## Optional: AMF Support

To enable AMF support (for `--enable-amf`), follow these steps:

1. **Clone the AMF SDK**  
   First, clone the AMF SDK repository:

   ```bash
   git clone --recurse-submodules https://github.com/GPUOpen-LibrariesAndSDKs/AMF.git
   ```

2. **Move the AMF SDK files**  
   Next, move the required files into the appropriate directories. Here's a quick way to do it:

   ```bash
   mv /AMF/amf/public/include/* /AMF/amf/
   ```

3. **Add the AMF include directory to the compiler flags**  
   I was really fed up with the compiler not finding this, so I just added the full path to the command (you can remove it if not necessary for your setup):

   ```bash
   --extra-cflags="-I<J:/msys64/home/Admin/AMF>"
   ```

   Be sure to replace `<J:/msys64/home/Admin/AMF>` with the actual path where AMF is located on your system.


## Optional: AV1 

To enable AV1 support (for `--enable-libsvtav1`), follow these steps:

1. Fix a line in `jellyfin-ffmpeg/libavcodec/libsvtav1.c`

	```bash
	svt_ret = svt_av1_enc_init_handle(&svt_enc->svt_handle, svt_enc, &svt_enc->enc_params);```
	to
	```bash
	svt_ret = svt_av1_enc_init_handle(&svt_enc->svt_handle, &svt_enc->enc_params);```
	
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
  --enable-opencl \
  --enable-cuda-llvm \
  --enable-libsvtav1 \
  --pkg-config-flags="--static" \
  --extra-cflags="-I/mingw64/cuda/include -I/mingw64/codec/include -IJ:/msys64/home/Admin/AMF" \
  --extra-ldflags="-L/mingw64/cuda/lib -L/mingw64/codec/lib" \
  --enable-nonfree

# Build using all available CPU cores
make -j$(nproc)
```

## Integrating with Jellyfin

After successfully building FFmpeg, you'll need to integrate it with Jellyfin for enhanced video transcoding capabilities:

### 1. Gathering Required DLLs

While building FFmpeg statically is possible, it requires all packages to be built from source rather than using prebuilt versions. For convenience, prebuilt DLLs are included in the `prebuilt` folder of this repository.

### 2. Replacing FFmpeg in Jellyfin

1. Copy your built FFmpeg executable and necessary DLLs to the Jellyfin server directory.
2. Create a `shaders` folder in the same directory as `ffmpeg.exe` and copy the Anime4K GLSL shaders there.

### 3. Setting Up the Transcoding Script

1. Copy the provided `.bat` script to the Jellyfin server folder. This script redirects FFmpeg commands through Node.js to modify the transcoding parameters and inject the Anime4K filter.
2. Edit Jellyfin's encoding configuration file located at `AppData\Local\Jellyfin\config\encoding.xml` to point to the batch script:

```xml
<EncoderAppPath>C:\Program Files\Jellyfin\Server\ffmpeg.bat</EncoderAppPath>
<EncoderAppPathDisplay>C:\Program Files\Jellyfin\Server\ffmpeg.bat</EncoderAppPathDisplay>
```

### 4. Understanding the Upscaling Implementation

This setup employs a slightly unconventional approach:
- By default, Jellyfin only transcodes when the requested quality is lower than the video bitrate.
- The provided scripts bypass quality reduction and instead apply upscaling.
- **Note:** This means you will lose the ability to lower quality for bandwidth-constrained situations.
- A green dot indicator will appear in the top-left corner of the video when the upscaling is working correctly.
