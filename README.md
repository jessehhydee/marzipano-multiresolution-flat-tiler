# marzipano-multiresolution-flat-tiler

This script creates multiple tile directories per image, that are suitable for Mazipano's '[Multiresolution Flat](https://www.marzipano.net/demos/flat/)'.

The script:
- Reads any images held under `./input/`, 
- Takes one argument; How many layers would you like as a number. Defualt is 4 if argument is not passed,
- Splits/tiles each image into how ever many tiles each layer requires per Mazipanos specifications,
- Per image, supplies the layer information Mazipano requires in the terminal - simply copy and paste into your source code

Run script in terminal: `node index.js`
