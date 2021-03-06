angular.module('cards', ['ngRoute', 'ngSanitize'])
    .service('Cache', function()
    {
        var self = this;

        /**
         * Performs the actual work of updating local storage with the value retrieved by getter,
         * then invoking setter with that value.
         */
        self.updateValue = function(key, getter, setter)
        {
            getter().then(function(output)
            {
                localStorage.setItem(key, JSON.stringify(output));
                localStorage.setItem(key + "LastUpdated", new Date().getTime());
                setter(output);
            });
        }

        /**
         * Attempts to fetch a value associated with the given key from the cache. The provided getter/setter methods
         * must handle retrieving and using the value depending on whether it exists in the cache.
         * Use longevity to specify how long (in minutes) the cache should last before being refreshed.
         */
        self.fetch = function(key, longevity, getter, setter)
        {
            var cachedValue = localStorage.getItem(key);

            //Does the value exist? Check for pesky stringified nulls.
            if (cachedValue === undefined || cachedValue === null || cachedValue === "undefined" || cachedValue === "null")
            {
                self.updateValue(key, getter, setter);
            }
            else
            {
                setter(JSON.parse(cachedValue));

                //Check if the cached value needs updating.
                var lastUpdated = localStorage.getItem(key + "LastUpdated");
                var now = new Date().getTime();
                if (isNaN(lastUpdated) || now - lastUpdated > longevity * 1000)
                {
                    self.updateValue(key, getter, setter);
                }
            }
        }
    })
    .service('Collection', function($http, $q, Cache)
    {
        var self = this;
        
        self.requestHeaders = {"X-Mashape-Key":"VcJN1iKXCVmshlD4bo5VlLG5so94p1gFd6ojsnRNhvlTDetFLL"};

        self.storageKeys = 
        {
            cards: "cards",
            info: "info"
        };
        self.cacheLongevity = 3600;
        
        //Storage for all currently displayed cards
        self.cards = [];
        //Storage for all valid classes
        self.classes = 
        [
            'Druid',
            'Hunter',
            'Mage',
            'Paladin',
            'Priest',
            'Rogue',
            'Shaman',
            'Warlock',
            'Warrior',
            'Neutral'
        ];
        //Card set storage.
        self.sets = [];
        //The Hearthstone API returns a bunch of internal sets along with the 'real' ones. We need to exclude these.
        self.internalSets = 
        [
            'Credits',
            'Slush',
            'Missions',
            'Promo',
            'Reward',
            'System',
            'Hero Skins',
            'Tavern Brawl',
            'Debug'
        ];
        //Storage for our list of standard sets- retrieved from the API later
        self.standardSets = [];
        //Storage for all existing card rarities
        self.rarities = [];

        /**
         * Processes an array of cards, merging them into our collection. 
         * Performs any data wrangling appropriate for our system.
         */
        self.ingestCards = function(newCards, ofClass)
        {
            //Filter out any existing cards for this class
            self.cards = self.cards.filter(function (card)
            {
                return card.playerClass != ofClass;
            })

            newCards.forEach(function(card)
            {
                //Neutral cards have no playerClass property, so set it explicitly for consistency
                card.playerClass = ofClass;

                //Translate 'Free' cards to be Basic
                if (card.rarity === 'Free') card.rarity = 'Basic';

                //Filter out some internal card effect symbols
                if (card.text != null)
                {
                    card.text = card.text.replace(/[$#](\d+)/, "$1");
                    card.text = card.text.replace("[x]", "");
                }

                self.cards.push(card);
            });
        }
        
        //For each class, create a promise that will be resolved when it has finished loading.
        self.loadingSignals = {};
        self.classes.forEach(function(cardClass)
        {
            self.loadingSignals[cardClass] = $q.defer();
        });
        
        //Retrieve cards separately for each class (so we get results back sooner)
        self.classes.forEach(function(cardClass)
        {
            Cache.fetch(self.storageKeys.cards + cardClass, self.cacheLongevity, function()
                {
                    return $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/cards/classes/' + cardClass + '?collectible=1',
                        { headers: self.requestHeaders } )
                        .then(function success(response)
                        {
                            return response.data;
                        },
                        function error(response)
                        {
                            self.loadingSignals[cardClass].reject(response);
                        });
                },
                function(cards)
                {
                    //TODO: Any validation?
                    self.ingestCards(cards, cardClass);
                    
                    //Resolve our promise for this class
                    self.loadingSignals[cardClass].resolve();
                });
        });

        //Retrieve any generic collection info we need, e.g. current sets.
        Cache.fetch(self.storageKeys.info, self.cacheLongevity, function()
            {
                return $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/info/',
                    { headers: self.requestHeaders } )
                    .then(function success(response)
                    {
                        return response.data;
                    });
            },
            function(info)
            {
                //Include only the sets that aren't internal ones.
                self.sets = info.sets.filter(function(set)
                {
                    return self.internalSets.indexOf(set) < 0;
                });

                //Update our list of Standard sets
                self.standardSets = info.standard;

                //'Free' should refer to Free or Basic. For us, this is all classified as Basic.
                self.rarities = info.qualities;
                self.rarities[0] = 'Basic';
            }
        );
    })
    .service('ViewOptions', function()
    {
        var self = this;

        //Enum of possible image display modes
        self.displayModes = { none : 0, normal : 1, golden : 2 };
        //Storage for our current display mode.
        self.displayMode = self.displayModes.normal;
        //To show, or not to show filters
        self.showFilters = false;

        self.enableTextOnly = function()
        {
            self.displayMode = self.displayModes.none;
        }
        self.isTextOnly = function()
        {
            return self.displayMode === self.displayModes.none;
        }

        self.enableNormalImages = function()
        {
            self.displayMode = self.displayModes.normal;
        }
        self.isNormalImages = function()
        {
            return self.displayMode === self.displayModes.normal;
        }

        self.enableGoldenImages = function()
        {
            self.displayMode = self.displayModes.golden;
        }
        self.isGoldenImages = function()
        {
            return self.displayMode === self.displayModes.golden;
        }

        self.toggleShowFilters = function()
        {
            self.showFilters = !self.showFilters;
        }
        self.isShowingFilters = function()
        {
            return self.showFilters;
        }
    })
    .service('SearchOptions', function($routeParams, $location, filterFilter, $rootScope)
    {
        var self = this;

        var SearchTerm = function(name, value)
        {
            this.name = name;
            this.value = value;

            this.update = function(newValue)
            {
                this.value = newValue;
                $location.search(this.name, this.value);
            }
        }

        self.pageSize = 12;

        self.init = function()
        {
            self.class = $routeParams.class;

            self.page = new SearchTerm('page', isNaN(+$routeParams.page) ? 0 : +$routeParams.page);
            self.text = new SearchTerm('text', $routeParams.text == null ? '' : $routeParams.text);
            self.set = new SearchTerm('set', $routeParams.set == null ? '' : $routeParams.set);
            self.rarity = new SearchTerm('rarity', $routeParams.rarity == null ? '' : $routeParams.rarity);
            self.minimumCost = new SearchTerm('minimumCost', isNaN(+$routeParams.minimumCost) ? 0 : +$routeParams.minimumCost)
        }

        $rootScope.$on('$locationChangeSuccess', function()
        {
            self.init();
        });
    })
    .config(function($routeProvider)
    {
        $routeProvider
            .when('/:class',
            {
                controller:'BrowserController as browser',
                templateUrl:'browser.html',
                reloadOnSearch:false,
            })
            .otherwise({redirectTo:'/Druid'});
    })
    .controller('BrowserController', function($routeParams, $location, $rootScope, Collection, ViewOptions, classFilterFilter, searchFilterFilter, SearchOptions)
    {
        var self = this;
        
        self.collection = Collection;
        self.viewOptions = ViewOptions;
        self.searchOptions = SearchOptions;

        self.searchOptions.init();

        //Storage for the max no. of pages for our current search results.
        self.maxPage = 0;
        //Set to true once initialisation is complete.
        self.initialised = false;
        //Set to true if there was a loading error.
        self.error = false;
        //Our current filters.
        self.textFilter = self.searchOptions.text.value;
        self.setFilter = self.searchOptions.set.value;
        self.rarityFilter = self.searchOptions.rarity.value;
        self.minimumCostFilter = self.searchOptions.minimumCost.value;
        //An array of our current search results.
        self.currentResults = [];

        /**
         * Search functions for our various search options.
         */
        self.searchByText = function()
        {
            self.searchOptions.page.update(null);

            self.searchOptions.text.update(self.textFilter);

            self.initialise();
        }

        self.searchBySet = function()
        {
            self.searchOptions.page.update(null);

            self.searchOptions.set.update(self.setFilter);

            self.initialise();
        }

        self.searchByRarity = function()
        {
            self.searchOptions.page.update(null);

            self.searchOptions.rarity.update(self.rarityFilter);

            self.initialise();
        }

        self.searchByCost = function()
        {
            self.searchOptions.page.update(null);

            self.searchOptions.minimumCost.update(self.minimumCostFilter);

            self.initialise();
        }
        
        /**
         * Sets the currently selected class to the given class.
         */
        self.setClass = function(toClass)
        {
            self.searchOptions.page.update(null);
            $location.path('/' + toClass);
        }
        
        /**
         * Returns true if the given class is our current class; false otherwise.
         */
        self.isCurrentClass = function(cardClass)
        {
            return (cardClass == self.searchOptions.class);
        }

        /**
         * Returns true if our current results include any cards of the given class; false otherwise.
         */
        self.isClassYieldingCurrentResults = function(cardClass)
        {
            return classFilterFilter(searchFilterFilter(self.collection.cards), cardClass).length > 0;
        }
        
        /**
         * Returns true if there are any pages after our current one.
         */
        self.canPageForwards = function()
        {
            return self.initialised && self.searchOptions.page.value < self.maxPage;
        }
        
        /**
         * Returns true if there are any pages before our current one.
         */
        self.canPageBackwards = function()
        {
            return self.initialised && self.searchOptions.page.value  > 0;
        }
        
        /**
         * Advances our view to the next page.
         */
        self.nextPage = function()
        {
            self.searchOptions.page.update(self.searchOptions.page.value  + 1);
        }
        
        /**
         * Sends our view back to the previous page.
         */
        self.previousPage = function()
        {
            self.searchOptions.page.update(self.searchOptions.page.value  - 1);
        }
        
        /**
         * Initialises our controller once the current class is loaded.
         */
        self.initialise = function()
        {
            self.currentResults = searchFilterFilter(classFilterFilter(self.collection.cards, self.searchOptions.class));

            self.maxPage = Math.floor((self.currentResults.length - 1) / self.searchOptions.pageSize);
            if (self.maxPage < 0) self.maxPage = 0;

            //Sanity-check our page number.
            if (self.searchOptions.page.value > self.maxPage) self.searchOptions.page.update(self.maxPage);
            if (self.searchOptions.page.value < 0) self.searchOptions.page.update(0);

            self.textFilter = self.searchOptions.text.value;
            
            self.initialised = true;
        }

        /**
         * Alternate initialisation if we were unable to load up our data properly.
         */
        self.onError = function(response)
        {
            self.initialised = true;
            self.error = true;
            
            //Build up some rudimentary error info for some help diagnosing.
            self.errorInfo =
            {
                statusText: response.status > 0 ? response.status + ' ' + response.statusText : 'Unable to reach cards API',
                message: response.data ? response.data.message : 'None Available'
            };
        }
        
        //Make sure we're looking for a valid class before we initialise.
        if (self.collection.classes.indexOf(self.searchOptions.class) === -1)
        {
            $location.path(self.collection.classes[0]);  //Redirect to something sensible.
        }
        else
        {
            self.collection.loadingSignals[self.searchOptions.class].promise.then(self.initialise, self.onError);
        }
    })
    .filter('startFrom', function()
    {
        return function (input, start)
        {
            return input.slice(start);
        };
    })
    .filter('classFilter', function(SearchOptions, filterFilter)
    {
        return function (input, cardClass)
        {
            return filterFilter(input, { 'playerClass' : cardClass })
        };
    })
    .filter('searchFilter', function(SearchOptions, Collection, filterFilter)
    {
        return function (input)
        {
            var self = this;

            /**
             * Returns true if a card's text/name/race/type/rarity match our current search term.
             */
            self.matchesText = function(card)
            {
                var text = SearchOptions.text.value.toLowerCase();
                if (card.text != null && card.text.toLowerCase().indexOf(text) >= 0) return true;
                if (card.name != null && card.name.toLowerCase().indexOf(text) >= 0) return true;
                if (card.race != null && card.race.toLowerCase().indexOf(text) >= 0) return true;
                if (card.type != null && card.type.toLowerCase().indexOf(text) >= 0) return true;
                if (card.rarity != null && card.rarity.toLowerCase().indexOf(text) >= 0) return true;
                return false;
            };

            /**
             * Returns true if a card matches our current set restrictions, accounting for Standard formats.
             */
            self.matchesSet = function(card)
            {
                if (SearchOptions.set.value === '') return true;
                if (card.cardSet == SearchOptions.set.value) return true;
                if (SearchOptions.set.value === 'Standard' && Collection.standardSets.indexOf(card.cardSet) >= 0) return true;
                return false;
            }

            return filterFilter(input,
                                function(card)
                                {
                                    return card.type != 'Hero'
                                            && self.matchesSet(card)
                                            && self.matchesText(card)
                                            && (SearchOptions.rarity.value === '' || card.rarity == SearchOptions.rarity.value)
                                            && +card.cost >= +SearchOptions.minimumCost.value;
                                });
        }
    });