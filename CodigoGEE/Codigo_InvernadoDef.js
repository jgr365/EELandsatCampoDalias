var landsat = ee.ImageCollection("LANDSAT/LC8_L1T"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-2.757738659846268, 36.72266135148037],
          [-2.7567301492566685, 36.72317732471507],
          [-2.7577493886823277, 36.72532717588147],
          [-2.758790085780106, 36.72497460441564]]]);

          var image = ee.Image(landsat
    //filtrar por fechas
    .filterDate ('2014-01-10','2017-12-31')
    
    //filtrar imagenes en un punto especifico
    .filterBounds (geometry)
    
    //ordenar la coleccion por propiedades de Metadatos
    .sort('CLOUD_COVER')
    
    //Obtener la primera imagen fuera de la coleccion
    .first()
    
    // Sleccionar Bandas de trabajo
    .select (['B2','B3','B4','B5','B6','B7','B8','B10','B11']));
    
  // Visualizar imagen por metadatos
  
print('imagen landsat',image);

//Superficie Invernada
// Load an image and select some bands of interest.
//var image = ee.Image('LANDSAT/LC08/C01/T1/LC08_199035_20180428')
//    .select(['B4', 'B3', 'B2'])
//    .select (['B5','B4','B3'])
//    .select (['B7','B6','B4'])
//    .select (['B6','B5','B2'])
//    .select (['B5','B6','B4'])
//    .select (['B8'])
//    .select (['B10','B11'])
//    .select (['B8','B10','B11'])
//    .select (['B2','B3','B4','B5','B6','B7','B8','B10','B11']);
// Dibuja la imagen en el mapa
// Los colores con los que se pinta son un poco relativos, porque el mar sale muy oscuro
// pero creo que es una buena aproximacion al color natural del ojo humano.
Map.addLayer(image, {min: [6900, 8300, 8600], max: [15600, 15200, 15500],bands: ['B4','B3','B2']}, "Imagen al natural");
Map.addLayer(image, {min: [6300, 6900, 8300], max: [19000, 15600, 15200],bands: ['B5','B4','B3']}, "Imagen en infrarrojo");
Map.addLayer(image,{
  min:[5200, 5400, 6900],
  max:[11000, 14000, 15000],
  bands: ['B7','B6','B4'],
},
"Vision Urbana"
);


Map.addLayer(image,{
  min:[5300, 6300, 8600],
  max:[14800, 19500, 15500],
  bands: ['B6','B5','B2'],
},
"Agricultura"
);


Map.addLayer(image,{
  min:[6300, 5300, 6900],
  max:[19400, 14800, 15600],
  bands: ['B5','B6','B4'],
},
"Tierra-Agua"
);


Map.addLayer(image,{
  min:[7700],
  max:[14000],
  bands: ['B8'],
},
"Pancromatica"
);

Map.addLayer(image,{
  min:[24900, 23000],
  max:[26000, 24000],
  bands: ['B10','B11'],
},
"Humedad del Suelo"
);


Map.addLayer(image,{
  min:[7700, 24900, 23000],
  max:[13900, 26000, 24000],
  bands: ['B8','B10','B11'],
},
"Combinacion de prueba"
);

// REDUCTION PARAMS:
var region = geometry;

var reducer = ee.Reducer.minMax();

var reduced = image.reduceRegion(reducer, region);

var reducedGetInfo = reduced.getInfo();

//Obteniendo valores minimos de las bandas

  var minR    = reducedGetInfo.B4_min;
  var minG    = reducedGetInfo.B3_min;
  var minB    = reducedGetInfo.B2_min;
  var minSWR2 = reducedGetInfo.B7_min;
  var minNR   = reducedGetInfo.B5_min;
  var minSWR1 = reducedGetInfo.B6_min;
  var minPan  = reducedGetInfo.B8_min;
  var minIT1  = reducedGetInfo.B10_min;
  var minIT2  = reducedGetInfo.B11_min;
  
//Obteniendo valores maximos de las bandas
  
  var maxR    = reducedGetInfo.B4_max;
  var maxG    = reducedGetInfo.B3_max;
  var maxB    = reducedGetInfo.B2_max;
  var maxNR   = reducedGetInfo.B5_max;
  var maxSWR1 = reducedGetInfo.B6_max;
  var maxSWR2 = reducedGetInfo.B7_max;
  var maxPan  = reducedGetInfo.B8_max;
  var maxIT1  = reducedGetInfo.B10_max;
  var maxIT2  = reducedGetInfo.B11_max;

// Almacenando valores minimos y maximos en vectores

// Minimos y Maximos RGB
  var minimos_RGB = [minR, minG, minB];
  var maximos_RGB = [maxR, maxG, maxB];

// Minimos y Maximos Infrarrojo (Vegetacion)
  var minimos_NRRG = [minNR, minR, minG];
  var maximos_NRRG = [maxNR, maxR, maxG];
  
// Minimos y Maximos Urbano
  var minimos_R2R1R = [minSWR2, minSWR1, minR];
  var maximos_R2R1R = [maxSWR2, maxSWR2, maxR];

// Minimos y Maximos Agricultura
  var minimos_R1NRB = [minSWR1, minNR, minB];
  var maximos_R1NRB = [maxSWR1, maxNR, maxB];

// Minimos y Maximos Tierra-Agua
  var minimos_NRR1R = [minNR, minSWR1, minR];
  var maximos_NRR1R = [maxNR, maxSWR1, maxR];

// Minimos y Maximos Panacromatico (Blanco y Negro)
  var minimos_Pan   = [minPan];
  var maximos_Pan   = [maxPan];
  
// Minimos y Maximos Bandas Termicas (Humedad del Suelo)  
  var minimos_T1T2  = [minIT1, minIT2];
  var maximos_T1T2  = [maxIT1, maxIT2];
  
// Minimos y Maximos Bandas Combinacion de Usuario 8, 10 y 11

  var minimos_Test  = [minPan, minIT1, minIT2];
  var maximos_Test  = [maxPan, maxIT1, maxIT2];

// Ajustando Datos para mostrar
// Para RGB
  var visParamsRGB = {
    min: minimos_RGB,
    max: maximos_RGB,
    bands: ['B4','B3','B2',]
  };
  
print (visParamsRGB,'Para RGB')
// Para Infrarrojo

  var visParamsInfra = {
    min: minimos_NRRG,
    max: maximos_NRRG,
    bands: ['B5','B4','B3']
  };
  
  print (visParamsInfra,'Para Infra')
// Para Urbano

  var visParamsURB = {
    min: minimos_R2R1R,
    max: maximos_R2R1R,
    bands: ['B7','B6','B4']
  };
  
  print (visParamsURB,'Para Urbano')
  
// Agricultura

  var visParamsAG = {
    min: minimos_R1NRB,
    max: maximos_R1NRB,
    bands: ['B6','B5','B2']
  };
  print (visParamsAG,'Para Agricultura')
  
// Tierra-Agua

  var visParamsTA = {
    min: minimos_NRR1R,
    max: maximos_NRR1R,
    bands: ['B5','B6','B4']
  };
  
  print (visParamsTA,'Para Tierra-Agua')
  
// Pancromatico

  var visParamsPan = {
    min: minimos_Pan,
    max: maximos_Pan,
    bands: ['B8']
  };
  
  print (visParamsPan,'Para Pancromatico')
  
// Humedad del suelo

  var visParamsH = {
    min: minimos_T1T2,
    max: maximos_T1T2,
    bands: ['B10','B11']
  };
  
  print (visParamsH,'Para Termicas')
  
  // Prueba adicional bandas 8, 10 y 11
 
var visParamsTest = {
    min: minimos_Test,
    max: maximos_Test,
    bands: ['B8','B10','B11']
  };
 print (visParamsTest,'Para Combinacion del usuario')

// Display the resulting image.
Map.setCenter(-2.74,36.74,12);
//Map.addLayer(image, visParamsInfra, visParamsRGB, 'Representando con muestra region');

//Map.centerObject(region); // Si descomenta esta linea y ejecuta de nuevo, puede encontrar la reg

// visualizar valores de radiancia

var bands = ['B2','B3','B4','B5','B6','B7','B8','B10','B11'];

// seleccionar bandas de interes

var dnImage = image.select(bands);

// transformar de numeros digitales a radiancia

var radiancia = ee.Algorithms.Landsat.calibratedRadiance(dnImage);

//mostrar resultado
var radParams = {
  bands: ['B8','B10','B11'],
  min: 0, 
  max: 100
};
Map.addLayer (radiancia, radParams, 'radiancia');

//print (radiancia,radParams, 'radiancia')

/* Enlace directo a código en GEE: https://code.earthengine.google.com/deac6387fc3cf0bae579c4ccbd4ec2c6 */