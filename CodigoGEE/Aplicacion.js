var geometry = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-2.7543364162988837, 36.72097430529935],
          [-2.7543364162988837, 36.70831439827675],
          [-2.734423696572321, 36.70831439827675],
          [-2.734423696572321, 36.72097430529935]]], null, false);
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
    text_startDate: ui.Textbox('YYYY-MM-DD', '2016-01-01'),
    text_endDate: ui.Textbox('YYYY-MM-DD', '2016-12-31'),
    btn_findImages: ui.Button('Find Images', app.commands.findImages),
    selectWidget: ui.Select({
      items: [],
      placeholder: 'Find any Images first',
    }),
    btn_addImage: ui.Button({
      label: 'Draw and Add to Image Manager',
      onClick: app.commands.addImage,
    })
  };
  app.imageSelection.panel = ui.Panel([
    app.imageSelection.title,
    app.imageSelection.text_startDate,
    app.imageSelection.text_endDate,
    app.imageSelection.btn_findImages,
    app.imageSelection.selectWidget,
    app.imageSelection.btn_addImage
  ]);

  app.imageAreaComputation = {
    title: ui.Label('2) Image Manager'),
    chk_drawArea: ui.Checkbox('Draw Area'),
    selectWidget: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Find and Add any image first',
      disabled: true,
    }),
    btn_computeArea: ui.Button('Compute', app.commands.computeArea, true),
    lbl_areaResult: ui.Label('Area:'),
  };
  app.imageAreaComputation.panel = ui.Panel([
    app.imageAreaComputation.title,
    app.imageAreaComputation.chk_drawArea,
    app.imageAreaComputation.selectWidget,
    app.imageAreaComputation.btn_computeArea,
    app.imageAreaComputation.lbl_areaResult,
  ]);

  app.imageComparison = {
    //TODO
    title: ui.Label('3) Compare Images'),
    slt_imageA: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick an added Image',
      disabled: true
    }),
    slt_imageB: ui.Select({
      items: app.model.selectedImages,
      placeholder: 'Pick an added more recent Image',
      disabled: true
    }),
    btn_compare: ui.Button('Compare', app.commands.compareImages, true)
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
    DrawAreaTool: function (map) {
      this.map = map;
      this.layer = ui.Map.Layer({ name: 'area selection tool', visParams: { color: 'yellow' } });
      this.selection = null;
      this.active = false;
      this.points = [];
      this.area = null;

      this.listeners = [];

      var tool = this;

      this.initialize = function () {
        this.map.onClick(this.onMouseClick);
        this.map.layers().add(this.layer);
      };

      this.startDrawing = function () {
        this.active = true;
        this.points = [];

        this.map.style().set('cursor', 'crosshair');
        this.layer.setShown(true);
      };

      this.stopDrawing = function () {
        tool.active = false;
        tool.map.style().set('cursor', 'hand');

        if (tool.points.length < 2) {
          return;
        }

        tool.area = ee.Geometry.Polygon(tool.points);
        tool.layer.setEeObject(tool.area);

        tool.listeners.map(function (listener) {
          listener(tool.area);
        });
      };

      /***
      * Mouse click event handler
      */
      this.onMouseClick = function (coords) {
        if (!tool.active) {
          return;
        }

        tool.points.push([coords.lon, coords.lat]);

        var geom = tool.points.length > 1 ? ee.Geometry.LineString(tool.points) : ee.Geometry.Point(tool.points[0]);
        tool.layer.setEeObject(geom);

        var l = ee.Geometry.LineString([tool.points[0], tool.points[tool.points.length - 1]]).length(1).getInfo();

        if (tool.points.length > 1 && l / Map.getScale() < 5) {
          tool.stopDrawing();
        }
      };

      /***
      * Adds a new event handler, fired on feature selection. 
      */
      this.onFinished = function (listener) {
        tool.listeners.push(listener);
      };

      this.initialize();
    },
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
      print('minValue:', minValue);
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
        print(dictionary);
        var pixelsInRangePerBand = dictionary[bandID][0][1];

        areaCovered = pixelsInRangePerBand * pixelArea;
        app.utils.comunicarAreaCalculada(areaCovered);

      });

    },
    comunicarAreaCalculada: function (areaExtension) {
      var areaAsIntValue = parseInt(areaExtension);
      app.imageAreaComputation.lbl_areaResult.setValue('GreenHose Area (in m2): ' + areaAsIntValue);
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
  app.utils.ui = {
    enableImageComparisonWidgets: function () {
      app.imageComparison.slt_imageA.setDisabled(false);
      app.imageComparison.slt_imageB.setDisabled(false);
      app.imageComparison.btn_compare.setDisabled(false);
    },
    enableImageAreaComputationWidgets: function () {
      app.imageAreaComputation.selectWidget.setDisabled(false);
      app.imageAreaComputation.btn_computeArea.setDisabled(false);
    },
    enableComponentsDependentOnAddedImages: function () {
      app.utils.ui.enableImageAreaComputationWidgets();
      app.utils.ui.enableImageComparisonWidgets();
    }
  }

  app.commands = {
    findImages: function () {
      var startDate = app.model.getStartDate();
      var endDate = app.model.getEndDate();

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
      var visParams = app.model.getVisualizationParametersForImage(image);
      var layerName = imageInCollectionID;

      print(image);
      var object = { label: label, value: image };
      print(object);
      print(object.value);

      app.utils.dibujarImagen(image, visParams, layerName);

      //ACTUALIZAR LOS UI.WIDGETS QUE DEPENDEN DE LAS IMAGENES SELECCIONADAS
      selectedImages.push(object);
      app.imageAreaComputation.selectWidget.items().reset(selectedImages);
      app.imageComparison.slt_imageA.items().reset(selectedImages);
      app.imageComparison.slt_imageB.items().reset(selectedImages);

      app.utils.ui.enableComponentsDependentOnAddedImages();
    },
    computeArea: function () {
      var image = app.imageAreaComputation.selectWidget.getValue();
      var region = app.model.getExplorationZone();
      var rangesPerBand = app.model.getRangesPerBand();

      print('image:', image);
      print('region:', region);
      print('ranges:', rangesPerBand);

      app.utils.calcularAreaInvernada(image, region, rangesPerBand);
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
    },
    toggleDrawAreaTool: function (activated) {

    }

  };

};

app.createConstants = function () {
  var _explorationZone = geometry;

  app.constants = {
    IMAGE_COLLECTION_ID: 'LANDSAT/LC08/C01/T1',
    VISUALIZATION_PARAMS_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 },
    VISUALIZATION_PARAMS_NORMALIZED_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 / 65535 },

    DEBUG_VISUALIZATION_PARAMS_BAND_3: { bands: ['B3'], min: 0, max: 30000 }
  };

  app.model = {};
  app.model.selectedImages = [];
  app.model.getRangesPerBand = function () {
    var normalize = false;
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
    var rangesPerBand = {
      B1: { min: 23212, max: 24897 },
      B2: { min: 24217, max: 26199 },
      B3: { min: 17225, max: 17225 },
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

    if (normalize) {
      var bandKey;
      for (bandKey in rangesPerBand) {
        rangesPerBand[bandKey].min /= normalizationFactor;
        rangesPerBand[bandKey].max /= normalizationFactor;
      }
    }

    return rangesPerBand;
  };
  app.model.getExplorationZone = function () {
    return _explorationZone;
  };
  app.model.setExplorationZone = function (geometry) {
    _explorationZone = geometry;
  };
  app.model.getStartDate = function () {
    return app.imageSelection.text_startDate.getValue();
  };
  app.model.getEndDate = function () {
    return app.imageSelection.text_endDate.getValue();
  };
  app.model.getVisualizationParametersForImage = function (image) {
    //TODO: parametize with image
    return app.constants.VISUALIZATION_PARAMS_NATURAL;
  };
};

app.bootDrawAreaTool = function () {
  var tool = new app.utils.DrawAreaTool(Map);

  tool.onFinished(function (geometry) {
    app.imageAreaComputation.chk_drawArea.setValue(false, false);
    app.model.setExplorationZone(geometry);
    print(geometry);
  });

  app.imageAreaComputation.chk_drawArea.onChange(function(active) {
    if(active) {
      tool.startDrawing();
    } else {
      tool.stopDrawing();
    }
  });
};

app.boot = function () {
  app.createConstants();
  app.createHelpers();
  app.createPanels();

  app.bootDrawAreaTool();

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