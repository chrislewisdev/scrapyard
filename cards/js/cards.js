angular.module('cards', ['ngRoute', 'ngSanitize'])
    .service('Collection', function($http, $q)
    {
        var self = this;
        
        self.requestHeaders = {"X-Mashape-Key":"VcJN1iKXCVmshlD4bo5VlLG5so94p1gFd6ojsnRNhvlTDetFLL"};
        
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

        /**
         * Processes an array of cards, merging them into our collection. 
         * Performs any data wrangling appropriate for our system.
         */
        self.ingestCards = function(newCards, ofClass)
        {
            newCards.forEach(function(card)
            {
                //Neutral cards have no playerClass property, so set it explicitly for consistency
                card.playerClass = ofClass;

                //Translate 'Free' cards to be Basic
                if (card.rarity === 'Free') card.rarity = 'Basic';

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
            $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/cards/classes/' + cardClass + '?collectible=1',
            { headers: self.requestHeaders } )
            .then(function success(response)
            {
                //TODO: Any validation?
                self.ingestCards(response.data, cardClass);
                
                //Resolve our promise for this class
                self.loadingSignals[cardClass].resolve();
            },
            function error(response)
            {
                self.loadingSignals[cardClass].reject(response);
            });
        });
    })
    .config(function($routeProvider)
    {
        $routeProvider
            .when('/:class/:pageNumber',
            {
                controller:'BrowserController as browser',
                templateUrl:'browser.html',
            })
            //In THEORY, we can't know if Druid is a real class until the API returns back. But meh.
            .otherwise({redirectTo:'/Druid/0'});
    })
    .controller('BrowserController', function($routeParams, $location, Collection, filterFilter)
    {
        var self = this;
        
        self.collection = Collection;
        
        //Our currently selected class
        self.currentClass = $routeParams.class;
        //Current page (starts at 0)
        self.currentPage = +$routeParams.pageNumber;
        //No. of cards to display on each page
        self.pageSize = 12;
        //Storage for the max no. of pages for our current search results.
        self.maxPage = 0;
        //Set to true once initialisation is complete.
        self.initialised = false;
        //Set to true if there was a loading error.
        self.error = false;
        
        /**
         * Gets the app path suitable for displaying the given class at the given page.
         */
        self.getPath = function(forClass, page)
        {
            return '/' + forClass + '/' + page;
        }
        
        /**
         * Sets the currently selected class to the given class.
         */
        self.setClass = function(toClass)
        {
            $location.path(self.getPath(toClass, 0));
        }
        
        /**
         * Returns true if the given class is our current class; false otherwise.
         */
        self.isCurrentClass = function(anyClass)
        {
            return (anyClass == self.currentClass);
        }
        
        /**
         * Returns true if there are any pages after our current one.
         */
        self.canPageForwards = function()
        {
            return self.initialised && self.currentPage < self.maxPage;
        }
        
        /**
         * Returns true if there are any pages before our current one.
         */
        self.canPageBackwards = function()
        {
            return self.initialised && self.currentPage > 0;
        }
        
        /**
         * Advances our view to the next page.
         */
        self.nextPage = function()
        {
            $location.path(self.getPath(self.currentClass, self.currentPage + 1));
        }
        
        /**
         * Sends our view back to the previous page.
         */
        self.previousPage = function()
        {
            $location.path(self.getPath(self.currentClass, self.currentPage - 1));
        }
        
        /**
         * Initialises our controller once the current class is loaded.
         */
        self.initialise = function()
        {
            self.maxPage = Math.floor(filterFilter(self.collection.cards, { playerClass: self.currentClass, type: '!hero' }).length / self.pageSize);
            
            //Sanity-check our page number.
            if (self.currentPage < 0) self.currentPage = 0;
            if (self.currentPage > self.maxPage) self.currentPage = self.maxPage;
            
            //Have we had to constrain our current page number? Redirect so the path reflects what we're displaying.
            if (self.currentPage != $routeParams.pageNumber)
            {
                $location.path(self.getPath(self.currentClass, self.currentPage));
            }
            
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
        if (self.collection.classes.indexOf(self.currentClass) === -1)
        {
            $location.path(self.collection.classes[0], 0);  //Redirect to something sensible.
        }
        else
        {
            self.collection.loadingSignals[self.currentClass].promise.then(self.initialise, self.onError);
        }
    })
    .filter('startFrom', function()
    {
        return function (input, start)
        {
            return input.slice(start);
        };
    });