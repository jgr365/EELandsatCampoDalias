var app = {};

app.createPanels = function () {
  app.intro = {
    title: ui.Label({
      value: 'TITLE',
      style: { fontWeight: 'bold' }
    }),
    description: ui.Label('App description')
  };
  app.intro.panel = ui.Panel([
    app.intro.title,
    app.intro.description
  ]);

  app.imageSelection = {
    btn_findImages: ui.Button('Find Images', app.commands.findImages),
    selectWidget: ui.Select({
      items: [],
      placeholder: 'Find any Images first',
      disabled: true
    }),
    btn_addImage: ui.Button({
      label: 'Add',
      onClick: app.commands.addImage,
      disabled: true
    })
  };
  app.imageSelection.panel = ui.Panel([
    app.imageSelection.btn_findImages,
    app.imageSelection.selectWidget,
    app.imageSelection.btn_addImage
  ]);

  app.imageAreaComputation = {
    selectWidget: ui.Select({
      items: [],
      placeholder: 'Find images first',
    }),
    btn_computeArea: ui.Button('Compute', app.commands.computeArea),
    btn_drawImage: ui.Button('Draw', app.commands.drawImage)
  };
  app.imageAreaComputation.panel = ui.Panel([
    app.imageAreaComputation.selectWidget,
    app.imageAreaComputation.btn_computeArea,
    app.imageAreaComputation.btn_drawImage
  ]);

  app.imageComparison = {
    //TODO
    slt_imageA: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick an Image'
    }),
    slt_imageB: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick a later Image'
    }),
    btn_compare: ui.Button('Compare', app.commands.compareImages)
  };
};

app.createHelpers = function () {
  app.utils = {
    dibujarImagen: function (image, visParams) {
      Map.addLayer(image, visParams);
    },
    detectarInvernaderos: function (image, region, rangesPerBand) {
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

      identificationImage = image.updateMask(unionThresholdImage);

      return identificationImage;
    },
    calcularAreaInvernada: function (image, region, rangesPerBand) {
      //COMPUTE AREA BASED ON HISTOGRAM
      var bandID = 'B3';
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
        pixelsInRangePerBand = dictionary[bandID][0][1];

        areaCovered = pixelsInRangePerBand * pixelArea;
        app.utils.comunicarAreaCalculada(areaCovered);

      });

    },
    comunicarAreaCalculada: function (areaExtension) {
      print('Area covered: (in m2)', areaExtension);
    },
    buscarImagenes: function (startDate, endDate, onFoundImagesCallback) {
      var collectionID = app.IMAGE_COLLECTION_ID;
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
      var visParamsIncrementoA = { min: 0, max: 30000, palette: ['FF0000'] };
      var visParamsIncrementoB = { min: 0, max: 30000, palette: ['00FF00'] };
      var invernaderosAsinB;
      var invernaderosBsinA;

      var comunes = invernaderosA.or(invernaderosB);
      invernaderosAsinB = invernaderosA.bitwiseXor(comunes);
      invernaderosBsinA = invernaderosB.bitwiseXor(comunes);



      Map.addLayer(invernaderosAsinB, visParamsIncrementoA, 'Invernaderos A');
      Map.addLayer(invernaderosBsinA, visParamsIncrementoB, 'Invernaderos B');
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
      var imageCollectionID = 'LANDSAT/LC08/C01/T1_RT_TOA';
      var imageInCollectionID = app.imageSelection.selectWidget.getValue();
      var label = imageInCollectionID;
      var uniqueImageID = imageCollectionID + imageInCollectionID;
      var image = ee.Image(uniqueImageID);

      app.model.selectedImages.add({ label: label, value: image });
    },
    computeArea: function () {
      var image = app.imageAreaComputation.selectWidget.getValue();
      var region = app.model.getExplorationZone();
      var rangesPerBand = app.model.getRangesPerBand();

      app.utils.calcularAreaInvernada(image, region, rangesPerBand);
    },
    drawImage: function () {
      var image = app.imageAreaComputation.selectWidget.getValue();
      var visParams = app.constants.VISUALIZATION_PARAMS_NATURAL;

      app.utils.dibujarImagen(image, visParams);
    },
    compareImages: function(){

    }

  };

};

app.createConstants = function () {
  app.constants = {
    VISUALIZATION_PARAMS_NATURAL: { bands: ['B5', 'B4', 'B3'], min: 0, max: 30000 }
  };

  app.model = {};
  app.model.selectedImages = ui.data.ActiveList([]);
  app.model.getRangesPerBand = function () {
    return {
      B3: { min: 25143, max: 27502 },
      B10: { min: 24930, max: 25389 }
    };
  };
  app.model.getExplorationZone = function () {
    return geometry;
  };
};

app.boot = function (){
  app.createConstants();
  app.createHelpers();
  app.createPanels();

  var main = ui.Panel([
    app.intro.panel, 
    app.imageSelection.panel,
    app.imageAreaComputation.panel,
    app.imageComparison.panel
  ]);

  Map.setCentre(-2.74, 36.74, 9);
  ui.root.insert(0, main);
};

app.boot();