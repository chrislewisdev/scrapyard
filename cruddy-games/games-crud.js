angular.module('games-crud', ['ngRoute'])
    .service('Model', function()
    {
        var self = this;
        var data = [];
        self.get = function()
        {
            return data;
        };
    })
    .config(function($routeProvider)
    {
        var resolver = 
        {
            model: function(Model)
            {
                return Model.get();
            }
        };
        
        $routeProvider
            .when('/',
            {
                controller:'ListController as list',
                templateUrl:'list.html',
                resolve:resolver
            })
            .when('/new',
            {
                controller:'EditController as editor',
                templateUrl:'edit.html',
                resolve:resolver
            })
            .otherwise({redirectTo:'/'});
    })
    .controller('ListController', function(model)
    {
        var self = this;
        
        self.model = model;
    })
    .controller('EditController', function($location, model)
    {
        var self = this;
        
        self.game = 
        {
            name: 'Rocket League',
            genre: 'Racing',
            score: 100
        };
        
        self.save = function()
        {
            model.push(self.game);
            $location.path('/');
        };
    });