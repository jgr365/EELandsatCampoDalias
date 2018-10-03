var landsat = ee.ImageCollection("LANDSAT/LC8_L1T"),
    punto = /* color: #ff2009 */ee.Geometry.Point([-2.7513248243908492, 36.728433336535176]);

// Visualizar Datos del mapa 
  var image = ee.Image(landsat
    //filtrar por fechas
    .filterDate ('2014-01-01','2017-12-31')
    
    //filtrar imagenes en un punto especifico
    .filterBounds (punto)
    
    //ordenar la coleccion por propiedades de Metadatos
    .sort('CLOUD_COVER')
    
    //Obtener la primera imagen de la coleccion
    .first());
    
  
 // Visualizar imagen como un string (por sus metadatos)
print('imagen landsat',image);

// Apartir de ahora, analizar las imagenes con Verdadero y Falso Color
// Color verdadero
/*var trueColor = {
  bands: ['B4','B3','B2'],
  min: 8500,
  max: 23000,
};
Map.addLayer(image, trueColor, 'true-color image');*/

//Falso Color (Vegetacion)

var falseColor = {
  bands: ['B5','B4','B3'],
  min: 7500,
  max: 24000,
};

Map.addLayer (image, falseColor, 'Falso Color');

// visualizar valores de radiancia

/*var bands = ['B1','B2','B3','B4','B5','B6','B7','B10','B11'];

// seleccionar bandas de interes
var dnImage = image.select(bands);

// transformar de numeros digitales a radiancia

var radiancia = ee.Algorithms.Landsat.calibratedRadiance(dnImage);

//mostrar resultado
var radParams = {
  bands: ['B4','B3','B2'],
  min: 0, 
  max: 100
};
Map.addLayer (radiancia, radParams, 'radiancia');*/