var app = {};

app.createPanels = function () {
  app.intro = {
    title: ui.Label({
      value: 'TITLE',
      style: { fontWeight: 'bold' }
    }),
    description: ui.Label('App description')
  };
  app.intro.panel = ui.Panel({
    widgets: [
      app.intro.title,
      app.intro.description
    ],
    style: { width: '300px' }
  });

  app.imageSelection = {
    title: ui.Label('1) Find Near Images'),
    btn_findImages: ui.Button('Find Images', app.commands.findImages),
    selectWidget: ui.Select({
      items: [],
      placeholder: 'Find any Images first',
    }),
    btn_addImage: ui.Button({
      label: 'Add',
      onClick: app.commands.addImage,
    })
  };
  app.imageSelection.panel = ui.Panel([
    app.imageSelection.title,
    app.imageSelection.btn_findImages,
    app.imageSelection.selectWidget,
    app.imageSelection.btn_addImage
  ]);

  app.imageAreaComputation = {
    title: ui.Label('2) Image Manager'),
    selectWidget: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Find and Add any image first',
    }),
    btn_computeArea: ui.Button('Compute', app.commands.computeArea),
    lbl_areaResult: ui.Label('Area:'),
    btn_drawImage: ui.Button('Draw', app.commands.drawImage)
  };
  app.imageAreaComputation.panel = ui.Panel([
    app.imageAreaComputation.title,
    app.imageAreaComputation.selectWidget,
    app.imageAreaComputation.btn_computeArea,
    app.imageAreaComputation.lbl_areaResult,
    app.imageAreaComputation.btn_drawImage
  ]);

  app.imageComparison = {
    //TODO
    title: ui.Label('3) Compare Images'),
    slt_imageA: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick an added Image'
    }),
    slt_imageB: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick an added more recent Image'
    }),
    btn_compare: ui.Button('Compare', app.commands.compareImages)
  };
  app.imageComparison.panel = ui.Panel([
    app.imageComparison.title,
    app.imageComparison.slt_imageA,
    app.imageComparison.slt_imageB,
    app.imageComparison.btn_compare
  ]);
};

app.createHelpers = function () {
  app.utils = {
    dibujarImagen: function (image, visParams, layerName) {
      Map.addLayer(image, visParams, layerName);
    },
    detectarInvernaderos: function (image, region, rangesPerBand) {
      var minIndex = 'min';
      var maxIndex = 'max';
      var B3min = rangesPerBand['B3'][minIndex];
      var B3max = rangesPerBand['B3'][maxIndex];
      var InvernaderosImage;

      InvernaderosImage = app.utils.detectarInvernaderosUsandoLaBanda3(image, region, B3min, B3max);
      return InvernaderosImage;
    },
    detectarInvernaderosUsandoLaBanda3: function (image, region, min, max) {
      var bandID = 'B3';
      var identificationImage;
      var minimunThresholdImage;
      var maximunThresholdImage;
      var unionThresholdImage;

      image = image.select(bandID);
      minimunThresholdImage = image.gt(min);
      maximunThresholdImage = image.lt(max);
      unionThresholdImage = minimunThresholdImage.and(maximunThresholdImage);

      return unionThresholdImage;
    },
    calcularAreaInvernada: function (image, region, rangesPerBand) {
      //COMPUTE AREA BASED ON HISTOGRAM
      var bandID = 'B3';
      var minIndex = 'min';
      var maxIndex = 'max';
      var minValue = rangesPerBand[bandID][minIndex];
      var maxValue = rangesPerBand[bandID][maxIndex];
      var reducer = ee.Reducer.fixedHistogram(minValue, maxValue, 1);

      image = image.select(bandID);
      var upperFilteringMask = image.gt(minValue);
      var lowerFilteringMask = image.lt(maxValue);
      var combinedFilteringMask = upperFilteringMask.and(lowerFilteringMask);
      var masked = image.updateMask(combinedFilteringMask);
      image = masked;
      var reduced = image.reduceRegion(reducer, region);

      var areaCovered;
      var pixelArea = 900;
      reduced.evaluate(function (dictionary) {
        var pixelsInRangePerBand = dictionary[bandID][0][1];

        areaCovered = pixelsInRangePerBand * pixelArea;
        app.utils.comunicarAreaCalculada(areaCovered);

      });

    },
    comunicarAreaCalculada: function (areaExtension) {
      var areaAsIntValue = parseInt(areaExtension);
      app.imageAreaComputation.lbl_areaResult.setValue('GreenHose Area (in m2): '+areaAsIntValue);
    },
    buscarImagenes: function (startDate, endDate, onFoundImagesCallback) {
      var collectionID = app.constants.IMAGE_COLLECTION_ID;
      var collection = ee.ImageCollection(collectionID);

      var filteredCollection = collection
        .filterBounds(Map.getCenter())
        .filterDate(startDate, endDate)
        .limit(10)
        ;

      var imageIDs = filteredCollection.reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');
      print(imageIDs);

      imageIDs.evaluate(function (ids) {
        //TODO: cómo renovar las nuevas que se busquen
        onFoundImagesCallback(ids);
      });
    },
    representarDiferencias: function (invernaderosA, invernaderosB) {
      var normalizationFactor = 65535;
      var visParamsIncrementoA = { min: 0, max: 30000 / normalizationFactor, palette: ['FF0000'] };
      var visParamsIncrementoB = { min: 0, max: 30000 / normalizationFactor, palette: ['00FF00'] };
      var invernaderosAsinB;
      var invernaderosBsinA;


      var comunes = invernaderosA.or(invernaderosB);
      invernaderosAsinB = invernaderosA.bitwiseXor(comunes);
      invernaderosBsinA = invernaderosB.bitwiseXor(comunes);

      var invernaderosAsinBMasked = invernaderosAsinB.updateMask(invernaderosAsinB);
      var invernaderosBsinAMasked = invernaderosBsinA.updateMask(invernaderosBsinA);


      Map.addLayer(comunes, null, 'Invernadores comunes');

      Map.addLayer(invernaderosAsinBMasked, visParamsIncrementoA, 'Invernaderos A excluyentes');
      Map.addLayer(invernaderosBsinAMasked, visParamsIncrementoB, 'Invernaderos B excluyentes');
    }
  };

  app.commands = {
    findImages: function () {
      var startDate = '2016-01-01';
      var endDate = '2016-12-31';

      app.utils.buscarImagenes(startDate, endDate, function (imageIDs) {
        app.imageSelection.selectWidget.items().reset(imageIDs);
      });
    },
    addImage: function () {
      var imageCollectionID = app.constants.IMAGE_COLLECTION_ID;
      var imageInCollectionID = app.imageSelection.selectWidget.getValue();
      var label = imageInCollectionID;
      var uniqueImageID = imageCollectionID + '/' + imageInCollectionID;
      var image = ee.Image(uniqueImageID);
      var selectedImages = app.model.selectedImages;

      print(image);
      var object = { label: label, value: image };
      print(object);
      print(object.value);

      //ACTUALIZAR LOS UI.WIDGETS QUE DEPENDEN DE LAS IMAGENES SELECCIONADAS
      selectedImages.push(object);
      app.imageAreaComputation.selectWidget.items().reset(selectedImages);
      app.imageComparison.slt_imageA.items().reset(selectedImages);
      app.imageComparison.slt_imageB.items().reset(selectedImages);
    },
    computeArea: function () {
      var image = app.imageAreaComputation.selectWidget.getValue();
      var region = app.model.getExplorationZone();
      var rangesPerBand = app.model.getRangesPerBand();

      app.utils.calcularAreaInvernada(image, region, rangesPerBand);
    },
    drawImage: function () {
      var image = app.imageAreaComputation.selectWidget.getValue();
      var visParams = app.constants.VISUALIZATION_PARAMS_NORMALIZED_NATURAL;
      var layerName = image.get('system:index');
      layerName = layerName.getInfo();

      app.utils.dibujarImagen(image, visParams, layerName);
    },
    compareImages: function () {
      var imageA = app.imageComparison.slt_imageA.getValue();
      var imageB = app.imageComparison.slt_imageB.getValue();
      var region = app.model.getExplorationZone();
      var rangesPerBand = app.model.getRangesPerBand();

      var invernaderosA;
      var invernaderosB;

      invernaderosA = app.utils.detectarInvernaderos(imageA, region, rangesPerBand);
      invernaderosB = app.utils.detectarInvernaderos(imageB, region, rangesPerBand);

      app.utils.representarDiferencias(invernaderosA, invernaderosB);


    }

  };

};

app.createConstants = function () {
  app.constants = {
    IMAGE_COLLECTION_ID: 'LANDSAT/LC08/C01/T1_RT_TOA',
    VISUALIZATION_PARAMS_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 },
    VISUALIZATION_PARAMS_NORMALIZED_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 / 65535 },

    DEBUG_VISUALIZATION_PARAMS_BAND_3: { bands: ['B3'], min: 0, max: 30000 }
  };

  app.model = {};
  app.model.selectedImages = [];
  app.model.getRangesPerBand = function () {
    var normalize = true;
    var normalizationFactor = 65535;

    var rangesPerBand = {
      B1: { min: 23212, max: 24897 },
      B2: { min: 24217, max: 26199 },
      B3: { min: 25143, max: 27502 },
      B4: { min: 27086, max: 30323 },
      B5: { min: 30452, max: 33739 },
      B6: { min: 24657, max: 28171 },
      B7: { min: 20359, max: 23632 },
      B8: { min: 25526, max: 28830 },
      B9: { min: 5050, max: 5091 },
      B10: { min: 24930, max: 25389 },
      B11: { min: 23376, max: 23781 },
      BQA: { min: 2800, max: 2800 }
    };

    if(normalize){
      var bandKey;
      for(bandKey in rangesPerBand){
        rangesPerBand[bandKey].min /= normalizationFactor;
        rangesPerBand[bandKey].max /= normalizationFactor;
      }
    }

    return rangesPerBand;
  };
  app.model.getExplorationZone = function () {
    return geometry;
  };
};

app.boot = function () {
  app.createConstants();
  app.createHelpers();
  app.createPanels();

  var main = ui.Panel([
    app.intro.panel,
    app.imageSelection.panel,
    app.imageAreaComputation.panel,
    app.imageComparison.panel
  ]);

  Map.setCenter(-2.74, 36.74, 9);
  ui.root.insert(0, main);
};

app.boot();