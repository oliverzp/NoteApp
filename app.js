var app = angular.module('noteApp', []);

app.controller('MainController', ['$scope', 'postItFactory', function($scope, postItFactory) {
    /* Holds a list of all the note IDs in an array. */
    $scope.postIts = postItFactory.get('postIts') || [];
    /* Possible colors. getNextColor will cycle through array and return the
        next color of a note */
    $scope.colors = ['#FCF793', '#9DE4F8', '#F9AA45', '#C4E42F', '#FF9A9C'];
    /* Edit mode status and message to display. */
    $scope.editMode = false;
    $scope.editMessage = 'Edit';
    $scope.getNextColor = function() {
        if ($scope.postIts.length == 0) {
            return $scope.colors[0];
        }
        var prevColor = postItFactory.get($scope.postIts[$scope.postIts.length - 1]).color;
        var i = $scope.colors.indexOf(prevColor);
        return $scope.colors[(i + 1) % $scope.colors.length];
    };
    /* Add a new note. */
    $scope.add = function () {
        var newPostIt = {
            id: $scope.postIts[$scope.postIts.length - 1] + 1 || 0,
            text: '',
            color: $scope.getNextColor()
        };
        postItFactory.set(newPostIt.id, newPostIt);
        $scope.postIts.push(newPostIt.id);
        postItFactory.set('postIts', $scope.postIts);
    };
    /* Delete a note with a specified ID. */
    $scope.delete = function (id) {
        var i = $scope.postIts.indexOf(id);
        var temp = $scope.postIts.splice(0, i);
        $scope.postIts = temp.concat($scope.postIts.splice(1));
        postItFactory.set('postIts', $scope.postIts);
        postItFactory.remove(id);
    };
    /* Switches between edit mode and non-edit mode. */
    $scope.edit = function() {
        $scope.editMode = !$scope.editMode;
        if ($scope.editMode) {
            $scope.editMessage = 'Done';
        } else {
            $scope.editMessage = 'Edit'
        }
    }
}]);

app.directive('postIt', function(postItFactory) {
    return {
        restrict: 'E',
        scope: {
            id: '='
        },
        templateUrl: 'postIt.html',
        link: function (scope, elem, attrs) {
            /* Each postIt has ID, color, and text fields.
                scope.id already set in HTML attr.
                Initialize note here. */
            var postIt = postItFactory.get(scope.id);
            scope.text = postIt.text;
            scope.color = postIt.color;
            /* Save the current state of a postIt. */
            scope.save = function() {
                /* Indices are found by looking at template
                    HTML. Also second expression is a Firefox hack */
                var curText = elem[0].children[0].children[0].innerText ||
                elem[0].children[0].children[0].innerHTML.replace(new RegExp('<br>', 'g'), '\n');
                var newPostIt = {
                    id: scope.id,
                    text: curText,
                    color: scope.color
                };
                postItFactory.set(scope.id, newPostIt);
            }
            /* Delete this note. */
            scope.delete = function() {
                scope.$parent.delete(scope.id);
            };
            /* Cycle the color of a postIt. */
            scope.getNextColor = function() {
                var colors = scope.$parent.colors;
                scope.color =  colors[(colors.indexOf(scope.color) + 1) % colors.length];
                scope.save();
            };
            /* This functions calls the save function
                after a user is done typing. It waits 0.5
                seconds after user has finished pressing keys. */
            function saveManager(func) {
                var timeout = null;
                return function () {
                    if (timeout != null) {
                        clearTimeout(timeout);
                        timeout = null;
                    };
                    var context = this, args = arguments;
                    timeout = setTimeout(function() {
                        timeout = null;
                        func.apply(context, args)
                    }, 500);
                }
            }
            /* Binding saves to after user has finished typing. */
            elem[0].addEventListener('keypress', saveManager(scope.save));
        }
    };
});

app.factory('postItFactory', function() {
    return {
        set: function(id, object) {
            if (typeof id == 'number') {
                localStorage.setItem('note' + id, JSON.stringify(object));
            } else {
                localStorage.setItem(id, JSON.stringify(object));
            }
        },
        get: function (item) {
            var r;
            if (typeof item == 'number') {
                r = localStorage.getItem('note' + item);
            } else {
                r = localStorage.getItem(item);
            }
            if (r == null) {
                return null;
            }
            return JSON.parse(r);
        },
        remove: function (item) {
            if (typeof item == 'number') {
                localStorage.removeItem('note' + item);
            } else {
                localStorage.removeItem(item);
            }
        }
    }
});