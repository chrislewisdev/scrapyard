angular.module('filter', [])
    .controller('FilterController', function()
    {
        var self = this;
        
        self.categories =
        [
            'Horror', 'Action', 'Romance', 'Comedy', 'Thriller', 'Noir'
        ];
        
        self.selectedCategories = [];
        
        //Set up a randomised selection of categories
        self.data = [];
        for (var i = 0; i < 15; i++)
        {
            self.data.push(self.categories[Math.floor(Math.random() * self.categories.length)]);
        }
        
        self.results = self.data;
        
        /**
         * If the given category is selected, returns a styling tag to mark a button as selected.
         */
        self.isSelected = function(category)
        {
            return self.selectedCategories.indexOf(category) != -1 ? '-primary' : '';
        };
        
        /**
         * Toggles the selection of the given category.
         */
        self.toggleSelection = function(category)
        {
            var index = self.selectedCategories.indexOf(category);
            if (index == -1)
            {
                self.selectedCategories.push(category);
            }
            else
            {
                self.selectedCategories.splice(index, 1);
            }
            
            self.filter();
        };
        
        /**
         * Updates our results to be filtered based on the current selected categories.
         */
        self.filter = function()
        {
            if (self.selectedCategories.length > 0)
            {
                self.results = [];
                for (var i = 0; i < self.data.length; i++)
                {
                    if (self.selectedCategories.indexOf(self.data[i]) != -1)
                    {
                        self.results.push(self.data[i]);
                    }
                }
            }
            else
            {
                self.results = self.data;
            }
        };
    });