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
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dijit/a11yclick"

], function (declare, domGeom, WidgetBase, domConstruct, lang, domAttr, domStyle, dom, domClass, query, topic, on, sharedNls, a11yclick) {

    //========================================================================================================================//

    return declare([WidgetBase], {
        sharedNls: sharedNls,                         // Variable for shared NLS
        isPodCreated: 0,                              // Variable for if pod is created
        divToggle: null,                              // Variable for toggle button
        divImageBackground: null,                     // Variable for back ground image div
        imgToggleResults: null,                       // Variable for toogle result image
        divCarouselContent: null,                     // Variable for carousel content div
        resultboxPanel: null,                         // Variable for result box panel
        resultboxPanelContent: null,                  // Variable for result box panel content

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
            this.imgToggleResults.title = sharedNls.tooltips.hidePanelTooltips;
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
            this.own(on(this.divImageBackground, a11yclick, lang.hitch(this, function () {
                // Checking condition if pod is added in container
                if (this.isPodCreated > 0) {
                    // Checking the class for expanding and collesping the container.
                    if (domClass.contains(this.divCarouselContent, "esriCTzeroHeight")) {
                        this.collapseUP();
                        dojo.isShowPod = "true";
                    } else {
                        this.collapseDown();
                        dojo.isShowPod = "false";
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
            // Checking condition if pod is added in container
            if (this.resultboxPanelContent && content && content.length > 0) {
                for (i; i < content.length; i++) {
                    this.isPodCreated++;
                    this.resultboxPanelContent.appendChild(content[i]);
                }
            }
        },

        /**
        * Destroy carousel pod
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        destroyPod: function () {
            // Checking condition if pod is added in container
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
            // Checking condition if pod is added in container
            if (this.resultboxPanelContent && this.resultboxPanelContent.childNodes) {
                // Looping for container pod data
                for (j = 0; j < carouselPodData.length; j++) {
                    // Looping for child in container
                    for (i = 0; i < this.resultboxPanelContent.childNodes.length; i++) {
                        carouselPodAttributeValue = domAttr.get(this.resultboxPanelContent.childNodes[i], "CarouselPodName");
                        // Checking container pod's v
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
            // Checking pod's container if available then remove childrens
            if (this.resultboxPanelContent && this.resultboxPanelContent.childNodes) {
                // Looping for result content data
                for (i = 0; i < this.resultboxPanelContent.childNodes.length; i++) {
                    childNodesArray.push(this.resultboxPanelContent.childNodes[i]);
                }
                // Looping for container data
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
            var legendChangePositionDownContainer;
            // Checking if pod is created and container is present.
            if (this.divCarouselContent && this.isPodCreated > 0) {
                domStyle.set(this.divImageBackground, "display", "block");
                domStyle.set(this.divCarouselContent, "display", "block");
                domStyle.set(this.divToggle, "display", "block");
                legendChangePositionDownContainer = query('.esriCTDivLegendBox')[0];
                // Checking for ledgend position.
                if (legendChangePositionDownContainer) {
                    domClass.add(legendChangePositionDownContainer, "esriCTDivLegendBoxTop");
                }
            }
        },

        /**
        * Hide  carousel container
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        hideCarouselContainer: function () {
            var customLogoPositionChange, legendChangePositionDownContainer;
            if (this.divCarouselContent) {
                domStyle.set(this.divImageBackground, "display", "none");
                domStyle.set(this.divCarouselContent, "display", "none");
                domStyle.set(this.divToggle, "display", "none");
                legendChangePositionDownContainer = query('.esriCTDivLegendBox')[0];
                // If ledgend is available then set ledgend position
                if (legendChangePositionDownContainer) {
                    domClass.remove(legendChangePositionDownContainer, "esriCTDivLegendBoxTop");
                }
                customLogoPositionChange = query('.esriCTCustomMapLogo');
                if (customLogoPositionChange[0]) {
                    // if ShowLegend is True than replace classess having different positions of customLogo from bottom else default poition
                    if (dojo.configData.ShowLegend) {
                        domClass.replace(customLogoPositionChange[0], "esriCTCustomMapLogoBottom", "esriCTCustomMapLogoPostionChange");
                    } else {
                        domClass.remove(customLogoPositionChange[0], "esriCTCustomMapLogoPostion");
                    }
                }
            }
        },

        /**
        * collapse container up
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        collapseUP: function () {
            var customLogoPositionChange;
            dojo.isShowPod = "true";
            // Checking the container data
            if (this.isPodCreated > 0) {
                domStyle.set(this.divCarouselContent, "display", "block");
                this._setLegendPositionUp();
                domClass.add(this.divImageBackground, "esriCTResultImageBlock");
                domClass.replace(this.divCarouselContent, "esriCTBottomPanelHeight", "esriCTzeroHeight");
                domClass.replace(this.imgToggleResults, "esriCTDownDownarrowImage", "esriCTUparrowImage");
                domClass.replace(this.divToggle, "esriCTBottomPanelPosition", "esriCTZeroBottom");
                this.imgToggleResults.title = sharedNls.tooltips.hidePanelTooltips;
                customLogoPositionChange = query('.esriCTCustomMapLogo');
                if (customLogoPositionChange[0]) {
                    // if ShowLegend is True than replace classess having different positions of customLogo from bottom else add the class
                    if (dojo.configData.ShowLegend) {
                        domClass.replace(customLogoPositionChange[0], "esriCTCustomMapLogoPostionChange", "esriCTCustomMapLogoBottom");
                    } else {
                        domClass.add(customLogoPositionChange[0], "esriCTCustomMapLogoPostion");
                    }
                }
            }
        },

        /**
        * collapse container bellow
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        collapseDown: function () {
            var customLogoPositionChange;
            dojo.isShowPod = "false";
            if (this.isPodCreated > 0) {
                domStyle.set(this.divCarouselContent, "display", "none");
                domClass.replace(this.divCarouselContent, "esriCTzeroHeight", "esriCTBottomPanelHeight");
                domClass.replace(this.imgToggleResults, "esriCTUparrowImage", "esriCTDownDownarrowImage");
                domClass.replace(this.divToggle, "esriCTZeroBottom", "esriCTBottomPanelPosition");
                this.imgToggleResults.title = sharedNls.tooltips.showPanelTooltips;
                this._setLegendPositionDown();
                customLogoPositionChange = query('.esriCTCustomMapLogo');
                if (customLogoPositionChange[0]) {
                    // if ShowLegend is True than replace classess having different positions of customLogo from bottom else default poition
                    if (dojo.configData.ShowLegend) {
                        domClass.replace(customLogoPositionChange[0], "esriCTCustomMapLogoBottom", "esriCTCustomMapLogoPostionChange");
                    } else {
                        domClass.remove(customLogoPositionChange[0], "esriCTCustomMapLogoPostion");
                    }
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
            // if class '.esriCTDivMapPoitionUp' thenn only add or remove classess
            if (query('.esriCTDivMapPositionUp')[0]) {
                domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionUp");
                domClass.add(mapLogoPostionDown, "esriCTDivMapPositionTop");
            }
        },


        /**
        * set position of legend box and ersi logo when contaner is show
        * @memberOf widgets/carouselContainer/carouselContainer
        */
        _setLegendPositionUp: function () {
            var legendChangePositionDownContainer, mapLogoPostionDown;
            legendChangePositionDownContainer = query('.esriCTDivLegendBox')[0];
            // Checking for legend position
            if (legendChangePositionDownContainer) {
                domClass.add(legendChangePositionDownContainer, "esriCTDivLegendBoxUp");
            }
            mapLogoPostionDown = query('.esriControlsBR')[0];
            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionTop");
            domClass.add(mapLogoPostionDown, "esriCTDivMapPositionUp");
        }
    });
});
