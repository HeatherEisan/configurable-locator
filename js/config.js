/*global define,dojo,dojoConfig,esri */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license -- is this key word required?
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
define([], function () {
    return {

        // This file contains various configuration settings for esri template
        //
        // Use this file to perform the following:
        //
        // 1.  Specify application Name                      - [ Tag(s) to look for: ApplicationName ]
        // 2.  Set path for application icon                 - [ Tag(s) to look for: ApplicationIcon ]
        // 3.  Set path for application favicon              - [ Tag(s) to look for: ApplicationFavicon ]
        // 4.  Set URL for help page                         - [ Tag(s) to look for: HelpURL ]
        // 5.  Set URL for Custom logo                       - [ Tag(s) to look for: CustomLogoUrl ]
        // 6.  Set proxy url                                 - [ Tag(s) to look for: ProxyUrl ]
        // 7.  Set Legend Visibility                         - [ Tag(s) to look for: ShowLegend ]
        // 8.  Set settings  for splash screen               - [ Tag(s) to look for: SplashScreen ]
        // 9.  Specify Theme                                 - [ Tag(s) to look for: ThemeColor ]
        // 10. Set initial map extent                        - [ Tag(s) to look for: DefaultExtent]
        // 11. Bottom Panel InfoPod Settings                 - [ Tag(s) to look for: PodSettings ]
        // 12. Customize zoom level for address search       - [ Tag(s) to look for: ZoomLevel ]
        // 13. Specify WebMap Id                             - [ Tag(s) to look for: WebMapId ]
        // 14. Specify URL to ArcGIS Portal REST API         - [ Tag(s) to look for: PortalAPIURL ]
        // 15. Specify the group title that contains basemaps- [ Tag(s) to look for: BasemapGroupTitle ]
        // 16. Specify the group name that contains basemaps - [ Tag(s) to look for: BasemapGroupOwner ]
        // 17. Specify spatial reference for basemaps        - [ Tag(s) to look for: BasemapSpatialReferenceWKID ]
        // 18. Specify path to display the thumbnail         - [ Tag(s) to look for: NoThumbnail ]
        // 19. Specify Activity SearchSettings               - [ Tag(s) to look for: ActivitySearchSettings]
        // 20. Specify Event SearchSettings                  - [ Tag(s) to look for: EventSearchSettings]
        // 21. Specify Ripple color settings                 - [ Tag(s) to look for: RippleColorSettings ]
        // 22. Specify Locator ripple size                   - [ Tag(s) to look for: LocatorRippleSize ]
        // 23. Customize InfoPopupHeight                     - [ Tag(s) to look for: InfoPopupHeight ]
        // 24. Customize InfoPopupWidth                      - [ Tag(s) to look for: InfoPopupWidth ]
        // 25. Specify Info Window setting                   - [ Tag(s) to look for: InfoWindowSetting ]
        // 26. Set URL for LocatorSettings                   - [ Tag(s) to look for: LocatorSettings ]
        // 27. Geometry service setting                      - [ Tag(s) to look for: GeometryService ]
        // 28. Specify Buffer Symbology                      - [ Tag(s) to look for: BufferSymbology ]
        // 29. Specify Buffer Distance                      -  [ Tag(s) to look for: Buffer Distance ]
        // 30. Customize Driving Direction Settings          - [ Tag(s) to look for: DrivingDirectionSettings]
        // 31. Specify URLs for map sharing                  - [ Tag(s) to look for: MapSharingOptions,TinyURLServiceURL, TinyURLResponseAttribute, FacebookShareURL, TwitterShareURL, ShareByMailLink ]
        // 32. Specify header widget settings                - [ Tag(s) to look for: AppHeaderWidgets ]

        // ------------------------------------------------------------------------------------------------------------------------
        // GENERAL SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set application title
        ApplicationName: "Configurable Locator",
        // Set application icon path
        ApplicationIcon: "/js/library/themes/images/logo.png",

        // Set application Favicon path
        ApplicationFavicon: "/js/library/themes/images/favicon.ico",

        // Set URL of help page/portal
        HelpURL: "help.htm",

        // Set custom logo url, displayed in lower left corner. Set to empty "" to disable.
        CustomLogoUrl: "/js/library/themes/images/nddotlogo.png",

        // Set proxy url
        ProxyUrl: "/proxy/proxy.ashx",

        // Set Legend Visibility
        ShowLegend: true,

        // Set splash window content - Message that appears when the application starts
        SplashScreen: {
            SplashScreenContent: "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
            IsVisible: true
        },

        // Set the application theme. Supported theme keys are blueTheme and greenTheme, orangeTheme, purpleTheme.
        ThemeColor: "js/library/themes/styles/blueTheme.css",


        // Initial map extent. Use comma (,) to separate values and don't delete the last comma
        // The coordinates must be specified in the basemap's coordinate system, usually WKID:102100, unless a custom basemap is used
        DefaultExtent: "-9991781.18961914, 4083344.0852194074, -9160146.321876464, 4494881.045506775",

        // Set the bottom Pod Toggle Button Text
        BottomPanelToggleButtonText: "Result",

        // Set the Search Panel Title
        SearchPanelTitle: "Search",

        // Set the Activity Panel Title
        ActivityPanelTitle: "Activity",

        // Set the Event Panel Title
        EventPanelTitle: "Event",

        // Set sequence for info pods in the bottom panel
        PodSettings: [{
            SearchResultPod: {
                Enabled: true
            }
        }, {
            FacilityInformationPod: {
                Enabled: true
            }
        }, {
            DirectionsPod: {
                Enabled: true
            }
        }, {
            GalleryPod: {
                Enabled: true
            }
        }, {
            CommentsPod: {
                Enabled: true
            }
        }],

        // Following zoom level will be set for the map upon searching an address
        ZoomLevel: 12,

        // Choose if you want to use WebMap or Map Services for operational layers. If using WebMap, specify WebMapId within quotes, otherwise leave this empty and configure operational layers
        WebMapId: "daa3eeae86954f4cba87c044466c4c2f",

        // ------------------------------------------------------------------------------------------------------------------------
        // BASEMAP SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set options for basemap
        // Please note: All base-maps need to use the same spatial reference.
        // Specify URL to ArcGIS Portal REST API. If you are using ArcGIS Online, leave this parameter as is.
        PortalAPIURL: "http://www.arcgis.com/sharing/rest/",

        // Specify the title of group that contains basemaps
        BasemapGroupTitle: "Basemaps",

        // Specify the user name of owner of the group that contains basemaps
        BasemapGroupOwner: "GISITAdmin",

        // Specify spatial reference for basemaps, since all basemaps need to use the same spatial reference
        BasemapSpatialReferenceWKID: 102100,

        // Specify path to image used to display the thumbnail for a basemap when portal does not provide it
        NoThumbnail: "js/library/themes/images/not-available.png",

        // ------------------------------------------------------------------------------------------------------------------------
        // ACTIVITY SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure search, barrier and info settings to be displayed in search panels:

        // Configure search and settings below.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        //        it should be the name of Map/Feature Service.
        // QueryLayerId: This is the layer index in the webmap or ArcGIS Map/Feature Service and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for search.
        ActivitySearchSettings: [{
            Enable: true,
            UnifiedSearch: "true",
            Title: "WaterAccess - Water Access Locations",
            QueryLayerId: "0",
            SearchDisplayTitle: "Activity",
            SearchDisplayFields: "${NAME}",
            SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')",
            DisplayDateFormat: "MMMM dd, yyyy",
            //Activities to be displayed in activity search and info window for a feature
            ActivityList: [{
                FieldName: "FOURWHEEL",
                Alias: "FourWheel",
                Image: "js/library/themes/images/activity/fourwheel.png",
                IsSelected: false
            }, {
                FieldName: "ELEHOOKUP",
                Alias: "Electric Hookup",
                Image: "js/library/themes/images/activity/electricHookup.png",
                IsSelected: false
            }, {
                FieldName: "WTRHOOKUP",
                Alias: "Water Hookup",
                Image: "js/library/themes/images/activity/waterHookup.png",
                IsSelected: false
            }, {
                FieldName: "RESTROOM",
                Alias: "Restrooms Available",
                Image: "js/library/themes/images/activity/restroomsAvail.png",
                IsSelected: true
            }, {
                FieldName: "FISHPIER",
                Alias: "Fishing Pier",
                Image: "js/library/themes/images/activity/fishingPier.png",
                IsSelected: false
            }, {
                FieldName: "CANOELAND",
                Alias: "Canoe Landing",
                Image: "js/library/themes/images/activity/canoeLanding.png",
                IsSelected: false
            }, {
                FieldName: "WINTERPOOL",
                Alias: "Winter Pool",
                Image: "js/library/themes/images/activity/winterPool.png",
                IsSelected: false
            }, {
                FieldName: "COURTDOCK",
                Alias: "Courtesy Dock",
                Image: "js/library/themes/images/activity/courtesyDock.png",
                IsSelected: false
            }, {
                FieldName: "BOATRENT",
                Alias: "Rental Available",
                Image: "js/library/themes/images/activity/forRent.png",
                IsSelected: false
            }, {
                FieldName: "BOATRAMP",
                Alias: "Boat Ramp",
                Image: "js/library/themes/images/activity/boatRamp.png",
                IsSelected: false
            }, {
                FieldName: "MARINA",
                Alias: "Marina",
                Image: "js/library/themes/images/activity/marina.png",
                IsSelected: false
            }, {
                FieldName: "FISHING",
                Alias: "Fishing",
                Image: "js/library/themes/images/activity/fishing.png",
                IsSelected: false
            }],
            // Specify field name used to be used as the primary key to relate activity to comment
            CommentsSettings: {
                //Set to true if comments need to be displayed , or false if not required
                Enabled: true,
                Title: "WaterAccess - Water Access Locations",
                QueryLayerId: "1",
                // Specify field name used to be used as the foreign key to relate comment to activity
                ForeignKeyFieldForActivity: "id",
                RankField: "${RANK}",
                SubmissionDateField: "${SUBMITDT}",
                DisplayDateFormat: "MMMM dd, yyyy",
                CommentField: "${COMMENTS}"
            }
        }],

        // ------------------------------------------------------------------------------------------------------------------------
        // Event SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure search, barrier and info settings to be displayed in search panels:

        // Configure search and settings below.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        //It should be the name of Map/Feature Service.
        // QueryLayerId: This is the layer index in the webmap or ArcGIS Map/Feature Service and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchDisplaySubFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for search.
        // DisplayDateFormat: Configure the date format.
        // AddToCalenderSettings: Configure the parameters to create the ics file for an event.

        EventSearchSettings: [{
            Enable: true,
            UnifiedSearch: "true",
            Title: "Events - Events",
            QueryLayerId: "0",
            SearchDisplayTitle: "Events",
            SearchDisplayFields: "${CATEGORY}",
            SearchDisplaySubFields: "${STARTDATE},${ADDRESS}",
            SearchExpressionForDate: "STARTDATE >= ${0} AND ENDDATE <= ${1}",
            SearchExpression: "UPPER(ADDRESS) LIKE UPPER('${0}%')",
            DisplayDateFormat: "MMMM dd, yyyy",
            AddToCalendarSettings: [{
                //Set the name of the ics file. This is a required key.
                IcsFileName: "${CATEGORY}",
                //Set the start date of the event in ics file. This is a required key.
                StartDate: "${STARTDATE}",
                //Set the End date of the event in ics file. This is a required key.
                EndDate: "${ENDDATE}",
                //Set the location of the event in ics file.
                Location: "${ADDRESS},${CITY},${STATE}",
                //Set the summary of the event in ics file.
                Summary: "${CATEGORY}",
                //Set the description of the event in ics file.
                Description: "${DESCRIPTION}",
                //Set the organizer of the event in ics file.
                Organizer: ""
            }]
        }],


        // Set the ripple color
        RippleColor: "35,35,142",

        // Set the locator ripple size(in pixels)
        LocatorRippleSize: 40,

        // Minimum height should be 270 for the info-popup in pixels
        InfoPopupHeight: 270,

        // Minimum width should be 330 for the info-popup in pixels
        InfoPopupWidth: 350,

        // ------------------------------------------------------------------------------------------------------------------------
        // GEOLOCATION SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set geolocation settings such as geolocation symbol, size
        GeoLocationSettings: {
            DefaultGeoLocationSymbol: "/js/library/themes/images/redpushpin.png",
            MarkupSymbolSize: {
                width: 35,
                height: 35
            }
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // ADDRESS SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set locator settings such as locator symbol, size, display fields, match score
        // LocatorParameters: Parameters(text, outFields, maxLocations, bbox, outSR) used for address and location search.
        // AddressSearch: Candidates based on which the address search will be performed.
        // AddressMatchScore: Setting the minimum score for filtering the candidate results.
        // MaxResults: Maximum number of locations to display in the results menu.
        LocatorSettings: {
            DefaultLocatorSymbol: "/js/library/themes/images/redpushpin.png",
            MarkupSymbolSize: {
                width: 35,
                height: 35
            },
            DisplayText: "Address",
            LocatorDefaultAddress: "4710 Mansford Rd, Winchester, TN, 37398",
            LocatorParameters: {
                SearchField: "SingleLine",
                SearchBoundaryField: "searchExtent"
            },
            LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            LocatorOutFields: ["Addr_Type", "Type", "Score", "Match_Addr", "xmin", "xmax", "ymin", "ymax"],
            DisplayField: "${Match_Addr}",
            AddressMatchScore: {
                Field: "Score",
                Value: 80
            },
            FilterFieldName: 'Addr_Type',
            FilterFieldValues: ["StreetAddress", "StreetName", "PointAddress", "POI"],
            MaxResults: 200
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // GEOMETRY SERVICE SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Set geometry service URL
        GeometryService: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",

        //Distance is configured in "miles"
        BufferDistance: "2",

        // Configure graphic color to be set for buffer
        BufferSymbology: {
            FillSymbolColor: "0,0,255",
            FillSymbolTransparency: "0.25",
            LineSymbolColor: "0,0,255",
            LineSymbolTransparency: "0.65"
        },


        // ------------------------------------------------------------------------------------------------------------------------
        // DRIVING DIRECTIONS SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // GetDirections: if variable is set to false directions cannot be enabled
        // RouteServiceURL: Set URL for routing service
        // RouteColor: Set color for route
        // RouteWidth: Set width for route
        // Transparency: Set transparency for route
        // RouteUnit: Set unit for route, units supported by Direction widget are “MILES”, “METERS”, “KILOMETERS”, “NAUTICAL_MILES”. If there is a Typo error in any of these four units then the unit will be displayed in “KILOMETERS”. If the unit is specified other than these four units then unit will be displayed in “MILES”
        DrivingDirectionSettings: {
            GetDirections: true,
            RouteServiceURL: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
            RouteColor: "0,0,225",
            RouteWidth: 6,
            Transparency: "0.5",
            RouteUnit: "MILES"
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // SETTINGS FOR MAP SHARING
        // ------------------------------------------------------------------------------------------------------------------------

        // Set URL for TinyURL service, and URLs for social media
        MapSharingOptions: {
            TinyURLServiceURL: "https://api-ssl.bitly.com/v3/shorten?longUrl=${0}",
            FacebookShareURL: "http://www.facebook.com/sharer.php?m2w&u=${0}&t=Configurable%20Locator",
            TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Configurable%20Locator ${0}",
            ShareByMailLink: "mailto:%20?subject=Check%20out%20this%20map!&body=${0}"
        },

        //------------------------------------------------------------------------------------------------------------------------
        // Header Widget Settings
        //-------------------default----------------------------------------------------------------------------------------------
        // Set widgets settings such as widget  widgetPath, mapInstanceRequired to be displayed in header panel
        // WidgetPath: path of the widget respective to the widgets package.

        AppHeaderWidgets: [{
            WidgetPath: "widgets/searchSetting/searchSetting"
        }, {
            WidgetPath: "widgets/myList/myList"
        }, {
            WidgetPath: "widgets/geoLocation/geoLocation"
        }, {
            WidgetPath: "widgets/share/share"
        }, {
            WidgetPath: "widgets/help/help"
        }]
    };
});
