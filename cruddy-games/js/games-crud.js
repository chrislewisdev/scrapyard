angular.module('games-crud', ['ngRoute', 'ngDialog'])
    //Define the Model service, which will contain our data that persists across controllers.
    .service('Model', function()
    {
        var self = this;
        var data = 
        [
            {
                name:'Halo',
                genre:'FPS',
                score:85
            },
            {
                name:'Rocket League',
                genre:'Racing',
                score:77
            },
            {
                name:'Hitman',
                genre:'Action',
                score:80
            }
        ];
        self.get = function()
        {
            return data;
        };
    })
    //Set up our routing for the index and edit pages.
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
            .when('/edit/:gameId',
            {
                controller:'EditController as editor',
                templateUrl:'edit.html',
                resolve:resolver
            })
            .otherwise({redirectTo:'/'});
    })
    //The ListController, used for the index page
    .controller('ListController', function(model)
    {
        var self = this;
        
        self.model = model;
    })
    //The EditController, used when editing or creating new objects
    .controller('EditController', function($location, $routeParams, ngDialog, model)
    {
        var self = this;
        
        self.gameId = $routeParams.gameId;
        self.isNew = (self.gameId === undefined);
        
        //New item? Initialise a fresh object.
        if (self.isNew)
        {
            self.game = 
            {
                name: '',
                genre: '',
                score: 100
            };
        }
        //Otherwise, create a copy of our target object to edit.
        else
        {
            self.target = model[self.gameId];
            self.game = 
            {
                name: self.target.name,
                genre: self.target.genre,
                score: self.target.score
            }
        }
        
        
        self.save = function()
        {
            //If it's new, append it to our model. If it's not, replace the old object.
            if (self.isNew)
            {
                model.push(self.game);
            }
            else
            {
                model[self.gameId] = self.game;
            }
            $location.path('/');
        };
        
        self.delete = function()
        {
            self.confirmAction('Delete', function()
            {
                model.splice(model.indexOf(self.game), 1);
                $location.path('/');
            });
        }
        
        self.cancel = function()
        {
            self.confirmAction('Cancel', function()
            {
                $location.path('/');
            });
        }
        
        //Opens a Yes/No dialog to perform an action, and if they click Yes, performs it.
        self.confirmAction = function(name, action)
        {
            return ngDialog.open(
            {
                template:'are-you-sure.html', 
                className:'ngdialog-theme-default',
                data:{action:name}
            })
            .closePromise.then(function(results)
            {
                //If they selected Yes, perform the action.
                if (results.value === true)
                {
                    action();
                }
            });
        }
    });