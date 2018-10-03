var landsat = ee.ImageCollection("LANDSAT/LC8_L1T"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-2.757738659846268, 36.72266135148037],
          [-2.7567301492566685, 36.72317732471507],
          [-2.7577493886823277, 36.72532717588147],
          [-2.758790085780106, 36.72497460441564]]]),
    geometry2 = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-2.759843367221947, 36.72715102413615],
          [-2.7577405153542713, 36.722678779123086],
          [-2.7558897911339955, 36.723482835723395],
          [-2.758051651599999, 36.7282298029164]]]);

var image = ee.Image(landsat.filterBounds(geometry).sort('CLOUD_COVER').toList(10).get(0));
var region = geometry;

var meanReducer = ee.Reducer.mean();
var meanReducedRegion = image.reduceRegion(meanReducer, region); // returns a Dictionary
print(meanReducedRegion);

var minMaxReducer = ee.Reducer.minMax();
var minMaxReduction = image.reduceRegion(minMaxReducer, region); // returns a Dictionary
print("Diccionario: ", minMaxReduction);

var regionArea = region.area();
print('superficie del invernadero (en m²)',regionArea); //² Presionando Alt(hold)+2+5+3+Alt(release)

var region2 = geometry2;
var region2Area = region2.area();
print('superficie de la region2 (una más extensa de aprox. 4 veces la anterior como comprobacion si realmente esta funcion hace ese calculo de superficie):',region2Area);

//var minMaxImage = image.reduceRegion(minMaxReducer, geometry, scale, crs, crsTransform, bestEffort, maxPixels, tileScale);
var minMaxImage = image.reduceRegion(minMaxReducer, null      , null , null, null       , false, 500000000); //UNA OPERACION MAS PESADA, PERO DE APENAS UNOS SEGUNDOS
print('minimos y maximos para toda la imagen:',minMaxImage);