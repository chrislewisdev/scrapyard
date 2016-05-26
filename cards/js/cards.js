angular.module('cards', [])
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
    .controller('BrowserController', function($http, Collection)
    {
        var self = this;
        
        self.collection = Collection;
        
        //Our currently selected class
        self.currentClass = null;
        
        //Wait for the collection to initialise if necessary before we do.
        if (!self.collection.isInitialised)
        {
            self.collection.deferredLoading.promise.then(function()
            {
                self.initialise();
            });
        }
        else
        {
            self.initialise();
        }
        
        /**
         * Initialises our current class selection to the first available class.
         */
        self.initialise = function()
        {
            self.currentClass = self.collection.classes[0];
        }
        
        /**
         * Sets the currently selected class to the given class.
         */
        self.setClass = function(toClass)
        {
            self.currentClass = toClass;
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
    });