/*global define */
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
define({
    showNullValue: "@it@ N/A",
    buttons: {
        okButtonText: "@it@ OK",
        link: "@it@ Link",
        email: "e-mail",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        search: "Cerca",
        route: "@it@ Route",
        locate: "Posizione corrente",
        share: "Condividi",
        help: "Guida",
        clearEntry: "@it@ Clear"
    },
    titles: {
        directionsDisplayText: "@it@ Area of Interest",
        informationPanelTitle: "@it@ Information for current map view",
        webpageDisplayText: "@it@ Copy/paste HTML into your web page",
        splashScreenContent: "@it@  Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
        serchResultText: "@it@ SEARCH RESULT",
        directionText: "@it@ DIRECTIONS TO",
        galleryText: "@it@ GALLERY",
        commentText: "@it@ COMMENT",
        facitilyPanelAccessFeeText: "@it@ Access Fee:",
        facitilyPanelHoursOpenForText: "@it@ Hours Open For:",
        facitilyPanelManagementUnitText: "@it@ Management Unit:",
        facitilyPanelMarinaText: "@it@ Marina:",
        directionCurrentLocationText: "@it@ My Location"
    },
    errorMessages: {
        invalidSearch: "Nessun risultato trovato.",
        falseConfigParams: "Valori chiave di configurazione obbligatori sono null o non esattamente corrispondenti con gli attributi di livello. Questo messaggio può apparire più volte.",
        invalidLocation: "@it@ Current location not found.",
        invalidProjection: "@it@ Unable to plot current location on the map.",
        widgetNotLoaded: "@it@ Unable to load widgets.",
        shareLoadingFailed: "@it@ Unable to shorten URL, Bit.ly failed to load.",
        shareFailed: "@it@ Unable to share.",
        imageDoesNotFound: "@it@ There are no photo available.",
        facilitydoestfound: "@it@  No facilities found in buffer area.",
        noCommentAvaiable: "@it@  No Comment available"
    },
    notUsed: {
        addressDisplayText: "@it@ Address",
        backToMap: "@it@ Back to map"
    }
});

