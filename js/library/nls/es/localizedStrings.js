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
    showApproxString: "@es@ Approx",
    buttons: {
        okButtonText: "@es@ OK",
        email: "correo electrónico",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Buscar",
        routeTooltips: "@es@ Driving Directions",
        locateTooltips: "Ubicación actual",
        shareTooltips: "Compartir",
        helpTooltips: "Ayuda",
        eventsTooltips: "@es@ My List",
        clearEntryTooltips: "@es@ Clear",
        hidePanelTooltips: "@es@ Hide panel",
        showPanelTooltips: "@es@ Show panel",
        printButtonooltips: "@es@ Print",
        closeTooltips: "@es@ Close",
        clearEntry: "@es@ Clear",
        search: "@es@ Search",
        routeForListTooltips: "@es@ Driving Directions - List Items",
        addToCalanderForListTooltips: "@es@ Add to Calendar - List Items",
        printForListTooltips: "@es@ Print - List Items",
        deleteFromListTooltips: "@es@ Delete from List",
        addToCalanderTooltips: "@es@ Add to Calander"
    },
    titles: {
        webpageDisplayText: "@es@ Copy/Paste HTML into your web page",
        serchResultText: "@es@ SEARCH RESULT",
        directionText: "@es@ DIRECTIONS TO",
        galleryText: "@es@ GALLERY",
        commentText: "@es@ COMMENT",
        directionCurrentLocationText: "@es@ My Location",
        directionTextDistance: "@es@ Distance:",
        directionTextTime: "@es@ Duration:",
        activityListTabName: "@es@ My List",
        fromDateText: "@es@ From Date",
        toDateText: "@es@ To Date",
        gobuttonText: "@es@ Go",
        noLegendAvailable: "@es@ No Legend Available.",
        galleryInfoTitle: "@es@ Gallery",
        informationTitle: "@es@ Information",
        commentInfoTitle: "@es@ Comments",
        backToMapText: "@es@ BACK TO MAP",
        orderByDate: "@es@ Order by Date",
        carouselUtilitiesText: "@es@ utilities",
        addToListTitle: "@es@ Add to list",
        unifiedSearchTabText: "@es@Search",
        activitySearchTabText: "@es@Activity",
        eventSearchTabText: "@es@Events",
        postComment: "@es@ Post Comment",
        rating: "@es@ rating",
        backButton: "@es@ Back",
        submitButton: "@es@ Submit",
        postCommentText: "@es@ Enter comment",
        numberOfFeaturesFoundNearAddress: "@es@ Found ${0} facility(ies) near the address",
        numberOfFoundFeatureNearAddress: "@es@ Found ${0} facility(ies)",
        numberOfFoundEventsNearAddress: "@es@ Found ${0} Event",
        facilityInfo: "@es@ facility info",
        carouselPodToggleButtonText: "@es@ Result"
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
        activityAlreadyadded: "@es@ This feature is already added to list",
        errorInQueringLayer: "@es@ Failed to query Comment layer",
        loadingText: "@es@ Loading...",
        noLegend: "@es@ No Legend Available.",
        noBasemap: "@es@ No Basemap Found",
        feildNotconfigure: "@es@ Feilds are not configured.",
        geolocationWidgetNotFoundMessage: "@es@ Geolocation widget is not configured."
    },
    notUsed: {
        addressDisplayText: "@es@ Address",
        backToMap: "@es@ Back to map"
    }, //end of shared nls

    //end of shared nls

    //App nls
    appErrorMessage: {
        webmapTitleError: "@es Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls
});
