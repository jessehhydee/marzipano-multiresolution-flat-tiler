const fs    = require('fs');
const sharp = require('sharp');

const args            = process.argv.slice(2);
const imagesDir       = 'input';
const outputDir       = 'output';
const images          = [];
const amountOfLayers  = args.length ? args[0] : 4;
let   smallestImageDimensions;

const getImages = async () => {

  const dirs = await fs.promises.readdir(`${imagesDir}/`);

  for(const filePath of dirs) {

    if(filePath === '.gitkeep') continue;
    if(fs.lstatSync(`${imagesDir}/${filePath}`).isDirectory()) continue;
    images.push(`${imagesDir}/${filePath}`);
    
  }

  console.log('..\x1b[92mImages fetched\x1b[0m');

};

const tileImages = async () => {

  images.forEach(async image => {

    console.log('');

    const dimensions = await getImageDimensions(image);
    await resizeImages(image, dimensions);
    const resizedImgPath  = `${imagesDir}/resized-${splitImagePath(image).split('.')[0]}`;
    const allDimensions   = [];

    for(let i = 0; i < amountOfLayers; i++) {
      const dir               = createDir(`${outputDir}/${splitImagePath(image).split('.')[0]}/l${i}`);
      const resizedImage      = `${resizedImgPath}/l${i}.jpg`;
      const resizedDimensions = await getImageDimensions(resizedImage);
      allDimensions.push(resizedDimensions);

      if(i === 0) {
        smallestImageDimensions = resizedDimensions;
        fs.copyFileSync(resizedImage, `${dir}/0_0.jpg`);
        console.log(`..\x1b[36m${splitImagePath(image).split('.')[0]} - 1 Tile Dir Created\x1b[0m`);
      }
      else tileImage(image, resizedDimensions, resizedImage, dir);

      if(i === amountOfLayers - 1) printMaziConfig(allDimensions, smallestImageDimensions, image);
    }

  });

};

const getImageDimensions = async (imagePath) => {

  const metaData = await sharp(imagePath).metadata();

  return {
    w:  Math.floor(metaData.width),
    h:  Math.floor(metaData.height),
  };

};

const resizeImages = async (image, dimensions) => {

  const dir = createDir(`${imagesDir}/resized-${splitImagePath(image).split('.')[0]}`);

  for(let i = 0, previousWidth = dimensions.w; i < amountOfLayers; i++, previousWidth /= 2)
    await sharp(image).resize({width: Math.floor(previousWidth)}).toFile(`${dir}/l${(amountOfLayers - 1) - i}.jpg`);

  console.log(`..\x1b[92m${splitImagePath(image).split('.')[0]} - Image Resized\x1b[0m`);

};

const createDir = (dir) => {

  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;

};

const splitImagePath = (imagePath) => {
  return imagePath.split('/')[1];
};

const tileImage = (originalImage, resizedDimensions, resizedImage, dir) => {

  const widthTileAmount   = Math.ceil(resizedDimensions.w/smallestImageDimensions.w);
  const finalWidth        = resizedDimensions.w % smallestImageDimensions.w;
  const heightTileAmount  = Math.ceil(resizedDimensions.h/smallestImageDimensions.w);
  const finalHeight       = resizedDimensions.h % smallestImageDimensions.w;

  for(
    let i         = 0, 
    widthCounter  = 1,
    heightCounter = 1; i < widthTileAmount * heightTileAmount; i++) {
      
      let height = width = smallestImageDimensions.w;

      if(heightCounter  === heightTileAmount) height  = finalHeight > 0 ? finalHeight : height;
      if(widthCounter   === widthTileAmount)  width   = finalWidth > 0  ? finalWidth  : width;

      sharp(resizedImage)
      .extract({
        width:  width, 
        height: height, 
        left:   smallestImageDimensions.w * (widthCounter - 1), 
        top:    smallestImageDimensions.w * (heightCounter - 1)
      })
      .resize({
        width:  width,
        height: height
      })
      .toFile(`${dir}/${heightCounter - 1}_${widthCounter - 1}.jpg`);

      if(widthCounter === widthTileAmount) {
        heightCounter++;
        widthCounter = 1;
      }
      else widthCounter++;

  }

  console.log(`..\x1b[36m${splitImagePath(originalImage).split('.')[0]} - ${widthTileAmount * heightTileAmount} Tile Dir Created\x1b[0m`);

};

const printMaziConfig = (allDimensions, smallestImageDimensions, image) => {

  const maziConfig = allDimensions.map(el => {
    return {
      width:      el.w,
      heigth:     el.h,
      tileWidth:  smallestImageDimensions.w,
      tileHeight: smallestImageDimensions.w
    }
  });

  console.log(`..\x1b[36m${splitImagePath(image).split('.')[0]} - Mazipano Config:\x1b[0m`, maziConfig);

};

const run = async () => {

  console.log('');

  await getImages();
  await tileImages();

};

run();
