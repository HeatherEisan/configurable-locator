/*global dojo,define,require,esri */
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

require([
    "esri/map",
    "../../../../config.js",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/topic"

], function (esriMap, config, domConstruct, dom, topic) {
    /**
    * create print widget for event list.
    *
    * @class
    * @name widgets/printForEvent/printForEvent
    */

    var eventInfoData, i;
    //  printmap = new esri.Map("mapPrint", {});
    document.title = config.ApplicationName;
    /**
    * function to add polygon and graphics in the print map window when it gets open
    * @memberOf widgets/printForEvent/printForEvent
    */
    eventInfoData = window.opener.mapData.eventData;
    //Print Directions on Page
    dom.byId("title").innerHTML = "My List";
    for (i = 0; i < eventInfoData.length; i++) {
        domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": eventInfoData[i].Name + "<br>" + (eventInfoData[i].StartDate === "" ? eventInfoData[i].StartDate : eventInfoData[i].StartDate + ", ") + eventInfoData[i].Address }, dom.byId("directionsList"));
    }
    // Set time out for window print
    setTimeout(function () {
        window.print();
    }, 1000);
});
