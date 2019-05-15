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

  app.bandsSelection = {
    chk_B1: ui.Checkbox({
      label: 'B1',
      onChange: app.commands.toggleB1
    }),
    chk_B2: ui.Checkbox({
      label: 'B2',
      onChange: app.commands.toggleB2
    }),
    chk_B3: ui.Checkbox({
      label: 'B3',
      onChange: app.commands.toggleB3
    }),
    chk_B4: ui.Checkbox({
      label: 'B4',
      onChange: app.commands.toggleB4
    }),
    chk_B5: ui.Checkbox({
      label: 'B5',
      onChange: app.commands.toggleB5
    }),
    chk_B6: ui.Checkbox({
      label: 'B6',
      onChange: app.commands.toggleB6
    }),
    chk_B7: ui.Checkbox({
      label: 'B7',
      onChange: app.commands.toggleB7
    }),
    chk_B8: ui.Checkbox({
      label: 'B8',
      onChange: app.commands.toggleB8
    }),
    chk_B9: ui.Checkbox({
      label: 'B9',
      onChange: app.commands.toggleB9
    }),
    chk_B10: ui.Checkbox({
      label: 'B10',
      onChange: app.commands.toggleB10
    }),
    chk_B11: ui.Checkbox({
      label: 'B11',
      onChange: app.commands.toggleB11
    })
  };
  app.bandsSelection.panel = ui.Panel([
    app.bandsSelection.chk_B1,
    app.bandsSelection.chk_B2,
    app.bandsSelection.chk_B3,
    app.bandsSelection.chk_B4,
    app.bandsSelection.chk_B6,
    app.bandsSelection.chk_B7,
    app.bandsSelection.chk_B8,
    app.bandsSelection.chk_B9,
    app.bandsSelection.chk_B10,
    app.bandsSelection.chk_B11,
  ]);

  app.imageSelection = {
    title: ui.Label('1) Find Near Images'),
    text_startDate: ui.Textbox('YYYY-MM-DD', '2018-01-01'),
    text_endDate: ui.Textbox('YYYY-MM-DD', '2018-12-31'),
    btn_findImages: ui.Button('Find Images', app.commands.findImages),
    lbl_findImage: ui.Label('Showing - of - images found'),
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
    app.imageSelection.lbl_findImage,
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

      print('Segunda oportunidad, en detectarInvernaderos', rangesPerBand);

      // var bandsToUseForIdentification = [
      //   // 'B1',
      //   // 'B2', 
      //   'B3',
      //   'B4',
      //   'B5',
      //   // 'B6', 
      //   // 'B7', 
      //   // 'B8', 
      //   // 'B9', 
      //   // 'B10', 
      //   // 'B11', 
      //   // 'BQA'
      // ];

      var bandsToUseForIdentification = [];
      if (app.model.useL8B1) {
        bandsToUseForIdentification.push('B1');
      }
      if (app.model.useL8B2) {
        bandsToUseForIdentification.push('B2');
      }
      if (app.model.useL8B3) {
        bandsToUseForIdentification.push('B3');
      }
      if (app.model.useL8B4) {
        bandsToUseForIdentification.push('B4');
      }
      if (app.model.useL8B5) {
        bandsToUseForIdentification.push('B5');
      }
      if (app.model.useL8B6) {
        bandsToUseForIdentification.push('B6');
      }
      if (app.model.useL8B7) {
        bandsToUseForIdentification.push('B7');
      }
      if (app.model.useL8B8) {
        bandsToUseForIdentification.push('B8');
      }
      if (app.model.useL8B9) {
        bandsToUseForIdentification.push('B9');
      }
      if (app.model.useL8B10) {
        bandsToUseForIdentification.push('B10');
      }
      if (app.model.useL8B11) {
        bandsToUseForIdentification.push('B11');
      }


      InvernaderosImage = app.utils.detectarInvernaderosUsandoLasBandas(image, region, bandsToUseForIdentification, rangesPerBand);
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
    detectarInvernaderosUsandoLasBandas: function (image, region, bandNames, rangesPerBand) {
      var invernaderosMask;

      var bandaDeInvernaderosMask;
      var index;
      for (index in bandNames) {
        print('bandName:', index);
        bandaDeInvernaderosMask = app.utils.detectarInvernaderosUsandoLaBanda(image, region, bandNames[index], rangesPerBand);
        if (!invernaderosMask) {
          invernaderosMask = bandaDeInvernaderosMask;
        } else {
          invernaderosMask = invernaderosMask.and(bandaDeInvernaderosMask);
        }
      }

      return invernaderosMask;
    },
    detectarInvernaderosUsandoLaBanda: function (image, region, bandKey, rangesPerBand) {
      var min = rangesPerBand[bandKey].min;
      var max = rangesPerBand[bandKey].max;
      var minimunThresholdImage;
      var maximunThresholdImage;
      var unionThresholdImage;


      image = image.select(bandKey);
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
      var pixelArea = 900.0;
      reduced.evaluate(function (dictionary) {

        var pixelsInRangePerBand;
        if (dictionary[bandID] === null) {
          pixelsInRangePerBand = 0;
        } else {
          pixelsInRangePerBand = dictionary[bandID][0][1];
        }

        var areaCoveredInMeters = pixelsInRangePerBand * pixelArea;
        var areaCoveredInHectares = areaCoveredInMeters / 10000.0;
        areaCovered = areaCoveredInHectares;

        app.utils.comunicarAreaCalculada(areaCovered);

      });

    },
    comunicarAreaCalculada: function (areaExtension) {
      // var areaAsIntValue = parseInt(areaExtension);
      areaExtension = areaExtension.toFixed(2);
      app.imageAreaComputation.lbl_areaResult.setValue('GreenHose Area (in ha): ' + areaExtension);
    },
    buscarImagenes: function (startDate, endDate, onFoundImagesCallback) {
      //LANDSAT 5: MAR-84 -> JAN-2013
      //LANDSAT 8: FEB-13 -> NOW

      var imageCollection = ee.ImageCollection([]);
      var imagesTotal = 0;
      if (startDate < '2013-02-01') {
        //include L5 collection
        var collectionL5 = app.utils.buscarImagenesPorColeccion(startDate, endDate, app.constants.LANDSAT5_TOA_COLLECTION_ID)
        var collectionL5Size = collectionL5.size();

        collectionL5 = collectionL5.limit(app.constants.MAX_IMAGES_FOUND);
        imagesTotal = collectionL5Size.add(imagesTotal);
        imageCollection = imageCollection.merge(collectionL5);
      }
      if (endDate > '2013-01-31') {
        //include L8 collection
        var collectionL8 = app.utils.buscarImagenesPorColeccion(startDate, endDate, app.constants.LANDSAT8_TOA_COLLECTION_ID)
        var collectionL8Size = collectionL8.size();

        collectionL8 = collectionL8.limit(app.constants.MAX_IMAGES_FOUND);
        imageCollection = imageCollection.merge(collectionL8);
        imagesTotal = collectionL8Size.add(imagesTotal);
      }

      imageCollection = imageCollection.sort('CLOUD_COVER').limit(app.constants.MAX_IMAGES_FOUND);

      var imageIDs = imageCollection.reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');

      imageIDs.evaluate(function (ids) {
        //TODO: cómo renovar las nuevas que se busquen
        imagesTotal = imagesTotal.getInfo();

        var results = {
          imageIDs: ids,
          total: imagesTotal,
        };
        onFoundImagesCallback(results);
      });
    },
    buscarImagenesPorColeccion: function (startDate, endDate, collectionID) {
      var collection = ee.ImageCollection(collectionID);

      var filteredCollection = collection
        .filterBounds(Map.getCenter())
        .filterDate(startDate, endDate)
        .sort('CLOUD_COVER')
        ;

      return filteredCollection;
    },
    representarDiferencias: function (invernaderosA, invernaderosB) {
      var normalizationFactor = 65535;
      var visParamsIncrementoA = { min: 0, max: 30000 / normalizationFactor, palette: ['FF0000'] };
      var visParamsIncrementoB = { min: 0, max: 30000 / normalizationFactor, palette: ['00FF00'] };
      var region = app.model.getExplorationZone();
      var invernaderosAsinB;
      var invernaderosBsinA;


      var comunes = invernaderosA.or(invernaderosB);
      comunes = comunes.clip(region);
      invernaderosAsinB = invernaderosA.bitwiseXor(comunes);
      invernaderosBsinA = invernaderosB.bitwiseXor(comunes);

      var invernaderosAsinBMasked = invernaderosAsinB.updateMask(invernaderosAsinB);
      var invernaderosBsinAMasked = invernaderosBsinA.updateMask(invernaderosBsinA);


      Map.addLayer(comunes, null, 'Invernadores comunes');

      Map.addLayer(invernaderosAsinBMasked, visParamsIncrementoA, 'Invernaderos A excluyentes');
      Map.addLayer(invernaderosBsinAMasked, visParamsIncrementoB, 'Invernaderos B excluyentes');
    },
    perteneceL8: function (image) {
      var regexp = RegExp('LC08');

      if (typeof image === 'string' || image instanceof String) {
        return regexp.test(image);
      } else {
        //DEBERÍA SER UNA ee.Image
        var imageID = image.get('system:index');
        return regexp.test(imageID);
      }
    },
    perteneceL5: function (image) {
      return !app.utils.perteneceL8(image);
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

      app.utils.buscarImagenes(startDate, endDate, function (searchResults) {
        var imageIDs = searchResults.imageIDs.map(function (currentValue, i, array) {
          return currentValue.match('(LT05|LC08)_[0-9]+_[0-9]+')[0]; //Porque obtiene dos: Ejemplo: ["LC08_200035_20181012","LC08"]
        });
        var imageIDsTotal = imageIDs.length;
        var total = searchResults.total;
        app.imageSelection.selectWidget.items().reset(imageIDs);
        app.imageSelection.lbl_findImage.setValue('Showing ' + imageIDsTotal + ' of ' + total + ' found.');
      });
    },
    addImage: function () {
      var imageInCollectionID = app.imageSelection.selectWidget.getValue();
      var imageCollectionID = app.model.getImageCollectionFor(imageInCollectionID);
      var label = imageInCollectionID;
      var uniqueImageID = imageCollectionID + '/' + imageInCollectionID;
      var image = ee.Image(uniqueImageID);
      var selectedImages = app.model.selectedImages;
      var visParams = app.model.getVisualizationParametersForImage(image);
      var layerName = imageInCollectionID;

      var object = { label: label, value: image };

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


      var invernaderos = app.utils.detectarInvernaderos(image, region, rangesPerBand);
      invernaderos = invernaderos.clip(region);

      app.utils.dibujarImagen(invernaderos, {}, 'invernaderos localizados');


      app.utils.calcularAreaInvernada(image, region, rangesPerBand);
    },
    compareImages: function () {
      var imageA = app.imageComparison.slt_imageA.getValue();
      var imageB = app.imageComparison.slt_imageB.getValue();
      // var region = app.model.getExplorationZone();
      var region;
      var rangesPerBand = app.model.getRangesPerBand();

      print(rangesPerBand);

      var invernaderosA;
      var invernaderosB;

      invernaderosA = app.utils.detectarInvernaderos(imageA, region, rangesPerBand);
      invernaderosB = app.utils.detectarInvernaderos(imageB, region, rangesPerBand);

      app.utils.representarDiferencias(invernaderosA, invernaderosB);
    },
    toggleDrawAreaTool: function (activated) {

    },
    toggleB1: function () {
      var newValue = app.model.useL8B1 = app.bandsSelection.chk_B1.getValue();
    },
    toggleB2: function () {
      var newValue = app.model.useL8B2 = app.bandsSelection.chk_B2.getValue();
    },
    toggleB3: function () {
      var newValue = app.model.useL8B3 = app.bandsSelection.chk_B3.getValue();
    },
    toggleB4: function () {
      var newValue = app.model.useL8B4 = app.bandsSelection.chk_B4.getValue();
    },
    toggleB5: function () {
      var newValue = app.model.useL8B5 = app.bandsSelection.chk_B5.getValue();
    },
    toggleB6: function () {
      var newValue = app.model.useL8B6 = app.bandsSelection.chk_B6.getValue();
    },
    toggleB7: function () {
      var newValue = app.model.useL8B7 = app.bandsSelection.chk_B7.getValue();
    },
    toggleB8: function () {
      var newValue = app.model.useL8B8 = app.bandsSelection.chk_B8.getValue();
    },
    toggleB9: function () {
      var newValue = app.model.useL8B9 = app.bandsSelection.chk_B9.getValue();
    },
    toggleB100: function () {
      var newValue = app.model.useL8B10 = app.bandsSelection.chk_B10.getValue();
    },
    toggleB11: function () {
      var newValue = app.model.useL8B11 = app.bandsSelection.chk_B11.getValue();
    }

  };

};

app.createConstants = function () {
  var _explorationZone = geometry;

  app.constants = {
    MAX_IMAGES_FOUND: 10,
    LANDSAT5_TOA_COLLECTION_ID: 'LANDSAT/LT05/C01/T1_TOA',
    LANDSAT8_TOA_COLLECTION_ID: 'LANDSAT/LC08/C01/T1_RT_TOA',
    LANDSAT8_SR_COLLECTION_ID: 'LANDSAT/LC08/C01/T1',
    IMAGE_COLLECTION_ID: 'LANDSAT/LC08/C01/T1_RT_TOA',
    VISUALIZATION_PARAMS_L8_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 },
    VISUALIZATION_PARAMS_L8_NORMALIZED_NATURAL: { bands: ['B4', 'B3', 'B2'], min: 0, max: 30000 / 65535 },
    VISUALIZATION_PARAMS_L5_NORMALIZED_NATURAL: { bands: ['B3', 'B2', 'B1'], min: 0, max: 30000 / 65535 },

    DEBUG_VISUALIZATION_PARAMS_BAND_3: { bands: ['B3'], min: 0, max: 30000 }
  };

  app.model = {
    useL8B1: false,
    useL8B2: false,
    useL8B3: false,
    useL8B4: false,
    useL8B5: false,
    useL8B6: false,
    useL8B7: false,
    useL8B8: false,
    useL8B9: false,
    useL8B10: false,
    useL8B11: false,
  };
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
    // var rangesPerBand = {
    //   "B1": {
    //     "min": 23212,
    //     "max": 24897
    //   },
    //   "B2": {
    //     "min": 24217,
    //     "max": 26199
    //   },
    //   "B3": {
    //     "min": 25143,
    //     "max": 27502
    //   },
    //   "B4": {
    //     "min": 27086,
    //     "max": 30323
    //   },
    //   "B5": {
    //     "min": 30452,
    //     "max": 33739
    //   },
    //   "B6": {
    //     "min": 24657,
    //     "max": 28171
    //   },
    //   "B7": {
    //     "min": 20359,
    //     "max": 23632
    //   },
    //   "B8": {
    //     "min": 25526,
    //     "max": 28830
    //   },
    //   "B9": {
    //     "min": 5050,
    //     "max": 5091
    //   },
    //   "B10": {
    //     "min": 24930,
    //     "max": 25389
    //   },
    //   "B11": {
    //     "min": 23376,
    //     "max": 23781
    //   },
    //   "BQA": {
    //     "min": 2800,
    //     "max": 2800
    //   }
    // };
    // var rangesPerBand = {
    //   B1: { min: 23212, max: 24897 },
    //   B2: { min: 24217, max: 26199 },
    //   B3: { min: 17225, max: 17226 },
    //   B4: { min: 27086, max: 30323 },
    //   B5: { min: 30452, max: 33739 },
    //   B6: { min: 24657, max: 28171 },
    //   B7: { min: 20359, max: 23632 },
    //   B8: { min: 25526, max: 28830 },
    //   B9: { min: 5050, max: 5091 },
    //   B10: { min: 24930, max: 25389 },
    //   B11: { min: 23376, max: 23781 },
    //   BQA: { min: 2800, max: 2800 }
    // };

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
    var visParams;

    if (app.utils.perteneceL8(image)) {
      return app.constants.VISUALIZATION_PARAMS_L8_NORMALIZED_NATURAL;
    } else if (app.utils.perteneceL5(image)) {
      return app.constants.VISUALIZATION_PARAMS_L5_NORMALIZED_NATURAL
    }
    if (app.constants.IMAGE_COLLECTION_ID = app.constants.LANDSAT8_TOA_COLLECTION_ID) {
      visParams = app.constants.VISUALIZATION_PARAMS_L8_NORMALIZED_NATURAL;
    } else if (app.constants.IMAGE_COLLECTION_ID = app.constants.LANDSAT8_SR_COLLECTION_ID) {
      visParams = app.constants.VISUALIZATION_PARAMS_L8_NATURAL;
    }
    return visParams;
  };
  app.model.getImageCollectionFor = function (image) {
    if (app.utils.perteneceL8(image)) {
      return app.constants.LANDSAT8_TOA_COLLECTION_ID;
    } else if (app.utils.perteneceL5(image)) {
      return app.constants.LANDSAT5_TOA_COLLECTION_ID;
    }
  }
};

app.bootDrawAreaTool = function () {
  var tool = new app.utils.DrawAreaTool(Map);

  tool.onFinished(function (geometry) {
    app.imageAreaComputation.chk_drawArea.setValue(false, false);
    app.model.setExplorationZone(geometry);
  });

  app.imageAreaComputation.chk_drawArea.onChange(function (active) {
    if (active) {
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
    app.bandsSelection.panel,
    app.imageSelection.panel,
    app.imageAreaComputation.panel,
    app.imageComparison.panel

  ]);

  Map.setCenter(-2.74, 36.74, 9);
  ui.root.insert(0, main);
};

app.boot();