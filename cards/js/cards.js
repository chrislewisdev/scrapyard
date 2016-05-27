angular.module('cards', ['ngRoute'])
    .service('Collection', function($http, $q)
    {
        var self = this;
        
        self.requestHeaders = {"X-Mashape-Key":"VcJN1iKXCVmshlD4bo5VlLG5so94p1gFd6ojsnRNhvlTDetFLL"};
        
        //Storage for all currently displayed cards
        self.cards = [];
        //Storage for all valid classes
        self.classes = [];
        //True once we've loaded up our base information
        self.isInitialised = false;
        
        self.deferredLoading = $q.defer();
        
        //Initialise our list of classes
        $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/info',
        { headers: self.requestHeaders } )
        .then(function success(response)
        {
            //TODO: Any validation?
            
            self.classes = response.data.classes;
            
            //The 10th class is Dream, stupidly, while Neutral is not a class- so just shove it in there
            self.classes[self.classes.length - 1] = 'Neutral';
            
            self.deferredLoading.resolve();
            
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
                },
                function error(response)
                {
                    console.log('Unable to retrieve cards for ' + cardClass);
                });
            });
        },
        function error(response)
        {
            console.log('Unable to initialise :(');
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
    .controller('BrowserController', function($routeParams, $location, Collection)
    {
        var self = this;
        
        self.collection = Collection;
        
        //Our currently selected class
        self.currentClass = $routeParams.class;
        //Current page (starts at 0)
        self.currentPage = +$routeParams.pageNumber;
        //No. of cards to display on each page
        self.pageSize = 12;
        
        //Sanity-check our page no.
        if (self.currentPage < 0) self.currentPage = 0;
        
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
    })
    .filter('startFrom', function()
    {
        return function (input, start)
        {
            return input.slice(start);
        };
    });