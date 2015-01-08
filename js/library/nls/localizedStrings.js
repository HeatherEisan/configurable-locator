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
    root: {
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
            printButtonooltips: "Print",
            closeTooltips: "Close",
            clearEntry: "Clear",
            search: "Search",
            routeForListTooltips: "Driving Directions - List Items",
            addToCalanderForListTooltips: "Add to Calendar - List Items",
            printForListTooltips: "Print - List Items",
            deleteFromListTooltips: "Delete from List",
            addToCalanderTooltips: "Add to Calander"
        },
        titles: {
            webpageDisplayText: "Copy/Paste HTML into your web page",
            serchResultText: "SEARCH RESULT",
            directionText: "DIRECTIONS TO",
            galleryText: "GALLERY",
            commentText: "COMMENT",
            directionCurrentLocationText: "My Location",
            directionTextDistance: "Distance:",
            directionTextTime: "Duration:",
            activityListTabName: "My List",
            fromDateText: "From Date",
            toDateText: "To Date",
            gobuttonText: "Go",
            facilityInfo: "facility info",
            postComment: "Post Comment",
            rating: "rating",
            backButton: "Back",
            submitButton: "Submit",
            postCommentText: "Enter comment",
            galleryInfoTitle: "Gallery",
            informationTitle: "Information",
            commentInfoTitle: "Comments",
            backToMapText: "BACK TO MAP",
            orderByDate: "Order by Date",
            carouselUtilitiesText: "utilities",
            numberOfFeaturesFoundNearAddress: "Found ${0} facility(ies) near the address",
            numberOfFoundFeatureNearAddress: "Found ${0} facility(ies)",
            numberOfFoundEventsNearAddress: "Found ${0} Event",
            addToListTitle: "Add to list",
            unifiedSearchTabText: "Search",
            activitySearchTabText: "Activity",
            eventSearchTabText: "Events",
            carouselPodToggleButtonText: "Result"
        },
        errorMessages: {
            invalidSearch: "No results found",
            falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times.",
            invalidLocation: "Current location not found.",
            invalidProjection: "Unable to plot current location on the map.",
            widgetNotLoaded: "Unable to load widgets.",
            shareLoadingFailed: "Unable to shorten URL, Bit.ly failed to load.",
            shareFailed: "Unable to share.",
            imageDoesNotFound: "No photos available.",
            facilitydoestfound: "No facilities found in buffer area.",
            noCommentAvaiable: "No comments available.",
            routeComment: "Route could not be calculated from current location.",
            activityNotSelected: "Please select activity to search.",
            activityPlannerInvalidToDate: "Please select valid To Date",
            activityPlannerInvalidFromDate: "Please select valid From Date",
            activityPlannerInvalidDates: "Please select the valid date",
            commentString: "Please enter comment",
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
            geolocationWidgetNotFoundMessage: "Geolocation widget is not configured."
        },
        //end of shared nls

         //App nls
        appErrorMessage: {
            webmapTitleError: "Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
        }
        //End of App nls
    },
    es: true,
    fr: true,
    it: true
});
