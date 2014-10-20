/*global define,dojo */
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
    "dojo/dom-geometry",
    "dijit/_WidgetBase",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/query",
    "dojo/topic",
    "dojo/on",
    "dojo/i18n!application/js/library/nls/localizedStrings"


], function (declare, domGeom, WidgetBase, domConstruct, lang, domAttr, domStyle, dom, domClass, query, topic, on, sharedNls) {

    //========================================================================================================================//

    return declare([WidgetBase], {
        sharedNls: sharedNls,
        isResultFound: 0,
        divToggle: null,
        divImageBackground: null,
        imgToggleResults: null,
        divCarouselContent: null,
        resultboxPanel: null,
        resultboxPanelContent: null,

        /**
        * create carouselContainer widget
        *
        * @class
        * @name widgets/carouselContainer/carouselContainer
        */

        /**
        * Create carousel container pod
        * @param {Object} Node in which we want to create carousel pod
        * @param {String} Span text which we want to show.
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        createPod: function (parentNote, spanValue) {
            var divCarouselContentInfo;
            this.divToggle = domConstruct.create("div", { "class": "esriCTdivToggle" }, parentNote);
            this.divImageBackground = domConstruct.create("div", { "class": "esriCTDivImageBackground" }, this.divToggle);
            this.imgToggleResults = domConstruct.create("div", { "class": "esriCTUpAndDownArrow" }, this.divImageBackground);
            domClass.add(this.imgToggleResults, "esriCTDownDownarrowImage");
            domConstruct.create("div", { "class": "esriCTSpanResult", "innerHTML": spanValue }, this.divImageBackground);
            this.divCarouselContent = domConstruct.create("div", { "class": "esriCTDivCarouselContent" }, parentNote);
            domClass.add(this.divCarouselContent, "esriCTHideBottomContainerHeight");
            domClass.add(this.divCarouselContent, "esriCTzeroHeight");
            divCarouselContentInfo = domConstruct.create("div", { "class": "esriCTtransparentBackground" }, this.divCarouselContent);
            domClass.add(divCarouselContentInfo, "esriCTDivCarouselContentInfo");
            this.resultboxPanel = domConstruct.create("div", { "class": "esriCTResultBoxPanel" }, divCarouselContentInfo);
            this.resultboxPanelContent = domConstruct.create("div", { "class": "esriCTResultBoxPanelContent" }, this.resultboxPanel);
            // On click on image for wipe in and wibeout.
            this.own(on(this.divImageBackground, "click", lang.hitch(this, function () {
                if (this.isResultFound > 0) {
                    if (domClass.contains(this.divCarouselContent, "esriCTzeroHeight")) {
                        this.show();
                    } else {
                        this.hide();
                    }
                }
            })));
            domStyle.set(this.divImageBackground, "display", "none");
        },

        /**
        * Show carousel pod
        * @param {array} Array of div which we insert in carousel Container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        addPod: function (content) {
            var i = 0;
            if (this.resultboxPanelContent && content.length > 0) {
                for (i; i < content.length; i++) {
                    this.isResultFound++;
                    this.resultboxPanelContent.appendChild(content[i]);
                }
            }
        },

        /**
        * Destroy carousel pod
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        destroyPod: function () {
            if (this.resultboxPanelContent && this.resultboxPanelContent.childNodes) {
                dojo.destroy(this.resultboxPanelContent);
            }
        },

        /**
        * Clear Content in side the carousel container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        removePod: function (carouselPodData) {
            var j, i, carouselPodAttributeValue;
            if (this.resultboxPanelContent && this.resultboxPanelContent.childNodes) {
                for (j = 0; j < carouselPodData.length; j++) {
                    for (i = 0; i < this.resultboxPanelContent.childNodes.length; i++) {
                        carouselPodAttributeValue = domAttr.get(this.resultboxPanelContent.childNodes[i], "CarouselPodName");
                        if (carouselPodAttributeValue.toLowerCase() === carouselPodData[j].toLowerCase()) {
                            this.resultboxPanelContent.removeChild(this.resultboxPanelContent.childNodes[i]);
                        }
                    }
                }
            }
        },

        /**
        * Clear entire pod from carousel container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        removeAllPod: function () {
            var i, j, childNodesArray = [];
            if (this.resultboxPanelContent && this.resultboxPanelContent.childNodes) {
                for (i = 0; i < this.resultboxPanelContent.childNodes.length; i++) {
                    childNodesArray.push(this.resultboxPanelContent.childNodes[i]);
                }
                for (j = 0; j < childNodesArray.length; j++) {
                    this.resultboxPanelContent.removeChild(childNodesArray[j]);
                }
            }
        },

        /**
        * Show  carousel container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        showCarouselContainer: function () {
            if (this.divCarouselContent && this.isResultFound > 0) {
                domStyle.set(this.divImageBackground, "display", "block");
                domStyle.set(this.divCarouselContent, "display", "block");
                domStyle.set(this.divToggle, "display", "block");
            }
        },

        /**
        * Hide  carousel container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        hideCarouselContainer: function () {
            if (this.divCarouselContent) {
                domStyle.set(this.divImageBackground, "display", "none");
                domStyle.set(this.divCarouselContent, "display", "none");
                domStyle.set(this.divToggle, "display", "none");
            }
        },

        /**
        * Show the carousel container set the legend box and esri logo
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        show: function () {
            var customLogoPositionChange;
            if (this.isResultFound > 0) {
                domStyle.set(this.divCarouselContent, "display", "block");
                this._setLegendPositionUp();
                domClass.add(this.divImageBackground, "esriCTResultImageBlock");
                domClass.replace(this.divCarouselContent, "esriCTBottomPanelHeight", "esriCTzeroHeight");
                domClass.replace(this.imgToggleResults, "esriCTDownDownarrowImage", "esriCTUparrowImage");
                domClass.replace(this.divToggle, "esriCTBottomPanelPosition", "esriCTZeroBottom");
                customLogoPositionChange = query('.esriCTCustomMapLogo');
                if (customLogoPositionChange[0]) {
                    domClass.replace(customLogoPositionChange[0], "esriCTCustomMapLogoPostionChange", "esriCTCustomMapLogoBottom");
                }
            }
        },

        /**
        * Hide the carousel container  set the legend box and ersi logo
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        hide: function () {
            var customLogoPositionChange;
            if (this.isResultFound > 0) {
                domStyle.set(this.divCarouselContent, "display", "none");
                domClass.replace(this.divCarouselContent, "esriCTzeroHeight", "esriCTBottomPanelHeight");
                domClass.replace(this.imgToggleResults, "esriCTUparrowImage", "esriCTDownDownarrowImage");
                domClass.replace(this.divToggle, "esriCTZeroBottom", "esriCTBottomPanelPosition");
                this._setLegendPositionDown();
                customLogoPositionChange = query('.esriCTCustomMapLogo');
                if (customLogoPositionChange[0]) {
                    domClass.replace(customLogoPositionChange[0], "esriCTCustomMapLogoBottom", "esriCTCustomMapLogoPostionChange");
                }
            }
        },

        /**
        * set position of legend box and ersi logo when contaner is hide
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        _setLegendPositionDown: function () {
            var legendChangePositionDownContainer, mapLogoPostionDown;
            legendChangePositionDownContainer = query('.esriCTDivLegendBox')[0];
            if (legendChangePositionDownContainer) {
                domClass.remove(legendChangePositionDownContainer, "esriCTDivLegendBoxUp");
            }
            mapLogoPostionDown = query('.esriControlsBR')[0];
            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionUp");
            domClass.add(mapLogoPostionDown, "esriCTDivMapPositionTop");
        },


        /**
        * set position of legend box and ersi logo when contaner is show
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        _setLegendPositionUp: function () {
            var legendChangePositionDownContainer, mapLogoPostionDown;
            legendChangePositionDownContainer = query('.esriCTDivLegendBox')[0];
            if (legendChangePositionDownContainer) {
                domClass.add(legendChangePositionDownContainer, "esriCTDivLegendBoxUp");
            }
            mapLogoPostionDown = query('.esriControlsBR')[0];
            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionTop");
            domClass.add(mapLogoPostionDown, "esriCTDivMapPositionUp");
        }

    });
});
