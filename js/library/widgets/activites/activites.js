/*global define,dojo */
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
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/_base/html",
    "dojo/text!./templates/activitiesTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic"
], function (declare, domConstruct, lang, on, dom, domClass, html, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        /**
           * create activites widget
           *
           * @class
           * @name widgets/activites/activites
           */
        postCreate: function () {

            /**
            * minimize other open header panel widgets and show activites
            */

            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "activites") {

                    if (html.coords(this.esriCTdivAppContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTActivitesImg", "esriCTActivitesImgSelected");
                        domClass.replace(this.esriCTdivAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        domClass.replace(this.esriCTdivAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.activites, "class": "esriCTActivitesImg" }, null);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                /**
                                * minimize other open header panel widgets and show activites panel
                                */
                topic.publish("toggleWidget", "activites");
                this._showActivityResult();
            })));
        },
        _showActivityResult: function () {
            var applicationHeaderDiv;
            applicationHeaderDiv = domConstruct.create("div", { "class": "esriCTApplicationShareicon" }, dom.byId("esriCTParentDivContainer"));
            applicationHeaderDiv.appendChild(this.esriCTdivAppContainer);
            if (html.coords(this.esriCTdivAppContainer).h > 0) {
                /**
                 * when user clicks on share icon in header panel, close the sharing panel if it is open
                                */
                domClass.replace(this.domNode, "esriCTActivitesImg", "esriCTActivitesImgSelected");
                domClass.replace(this.esriCTdivAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.replace(this.esriCTdivAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
            } else {
                /**
                 * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTActivitesImgSelected", "esriCTActivitesImg");
                domClass.replace(this.esriCTdivAppContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTdivAppContainer, "esriCTFullHeight", "esriCTZeroHeight");
            }
        }
    });
});
