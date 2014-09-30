﻿/*global define,dojo,dojoConfig,Modernizr,alert */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/on",
    "dojo/topic",
    "dijit/_WidgetBase",
    "esri/geometry/Point",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/SpatialReference",
    "esri/symbols/PictureMarkerSymbol",
    "esri/tasks/GeometryService"

], function (declare, lang, domConstruct, sharedNls, on, topic, _WidgetBase, Point, Graphic, GraphicsLayer, SpatialReference, PictureMarkerSymbol, GeometryService) {

    //========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,
        preLoaded: true,
        geolocationGraphic: null,
        isShowGeolocationPushPin: true,
        graphicsLayerId: null,
        geoLocationSettings: null,

        /**
        * create geolocation widget
        *
        * @class
        * @name widgets/geoLocation/geoLocation
        */
        postCreate: function () {

            /**
            * Modernizr.geolocation checks for support for geolocation on client browser
            * if browser is not supported, geolocation widget is not created
            */
            if (this.preLoaded) {
                if (Modernizr.geolocation) {
                    this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.locateTooltips, "class": "esriCTTdGeolocation" }, null);
                    this.own(on(this.domNode, "click", lang.hitch(this, function () {
                        /**
                        * minimize other open header panel widgets and call geolocation service
                        */
                        topic.publish("toggleWidget", "geolocation");
                        this.showCurrentLocation(this.preLoaded);
                    })));
                }
            }
            if (!this.graphicsLayerId) {
                var graphicsLayer = new GraphicsLayer();
                graphicsLayer.id = this.graphicsLayerId = "geoLocationGraphicsLayer";
                this.map.addLayer(graphicsLayer);
            }
            if (!this.geoLocationSettings) {
                this.geoLocationSettings = dojo.configData.GeoLocationSettings;
            }
        },

        /**
        * get device location from geolocation service
        * @param {string} dojo.configData.GeometryService Geometry service url specified in configuration file
        * @memberOf widgets/geoLocation/geoLocation
        */

        showCurrentLocation: function (preLoaded) {
            var mapPoint, self = this, currentBaseMap, geometryServiceUrl, geometryService, isPreLoaded = preLoaded;
            geometryServiceUrl = dojo.configData.GeometryService;
            geometryService = new GeometryService(geometryServiceUrl);
            this.clearGeoLocationGraphic();
            /**
            * get device location using geolocation service
            * @param {object} position Co-ordinates of device location in spatialReference of wkid:4326
            */
            navigator.geolocation.getCurrentPosition(function (position) {
                mapPoint = new Point(position.coords.longitude, position.coords.latitude, new SpatialReference({
                    wkid: 4326
                }));
                /**
                * projects the device location on the map
                * @param {string} dojo.configData.ZoomLevel Zoom level specified in configuration file
                * @param {object} mapPoint Map point of device location in spatialReference of wkid:4326
                * @param {object} newPoint Map point of device location in spatialReference of map
                */
                geometryService.project([mapPoint], self.map.spatialReference).then(function (newPoint) {
                    currentBaseMap = self.map.getLayer("defaultBasemap");
                    if (!currentBaseMap) {
                        currentBaseMap = self.map.getLayer("defaultBasemap0");
                    }
                    if (currentBaseMap.visible) {
                        if (!currentBaseMap.fullExtent.contains(newPoint[0])) {
                            alert(sharedNls.errorMessages.invalidLocation);
                            topic.publish("hideProgressIndicator");
                            return;
                        }
                    }
                    mapPoint = newPoint[0];
                    self.map.centerAndZoom(mapPoint, dojo.configData.ZoomLevel);
                    self._addGraphic(mapPoint, isPreLoaded);
                }, function (err) {
                    alert(sharedNls.errorMessages.invalidProjection);
                    topic.publish("hideProgressIndicator");
                    self.onGeolocationError(err, isPreLoaded);
                });
            }, function (err) {
                alert(sharedNls.errorMessages.invalidLocation);
                topic.publish("hideProgressIndicator");
                self.onGeolocationError(err, isPreLoaded);
            });
        },

        /**
        * add push pin on the map
        * @param {object} mapPoint Map point of device location in spatialReference of map
        * @memberOf widgets/geoLocation/geoLocation
        */
        _addGraphic: function (mapPoint, isPreLoaded) {
            var locatorMarkupSymbol, geoLocationPushpin;
            if (this.isShowGeolocationPushPin) {
                geoLocationPushpin = dojoConfig.baseURL + this.geoLocationSettings.DefaultGeoLocationSymbol;
                locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, this.geoLocationSettings.MarkupSymbolSize.width, this.geoLocationSettings.MarkupSymbolSize.height);
                this.geolocationGraphic = new Graphic(mapPoint, locatorMarkupSymbol, null, null);
                this.map.getLayer(this.graphicsLayerId).add(this.geolocationGraphic);
            }
            this.onGeolocationComplete(this.geolocationGraphic, isPreLoaded);
        },

        /**
        * executed after adding geolocation graphic on map
        * @param {object} graphic
        * @memberOf widgets/geoLocation/geoLocation
        */
        onGeolocationComplete: function (graphic, isPreLoaded) {
            return true;
        },

        /**
        * executed when geolocation returns any error
        * @param {object} error
        * @memberOf widgets/geoLocation/geoLocation
        */
        onGeolocationError: function (error, isPreLoaded) {
            return true;
        },

        clearGeoLocationGraphic: function () {
            if (this.map.getLayer(this.graphicsLayerId)) {
                this.map.getLayer(this.graphicsLayerId).clear();
            }
            this.geolocationGraphic = null;
        }
    });
});
