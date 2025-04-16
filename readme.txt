How I built FFMPEG in MSYS2 on Windows

//all the things needed plus some duplicates

pacman -Syu

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

Now first roadblock, IF you need to enable-libvpl then follow else skip
[--enable-libvpl]

pacman -S mingw-w64-x86_64-cmake
pacman -S mingw-w64-x86_64-make mingw-w64-x86_64-ninja
pacman -S mingw-w64-x86_64-gcc

cd ~
git clone https://github.com/intel/libvpl
cd libvpl
export VPL_INSTALL_DIR=`pwd`/../_vplinstall


cd ~/libvpl
mkdir -p build && cd build

cmake .. \
  -G "MinGW Makefiles" \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_TOOLS=OFF \
  -DCMAKE_INSTALL_PREFIX=/mingw64

mingw32-make -j$(nproc)
mingw32-make install

That's it, you built it and installed.

Now well... time for NoVideo CUDA

[--enable-cuda  
--enable-cuvid 
--enable-nvdec 
--enable-nvenc

--enable-ffnvcodec 

--enable-cuda-nvcc]

Download the CUDA toolkit, I've downloaded 11.8 as I need it for a TESLA P4

https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64&target_version=11&target_type=exe_local

Then symlink it so the compiler can find it

mkdir -p /mingw64/cuda
ln -s "/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/include" /mingw64/cuda/include
ln -s "/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/lib/x64" /mingw64/cuda/lib

---------These are needed for NVCC (scale_cuda)-------
export PATH="/c/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/bin:$PATH"
export PATH="/c/Program Files (x86)/Microsoft Visual Studio/2019/BuildTools/VC/Tools/MSVC/14.29.30133/bin/Hostx64/x64:$PATH"
---------------

//now we need ffnvcodec, I needed 12.2 still TESLA P4

git clone https://github.com/FFmpeg/nv-codec-headers.git
cd nv-codec-headers
git checkout n12.2.72.0
make install PREFIX=/mingw64

----------------------------removed-----------------------

These have been removed and still need to be added

--enable-libsvtav1
--enable-opencl
--enable-amf 

--enable-cuda-llvm
This didnt work
pacman -S mingw-w64-x86_64-llvm 

----------------BUILD TIME------------------------------

cd into jellyfin-ffmpeg and let it rip

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


make -j$(nproc)
