angular.module('games-crud', ['ngRoute'])
    .config(function($routeProvider)
    {
        $routeProvider
            .when('/',
            {
                controller:'ListController as list',
                templateUrl:'list.html',
            })
            .when('/new',
            {
                controller:'ListController as list',
                templateUrl:'edit.html',
            })
            .otherwise({redirectTo:'/'});
    })
    .controller('ListController', function()
    {
        
    });