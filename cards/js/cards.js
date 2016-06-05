angular.module('cards', ['ngRoute'])
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
        //Promise that is resolved once we've finished loading our base information
        self.deferredLoading = $q.defer();
        
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
                response.data.forEach(function(card)
                {
                    //Neutral cards have no playerClass property, so set it explicitly for consistency
                    card.playerClass = cardClass;
                    self.cards.push(card);
                });
                
                //Resolve our promise for this class
                self.loadingSignals[cardClass].resolve();
            },
            function error(response)
            {
                console.log('Unable to retrieve cards for ' + cardClass);
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
         * Returns the appropriate CSS class for a class-button if it's selected; blank otherwise.
         */
        self.getButtonClass = function(ofClass)
        {
            if (ofClass == self.currentClass)
            {
                return 'button-primary';
            }
            else
            {
                return '';
            }
        }
        
        /**
         * Returns true if there are any pages after our current one.
         */
        self.canPageForwards = function()
        {
            return self.currentPage < self.maxPage;
        }
        
        /**
         * Returns true if there are any pages before our current one.
         */
        self.canPageBackwards = function()
        {
            return self.currentPage > 0;
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
        }
        
        //Make sure we're looking for a valid class before we initialise.
        if (self.collection.classes.indexOf(self.currentClass) === -1)
        {
            $location.path(self.collection.classes[0], 0);  //Redirect to something sensible.
        }
        else
        {
            self.collection.loadingSignals[self.currentClass].promise.then(self.initialise);
        }
    })
    .filter('startFrom', function()
    {
        return function (input, start)
        {
            return input.slice(start);
        };
    });