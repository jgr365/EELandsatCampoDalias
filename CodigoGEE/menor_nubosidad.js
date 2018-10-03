var landsat = ee.ImageCollection("LANDSAT/LC8_L1T"),
    region = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-2.757738659846268, 36.72266135148037],
          [-2.7567301492566685, 36.72317732471507],
          [-2.7577493886823277, 36.72532717588147],
          [-2.758790085780106, 36.72497460441564]]]);
Map.addLayer(landsat, {min: [6900, 8300, 8600], max: [15600, 15200, 15500],bands: ['B4','B3','B2']}, "Imagen al natural");


//Fechas de filtrado

var inicio = ee.Date('2014-01-01');
var fin = ee.Date('2018-05-01');

//Crear la coleccion de imagenes

var campo_dalias = ee.ImageCollection('LANDSAT/LC08/C01/T1_RT_TOA')
  .filterBounds (region)
  .filterDate (inicio,fin)
  .sort ('CLOUD_COVER',false);

//Dterminar el numero de imagenes

var contar = campo_dalias.size();
print('Tamaño de coleccion Campo de las Dalías',contar);

//Ordenar segun la nubosidad

var menor_nubosidad = ee.Image(campo_dalias.sort('CLOUD_COVER').first());
print ('La imagen con menor nubosidad es',menor_nubosidad);

//Obtener metadatos de la menos nubosidad

var fecha = menor_nubosidad.get('DATE_ACQUIRED');
print('y fue tomada el',fecha);