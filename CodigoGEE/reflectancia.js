var toa = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometry = /* color: #ffc82d */ee.Geometry.Polygon(
        [[[-2.757738659846268, 36.72266135148037],
          [-2.7567301492566685, 36.72317732471507],
          [-2.7577493886823277, 36.72532717588147],
          [-2.758790085780106, 36.72497460441564]]]);

var region = /* color: #d63000 */geometry;
var image = ee.Image(toa
//filtrar por fechas
    .filterDate ('2014-01-10','2017-12-31')
    
    //filtrar imagenes en un punto especifico
    .filterBounds (region)
    
    //ordenar la coleccion por propiedades de Metadatos
    .sort('CLOUD_COVER')
    
    //Obtener la primera imagen fuera de la coleccion
    .first()
    
    // Sleccionar Bandas de trabajo
    .select (['B1','B2','B3','B4','B5','B6','B7','B8','B10','B11']));
    
  // Visualizar imagen por metadatos
  
var bands = ['B1','B2','B3','B4','B5','B6','B7','B8','B10','B11'];

Map.addLayer (image, {bands: ['B2','B3','B4'], min: 0, max: 0.5}, 'TOA');
print('imagen landsat',image);


          
var reflectiveBands = bands.slice(0, 8);

var wavelengths = [0.44,0.48, 0.56, 0.65, 0.89,1.61,2.2,0.588];

var reflectanceImage = image.select(reflectiveBands)

var noInvernada = ee.Geometry.Polygon(
        [[[-2.747386316786674, 36.73957582422828],
          [-2.7447255654439005, 36.73740917613203],
          [-2.7393611474141153, 36.73991973100041],
          [-2.741421083937553, 36.74191435989275]]]);
//personalizacion parametros

var option = {
  
  title: 'Landsat 8 TOA espectro en Campo de Dalias, Almeria',
  hAxis: {title: 'longitud de onda en micrometros'},
  vAxis: {title: 'reflectancia'},
  lineWidth: 1,
  pointSize: 4,
};

//grafico

var chart = Chart.image.regions(reflectanceImage,noInvernada,null, 30, null, wavelengths)
            .setOptions(option);
  
print (chart)

