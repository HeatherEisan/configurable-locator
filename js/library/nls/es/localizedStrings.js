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
    showNullValue: "@es@ N/A",
    buttons: {
        okButtonText: "@es@ OK",
        link: "@es@ Link",
        email: "correo electrónico",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Buscar",
        routeTooltips: "@es@ Route",
        locateTooltips: "Ubicación actual",
        shareTooltips: "Compartir",
        helpTooltips: "Ayuda",
        eventsTooltips: "@es@ Events",
        clearEntryTooltips: "@es@ Clear",
        hidePanelTooltips: "@es@ Hide panel",
        showPanelTooltips: "@es@ Show panel",
        printButtonooltips: "@es@ Print",
        closeTooltips: "@es@ Close"
    },
    titles: {
        directionsDisplayText: "@es@ Area of Interest",
        informationPanelTitle: "@es@ Information for current map view",
        webpageDisplayText: "@es@ Copy/Paste HTML into your web page",
        splashScreenContent: "@es@  Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
        serchResultText: "@es@ SEARCH RESULT",
        directionText: "@es@ DIRECTIONS TO",
        galleryText: "@es@ GALLERY",
        commentText: "@es@ COMMENT",
        facitilyPanelAccessFeeText: "@es@ Access Fee:",
        facitilyPanelHoursOpenForText: "@es@ Hours Open For:",
        facitilyPanelManagementUnitText: "@es@ Management Unit:",
        facitilyPanelMarinaText: "@es@ Facility Type:",
        directionCurrentLocationText: "@es@ My Location",
        directionTextDistance: "@es@ Distance:",
        directionTextTime: "@es@ Duration:",
        activityTabName: "@es@ Events",
        activityListTabName: "@es@ My List",
        fromDateText: "@es@ From Date",
        toDateText: "@es@ To Date",
        gobuttonText: "@es@ Go",
        noLegendAvailable: "@es@ No Legend Available.",
        loadingText: "@es@ Loading...",
        galleryInfoTitle: "@es@ Gallery",
        informationTitle: "@es@ Information",
        commentInfoTitle: "@es@ Comments",
        backToMapText: "@es@ BACK TO MAP",
        orderByDate: "@es@ Order by Date",
        carouselUtilitiesText: "@es@ utilities",
        addToListTitle: "@es@ Add to list"
    },
    errorMessages: {
        invalidSearch: "No hay resultados",
        falseConfigParams: "Valores clave de configuración requeridos son null o no coincida exactamente con los atributos de capa, este mensaje puede aparecer varias veces.",
        invalidLocation: "@es@ Current location not found.",
        invalidProjection: "@es@ Unable to plot current location on the map.",
        widgetNotLoaded: "@es@ Unable to load widgets.",
        shareLoadingFailed: "@es@ Unable to shorten URL, Bit.ly failed to load.",
        shareFailed: "@es@ Unable to share.",
        imageDoesNotFound: "@es@ There are no photo available.",
        facilitydoestfound: "@es@ No facilities found in buffer area.",
        noCommentAvaiable: "@es@ No Comment available",
        routeComment: "@es@ Route could not be calculated from current location.",
        activityNotSelected: "@es@ Please select activity to search.",
        activityPlannerInvalidToDate: "@es@ Please select valid To date",
        activityPlannerInvalidFromDate: "@es@ Please select valid From date",
        activityPlannerInvalidDates: "@es@ Please select the valid date",
        commentString: "@es@ Please enter comment",
        maxLenghtCommentstring: "@es@ Comment should not exceed 250 characters .",
        commentError: "@es@ Unable to add comments. Comments table is either absent or does not have write acccess .",
        addedActivities: "@es@ All activities within specified date range are already added to the My List.",
        activitySerachGeolocationText: "@es@ Geolocation is not supported in selected browser.",
        portalUrlNotFound: "@es@ Portal URL cannot be empty",
        activityAlreadyadded: "@es Activity is already added"
    },
    notUsed: {
        addressDisplayText: "@es@ Address",
        backToMap: "@es@ Back to map"
    }
});
