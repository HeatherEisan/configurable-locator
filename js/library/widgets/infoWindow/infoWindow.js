/*global define,dojo,alert,dijit,appGlobals */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
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
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/_base/array",
    "esri/domUtils",
    "esri/InfoWindowBase",
    "dojo/text!./templates/infoWindow.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/query",
    "dojo/topic",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/a11yclick"

], function (declare, domConstruct, domStyle, lang, on, domAttr, dom, domClass, array, domUtils, InfoWindowBase, template, _WidgetBase, _TemplatedMixin, query, topic, sharedNls, _WidgetsInTemplateMixin, a11yclick) {
    return declare([InfoWindowBase, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        InfoShow: true,
        widgetName: null,
        isTabEnabled: true,
        galleryObject: null,
        queryURL: null,

        postCreate: function () {
            var infoTab;
            this.infoWindowContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.infoWindowContainer.appendChild(this.domNode);
            this._anchor = domConstruct.create("div", { "class": "esriCTDivTriangle" }, this.domNode);
            domUtils.hide(this.domNode);
            domAttr.set(this.backToMap, "innerHTML", sharedNls.titles.backToMapText);
            this.own(on(this.backToMap, a11yclick, lang.hitch(this, function () {
                this._closeInfowindow();
            })));
            // onclick on mobile arraw button
            this.own(on(this.mobileArrow, a11yclick, lang.hitch(this, function () {
                this.InfoShow = false;
                this._openInfowindow();
            })));
            // subscribing mobile info window
            topic.subscribe("openMobileInfowindow", lang.hitch(this, function () {
                this._openInfowindow();
            }));
            // subscribing for widget name for further query
            topic.subscribe("getInfoWidgetName", lang.hitch(this, function (value) {
                this.widgetName = value;
            }));
            // subscribing for return Query URL for further query
            topic.subscribe("returnQueryURL", lang.hitch(this, function (value) {
                this.queryURL = value;
            }));
            this.onWindowResize();
            // subscribing for add To List Object for further query
            topic.subscribe("addToListObject", lang.hitch(this, function (value) {
                this.addToListObject = value;
            }));

            // subscribing for finding attachment in layer
            topic.subscribe("isattachmentFound", lang.hitch(this, function (value) {
                this.isAttachmentFound = value;
            }));
            // onclick on close button
            this.own(on(this.divClose, a11yclick, lang.hitch(this, function () {
                this.InfoShow = true;
                domUtils.hide(this.domNode);
                this.map.getLayer("highlightLayerId").clear();
                appGlobals.shareOptions.mapClickedPoint = null;
            })));
            // onclicko n mobile close div button
            this.own(on(this.mobileCloseDiv, a11yclick, lang.hitch(this, function () {
                this.InfoShow = true;
                appGlobals.shareOptions.setMapTipPosition = true;
                domUtils.hide(this.domNode);
                appGlobals.shareOptions.infoWindowIsShowing = false;
                this.map.getLayer("highlightLayerId").clear();
                appGlobals.shareOptions.mapClickedPoint = null;
            })));
            // on click on informaition tab for showing result
            this.own(on(this.informationTab, a11yclick, lang.hitch(this, function () {
                this._showInfoWindowTab(this.informationTab, dojo.byId("informationTabContainer"));
                domClass.add(this.getDirselect, "esriCTImageTab", "esriCTImageTabSelected");
                domClass.replace(this.infoSelect, "esriCTInfoTabImageSelect", "esriCTInfoTabImage");
                domClass.replace(this.gallerySelect, "esriCTGalleryTabImage", "esriCTGalleryTabImageSelect");
                domClass.replace(this.commentSelect, "esriCTCommentsTabImage", "esriCTCommentsTabImageselect");
                domClass.replace(this.addtoListSelect, "addtoListTabImage", "addtoListTabImageSelect");
                domClass.remove(this.addtoListTab, "esriCTInfoSelectedTab");
                if (dojo.window.getBox().w < 767) {
                    this._displayBackToMapText();
                }
            })));
            // onclick on gallery tab for showing tab and data
            this.own(on(this.galleryTab, a11yclick, lang.hitch(this, function () {
                this._showInfoWindowTab(this.galleryTab, dojo.byId("galleryTabContainer"));
                domClass.replace(this.getDirselect, "esriCTImageTab", "esriCTImageTabSelected");
                domClass.replace(this.infoSelect, "esriCTInfoTabImage", "esriCTInfoTabImageSelect");
                domClass.replace(this.gallerySelect, "esriCTGalleryTabImageSelect", "esriCTGalleryTabImage");
                domClass.replace(this.commentSelect, "esriCTCommentsTabImage", "esriCTCommentsTabImageselect");
                domClass.replace(this.addtoListSelect, "addtoListTabImage", "addtoListTabImageSelect");
                domClass.remove(this.addtoListTab, "esriCTInfoSelectedTab");
                if (dojo.window.getBox().w < 767) {
                    this._displayBackToMapText();
                }
            })));
            // onclick on comments Tab for showing tab and data
            this.own(on(this.commentsTab, a11yclick, lang.hitch(this, function () {
                this._showInfoWindowTab(this.commentsTab, dojo.byId("commentsTabContainer"));
                domClass.replace(this.getDirselect, "esriCTImageTab", "esriCTImageTabSelected");
                domClass.replace(this.infoSelect, "esriCTInfoTabImage", "esriCTInfoTabImageSelect");
                domClass.replace(this.gallerySelect, "esriCTGalleryTabImage", "esriCTGalleryTabImageSelect");
                domClass.replace(this.commentSelect, "esriCTCommentsTabImageselect", "esriCTCommentsTabImage");
                domClass.replace(this.addtoListSelect, "addtoListTabImage", "addtoListTabImageSelect");
                domClass.remove(this.addtoListTab, "esriCTInfoSelectedTab");
                if (dojo.window.getBox().w < 767) {
                    this._displayBackText();
                }
            })));
            // onclick on direction Tab for showing tab and data
            this.own(on(this.esriCTGetDir, a11yclick, lang.hitch(this, function () {
                this._showInfoWindowTab(this.esriCTGetDir, dojo.byId("getDirContainer"));
                domClass.replace(this.getDirselect, "esriCTImageTabSelected", "esriCTImageTab");
                domClass.replace(this.infoSelect, "esriCTInfoTabImage", "esriCTInfoTabImageSelect");
                domClass.replace(this.gallerySelect, "esriCTGalleryTabImage", "esriCTGalleryTabImageSelect");
                domClass.replace(this.commentSelect, "esriCTCommentsTabImage", "esriCTCommentsTabImageselect");
                domClass.replace(this.addtoListSelect, "addtoListTabImage", "addtoListTabImageSelect");
                domClass.remove(this.addtoListTab, "esriCTInfoSelectedTab");
                // Setting back to map text
                if (dojo.window.getBox().w < 767) {
                    this._displayBackToMapText();
                }
            })));
            // onclick on addtoList Tab for adding data in my list
            this.own(on(this.addtoListTab, a11yclick, lang.hitch(this, function () {
                infoTab = query('.esriCTInfoSelectedTab')[0];
                if (infoTab) {
                    domClass.remove(infoTab, "esriCTInfoSelectedTab");
                }
                domClass.add(this.addtoListTab, "esriCTInfoSelectedTab");
                domClass.replace(this.getDirselect, "esriCTImageTab", "esriCTImageTabSelected");
                domClass.replace(this.infoSelect, "esriCTInfoTabImage", "esriCTInfoTabImageSelect");
                domClass.replace(this.gallerySelect, "esriCTGalleryTabImage", "esriCTGalleryTabImageSelect");
                domClass.replace(this.commentSelect, "esriCTCommentsTabImage", "esriCTCommentsTabImageselect");
                domClass.replace(this.addtoListSelect, "addtoListTabImageSelect", "addtoListTabImage");
                topic.publish("addToListFromInfoWindow", this.addToListObject);
                if (dojo.window.getBox().w < 767) {
                    this._displayBackToMapText();
                }
            })));
        },

        /**
        * show info window tab
        * @param {Object} tabNode object of tabs
        * @param {Object} containerNode object of container Node
        * @memberOf widgets/infoWindow/infoWindow
        */
        _showInfoWindowTab: function (tabNode, containerNode) {
            var infoContainer, infoTab;
            infoContainer = query('.displayBlock')[0];
            infoTab = query('.esriCTInfoSelectedTab')[0];
            // checking for info container
            if (infoContainer) {
                domClass.remove(infoContainer, "displayBlock");
            }
            // checking for inow tab
            if (infoTab) {
                domClass.remove(infoTab, "esriCTInfoSelectedTab");
            }
            // replacing class for all the tabs
            domClass.replace(this.getDirselect, "esriCTImageTab", "esriCTImageTabSelected");
            domClass.replace(this.infoSelect, "esriCTInfoTabImageSelect", "esriCTInfoTabImage");
            domClass.replace(this.gallerySelect, "esriCTGalleryTabImage", "esriCTGalleryTabImageSelect");
            domClass.replace(this.commentSelect, "esriCTCommentsTabImage", "esriCTCommentsTabImageselect");
            domClass.replace(this.addtoListSelect, "addtoListTabImage", "addtoListTabImageSelect");
            domClass.remove(this.addtoListTab, "esriCTInfoSelectedTab");
            domClass.add(tabNode, "esriCTInfoSelectedTab");
            domClass.add(containerNode, "displayBlock");
        },

        /**
        * show the info window
        * @param {Object} screenPoint object of screen Point
        * @memberOf widgets/infoWindow/infoWindow
        */
        show: function (screenPoint) {
            var iscommentsPodEnabled = this.getPodStatus("CommentsPod"), tabName, tabEnabled = 0, isdirectionsPodEnabled, isgalleryPodEnabled, isfacilityInformationPodEnabled, faclityInfo;
            // checking for direction tag from config file for showing drection tab in info window
            if (appGlobals.configData.DrivingDirectionSettings.GetDirections) {
                isdirectionsPodEnabled = this.getPodStatus("DirectionsPod");
            }
            isgalleryPodEnabled = this.getPodStatus("GalleryPod");
            // checking for gallery pod enabled status
            if (!isgalleryPodEnabled) {
                domStyle.set(this.galleryTab, "display", "none");
            } else {
                domStyle.set(this.galleryTab, "display", "table-cell");
                tabEnabled++;
                tabName = "GalleryPod";
            }
            isfacilityInformationPodEnabled = this.getPodStatus("FacilityInformationPod");
            // checking for facility information pod enabled status
            if (!isfacilityInformationPodEnabled) {
                domStyle.set(this.informationTab, "display", "none");
            } else {
                tabEnabled++;
                tabName = "FacilityInformationPod";
            }
            // checking if it is a other url then hide direction and add to list tab
            if (this.queryURL.toLowerCase() === "otherurl") {
                domStyle.set(this.esriCTGetDir, "display", "none");
            } else if (!isdirectionsPodEnabled) {
                domStyle.set(this.esriCTGetDir, "display", "none");
            } else {
                domStyle.set(this.esriCTGetDir, "display", "table-cell");
                tabEnabled++;
                tabName = "DirectionsPod";
            }
            // checking for other url if it is then hide comment tab
            if (this.queryURL.toLowerCase() === "otherurl") {
                domStyle.set(this.commentsTab, "display", "none");
            } else if (!iscommentsPodEnabled) {
                domStyle.set(this.commentsTab, "display", "none");
            } else {
                domStyle.set(this.commentsTab, "display", "table-cell");
                tabEnabled++;
                tabName = "CommentsPod";
            }
            // checking for other url if it is then hide add to list tab
            if (this.queryURL.toLowerCase() === "otherurl") {
                domStyle.set(this.addtoListTab, "display", "none");
            } else if (dijit.registry.byId("myList")) {
                domStyle.set(this.addtoListTab, "display", "table-cell");
            } else {
                domStyle.set(this.addtoListTab, "display", "none");
            }
            // checking for event search if it is then hide event tab
            if (this.widgetName.toLowerCase() === "infoevent") {
                domStyle.set(this.commentsTab, "display", "none");
            } else if (this.widgetName.toLowerCase() === "infoactivity") {
                if (iscommentsPodEnabled) {
                    domStyle.set(this.commentsTab, "display", "table-cell");
                } else {
                    domStyle.set(this.commentsTab, "display", "none");
                }
            }
            this.InfoShow = false;
            faclityInfo = "FacilityInformationPod";
            if (tabEnabled > 1 && appGlobals.configData.PodSettings[1][faclityInfo].Enabled) {
                this._showInfoWindowTab(this.informationTab, dojo.byId("informationTabContainer"));
            } else {
                this.isTabEnabled = true;
                // checking for comment tab for showing info window tab
                if (tabName === "CommentsPod") {
                    this._showInfoWindowTab(this.commentsTab, dojo.byId("commentsTabContainer"));
                } else if (tabName === "GalleryPod") {
                    this._showInfoWindowTab(this.galleryTab, dojo.byId("galleryTabContainer"));
                } else if (tabName === "FacilityInformationPod") {
                    this._showInfoWindowTab(this.informationTab, dojo.byId("informationTabContainer"));
                } else if (tabName === "DirectionsPod") {
                    this._showInfoWindowTab(this.esriCTGetDir, dojo.byId("getDirContainer"));
                    domClass.replace(this.getDirselect, "esriCTImageTabSelected", "esriCTImageTab");
                } else {
                    this.isTabEnabled = false;
                    domClass.remove(this.divInfoContainer, "displayBlock");
                    alert(sharedNls.errorMessages.enablePodSettingsInConfig);
                }
            }
            // checking for tab name for showing and hiding tab on the basis id enabled settings in config file
            if (tabName) {
                if (tabName === "CommentsPod" && this.widgetName.toLowerCase() === "infoevent" && tabEnabled === 1) {
                    this.isTabEnabled = false;
                    domClass.remove(this.divInfoContainer, "displayBlock");
                    alert(sharedNls.errorMessages.enablePodSettingsInConfig);
                } else if (tabName && this.widgetName.toLowerCase() === "infoactivity") {
                    this.setLocation(screenPoint);
                } else {
                    this.setLocation(screenPoint);
                }
            }
            // checking for tags in config file for showing hiding comment tab in info window
            if (!appGlobals.configData.ActivitySearchSettings[0].CommentsSettings.Enabled || !appGlobals.configData.ActivitySearchSettings[0].Enable || appGlobals.configData.ActivitySearchSettings[0].CommentsSettings.QueryURL === "") {
                domStyle.set(this.commentsTab, "display", "none");
                if (dojo.byId("commentsTabContainer")) {
                    domConstruct.empty(dojo.byId("commentsTabContainer"));
                }
            }
            // checking if attachment is not found then hide gallery pod
            if (!this.isAttachmentFound) {
                domStyle.set(this.galleryTab, "display", "none");
            }
        },

        /**
        * resize the info window
        * @param {string} width string of width
        * @param {string} height string of height
        * @memberOf widgets/infoWindow/infoWindow
        */
        resize: function (width, height) {
            // checking for window height
            if (dojo.window.getBox().w <= 767) {
                this.infoWindowWidth = 180;
                this.infoWindowHeight = 30;
                this.infoWindowResizeOnMap();
                domStyle.set(this.domNode, {
                    width: 180 + "px",
                    height: 30 + "px"
                });
            } else {
                this.onWindowResize();
                this.infoWindowWidth = width;
                this.infoWindowHeight = height;
                domStyle.set(this.domNode, {
                    width: width + "px",
                    height: height + "px"
                });
            }
        },

        /**
        * set title of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setTitle: function (mobTitle) {
            if (mobTitle && mobTitle.length > 0) {
                this.spanDirection.innerHTML = mobTitle;
                this.spanDirection.title = mobTitle;
            } else {
                if (this.esriCTheadderPanel && this.spanDirection) {
                    this.esriCTheadderPanel.innerHTML = "";
                    this.spanDirection.innerHTML = "";
                }
            }
        },


        /**
        * setting location of info window
        * @param {string} location string of location value
        * @memberOf widgets/infoWindow/infoWindow
        */
        setLocation: function (location) {
            if (this.isTabEnabled) {
                if (location.spatialReference) {
                    location = this.map.toScreen(location);
                }
                domStyle.set(this.domNode, {
                    left: (location.x - (this.infoWindowWidth / 2)) + "px",
                    bottom: (location.y + 25) + "px"
                });
                if (!this.InfoShow) {
                    domUtils.show(this.domNode);
                }
            }
        },

        /**
        * hideing info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        hide: function () {
            domUtils.hide(this.domNode);
            this.isShowing = false;
            this.onHide();
            appGlobals.shareOptions.openInfowindow = false;
        },

        /**
        * hideing info window container
        * @memberOf widgets/infoWindow/infoWindow
        */
        _hideInfoContainer: function () {
            this.own(on(this.divClose, a11yclick, lang.hitch(this, function () {
                domUtils.hide(this.domNode);
                appGlobals.shareOptions.infoWindowIsShowing = false;
            })));
        },

        /**
        * Set parameter on window resize
        * @memberOf widgets/infoWindow/infoWindow
        */
        onWindowResize: function () {
            this.infoWindowzIndex = 1001;
            domStyle.set(this.domNode, { zIndex: 1001 });
        },

        /**
        * Set parameter for info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        infoWindowResizeOnMap: function () {
            if (this.isMobileInfoWindowOpen) {
                this.infoWindowzIndex = 1002;
                domStyle.set(this.domNode, { zIndex: 1002 });
            } else {
                appGlobals.shareOptions.doQuery = "false";
                appGlobals.shareOptions.addressLocationDirectionActivity = null;
                this.infoWindowzIndex = 997;
                domStyle.set(this.domNode, { zIndex: 997 });
            }
        },

        /**
        * Create info window for mobile
        * @memberOf widgets/infoWindow/infoWindow
        */
        _openInfowindow: function () {
            domClass.add(this.informationTab, "esriCTInfoTabImageSelect");
            domClass.remove(query(".esriCTCloseDivMobile")[0], "scrollbar_footerVisible");
            domClass.add(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.add(query(".esriCTInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.add(query(".esriCTDivTriangle")[0], "esriCThidedivTriangle");
            domClass.add(query(".esriCTInfoWindow")[0], "esriCTinfoWindowHeightWidth");
            appGlobals.shareOptions.onInfoWindowResize = true;
            this.isMobileInfoWindowOpen = true;
            this.infoWindowResizeOnMap();
        },

        /**
        * Hide mobile info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        _closeInfowindow: function () {
            appGlobals.shareOptions.onInfoWindowResize = false;
            this.isMobileInfoWindowOpen = false;
            this.infoWindowResizeOnMap();
            domClass.remove(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.remove(query(".esriCTInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.remove(query(".esriCThidedivTriangle")[0], "esriCThidedivTriangle");
            domClass.remove(query(".esriCTInfoWindow")[0], "esriCTinfoWindowHeightWidth");
            domClass.add(query(".esriCTCloseDivMobile")[0], "scrollbar_footerVisible");
        },
        /**
        * Returns the pod enabled status from config file.
        * @param {string} Key name mentioned in config file
        * @memberOf widgets/infoWindow/infoWindow
        */
        getPodStatus: function (keyValue) {
            var isEnabled, i, key;
            isEnabled = false;
            for (i = 0; i < appGlobals.configData.PodSettings.length; i++) {
                for (key in appGlobals.configData.PodSettings[i]) {
                    if (appGlobals.configData.PodSettings[i].hasOwnProperty(key)) {
                        if (key === keyValue && appGlobals.configData.PodSettings[i][key].Enabled) {
                            isEnabled = true;
                            break;
                        }
                    }
                }
            }
            return isEnabled;
        },

        /**
        * Display 'Back to Map' text in mobile Phones
        * @memberOf widgets/infoWindow/infoWindow
        */
        _displayBackToMapText: function () {
            var backToMapHide, backButton, backToMap;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            backButton = query('.esriCTInfoBackButton')[0];
            backToMap = domStyle.get(backToMapHide, "display");
            // checking for back to map for showing back to map
            if (backToMap === "none") {
                domStyle.set(backToMapHide, "display", "block");
                domStyle.set(backButton, "display", "none");
            }
        },

        /**
        * Display 'Back' text in mobile devices
        * @memberOf widgets/infoWindow/infoWindow
        */
        _displayBackText: function () {
            var backToMapHide, backButton, PostCommentContainer, PostCommentContainerDisplay;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            backButton = query('.esriCTInfoBackButton')[0];
            PostCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            // checking for pos comment container
            if (PostCommentContainer) {
                PostCommentContainerDisplay = domStyle.get(PostCommentContainer, "display");
                if (PostCommentContainerDisplay === "none") {
                    domStyle.set(backToMapHide, "display", "none");
                    domStyle.set(backButton, "display", "table-cell");
                } else {
                    domStyle.set(backToMapHide, "display", "block");
                }
            }
        }
    });
});
