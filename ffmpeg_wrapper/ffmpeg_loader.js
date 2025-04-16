// show-args.js

const { spawn } = require('child_process');

// Get all arguments passed to the script (excluding the first two: node and script path)
const args = process.argv.slice(2);

// Modify -vf filter if present
args.forEach((arg, index) => {
	
	
	if (arg === '-b:v') {
    args[index + 1] = "0";
  }
	
	if (arg === '-maxrate') {
		args[index] = "-cq";
    args[index + 1] = "20";
  }
  
  if (arg === '-bufsize') {
		args[index] = "-preset";
    args[index + 1] = "p4";
  }
  
  
  //H264
   if (arg === '-codec:v:0') {
    args[index + 1] = "h264_nvenc";
  }
  
   if (arg === '-tag:v:0') {
    args[index + 1] = "avc1";
  }
  
  if (arg === '-vf') {
    const newFilter = "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709,libplacebo=w=iw*2:h=ih*2:custom_shader_path='shaders/Anime4K_Upscale_Denoise_CNN_x2_VL.glsl',drawtext=text='●':x=10:y=10:fontsize=15:fontcolor=green,format=yuv420p"
    args[index + 1] = newFilter;
  }
});


console.log("Running ffmpeg with arguments:");
console.log(args.join(' '));

// Spawn ffmpeg with the updated args
const ffmpeg = spawn('ffmpeg', args, { stdio: 'inherit' });

ffmpeg.on('exit', (code) => {
  console.log(`ffmpeg exited with code ${code}`);
});