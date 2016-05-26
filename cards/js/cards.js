angular.module('cards', [])
    //TODO: Define a service that holds all cards and provides access to them based on filtering
    .controller('TempController', function($http)
    {
        var self = this;
        
        //Storage for all currently displayed cards
        self.model = [];
        //Storage for all valid classes
        self.classes = [];
        //Our currently selected class
        self.currentClass = null;
        //Is true while we are doing any initial setup, false after
        self.isInitialising = true;
        
        //Initialise our list of classes
        $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/info',
        { headers: {"X-Mashape-Key":"VcJN1iKXCVmshlD4bo5VlLG5so94p1gFd6ojsnRNhvlTDetFLL"}})
        .then(function success(response)
        {
            self.classes = response.data.classes;
            self.currentClass = self.classes[0];
            self.isInitialising = false;
            self.load();
        },
        function error(response)
        {
            console.log('Unable to initialise :(');
        });
        
        this.setClass = function(toClass)
        {
            self.currentClass = toClass;
            self.load();
        }
        
        this.getButtonClass = function(ofClass)
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
        
        this.load = function()
        {
            $http.get('https://omgvamp-hearthstone-v1.p.mashape.com/cards/classes/' + self.currentClass + '?collectible=1', 
            {headers: {"X-Mashape-Key":"VcJN1iKXCVmshlD4bo5VlLG5so94p1gFd6ojsnRNhvlTDetFLL"}})
            .then(function success(response)
            {
                // console.log(response);
                self.model = response.data;
                console.log('Loaded up the JSON! You should see it now...');
            },
            function error(response)
            {
                console.log('Unable to contact Hearthstone JSON!');
            });
        }
    });