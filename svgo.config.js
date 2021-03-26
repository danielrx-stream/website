module.exports = {
  multipass: false,
  js2svg: {
    indent: 4,
    pretty: true,
  },
    plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'removeUselessDefs',
    'cleanupNumericValues',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'cleanupEnableBackground',
    'removeEmptyText',
    'convertEllipseToCircle',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'removeUnusedNS',
    'removeTitle',
    'removeDesc'
  ]
}