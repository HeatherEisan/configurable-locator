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
    showNullValue: "N/A",
    showApproxString: " Approx",
    buttons: {
        okButtonText: "OK",
        email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Search",
        routeTooltips: "Driving Directions",
        locateTooltips: "Locate",
        shareTooltips: "Share",
        helpTooltips: "Help",
        eventsTooltips: "My List",
        clearEntryTooltips: "Clear",
        hidePanelTooltips: "Hide panel",
        showPanelTooltips: "Show panel",
        printButtonTooltips: "Print",
        closeTooltips: "Close",
        clearEntry: "Clear",
        search: "Search",
        routeForListTooltips: "Driving Directions - List Items",
        addToCalanderForListTooltips: "Add to Calendar - List Items",
        printForListTooltips: "Print - List Items",
        deleteFromListTooltips: "Delete from List",
        addToCalanderTooltips: "Add to Calendar",
        galleryInfoTooltips: "Gallery",
        informationTooltips: "Information",
        commentInfoTooltips: "Comments",
        addToListTooltips: "Add to My List"
    },
    titles: {
        webpageDisplayText: "Copy/Paste HTML into your web page",
        searchResultText: "Search Result",
        directionText: "Directions to",
        galleryText: "Gallery",
        commentText: "Comment",
        directionCurrentLocationText: "My Location",
        directionTextDistance: "Distance:",
        directionTextTime: "Duration:",
        activityListTabName: "My List",
        fromDateText: "From Date",
        toDateText: "To Date",
        goButtonText: "Go",
        noLegendAvailable: "No Legend Available",
        backToMapText: "Back to Map",
        orderByDate: "Order by Date",
        carouselUtilitiesText: "Utilities",
        addToListTitle: "Add to List",
        postComment: "Post Comment",
        rating: "Rating",
        backButton: "Back",
        submitButton: "Submit",
        postCommentText: "Enter Comment",
        numberOfFeaturesFoundNearAddress: "Found ${0} facility(ies) near the address",
        numberOfFoundFeatureNearAddress: "Found ${0} facility(ies)",
        numberOfFoundEventsNearAddress: "Found ${0} Event",
        facilityInfo: "Facility Info",
        infoWindowTextURL: "More info"
    },
    errorMessages: {
        invalidSearch: "No results found",
        falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times.",
        invalidLocation: "Current location not found.",
        invalidProjection: "Unable to project current location on map.",
        widgetNotLoaded: "Unable to load widgets.",
        shareLoadingFailed: "Unable to load share options.",
        shareFailed: "Unable to share.",
        imageDoesNotFound: "There are no photo available.",
        facilitydoestfound: "No facilities found in buffer area.",
        noCommentAvaiable: "No Comment available",
        activityPlannerInvalidToDate: "Please select valid To date",
        activityPlannerInvalidFromDate: "Please select valid From date",
        activityPlannerInvalidDates: "Please select the valid date",
        commentString: "Please Enter comment",
        maxLenghtCommentstring: "Comment should not exceed 250 characters .",
        commentError: "Unable to add comments. Comments table is either absent or does not have write acccess .",
        addedActivities: "All activities within specified date range are already added to the My List.",
        activitySerachGeolocationText: "Geolocation is not supported in selected browser.",
        portalUrlNotFound: "Portal URL cannot be empty",
        activityAlreadyadded: "This feature is already added to list",
        errorInQueringLayer: "Failed to query Comment layer",
        loadingText: "Loading...",
        noLegend: "No Legend Available.",
        noBasemap: "No Basemap Found",
        feildNotconfigure: "Feilds are not configured.",
        geolocationWidgetNotFoundMessage: "Geolocation widget is not configured.",
        routeDoesNotCreate: "Unable to route to these addresses",
        enablePodSettingsInConfig: "Please enable the PodSettings in Config."
    },
    notUsed: {
        addressDisplayText: "Address",
        backToMap: "Back to Map"
    },
    //end of shared nls

    //App nls
    appErrorMessage: {
        webmapTitleError: "Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls
});
