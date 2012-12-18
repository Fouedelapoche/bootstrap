// Mock up $transition service
angular.module('mockTransition', []).factory('$transition', function() {
  $transition = jasmine.createSpy('$transition').andReturn( jasmine.createSpyObj('transition promise', ['then', 'cancel'])).andCallThrough();
  return $transition;
});

describe('accordion', function () {
  var $scope;

  beforeEach(module('mockTransition'));
  beforeEach(module('ui.bootstrap.accordion'));
  beforeEach(module('template/accordion/accordion-group.html'));

  beforeEach(inject(function ($rootScope) {
    $scope = $rootScope;
  }));

  describe('controller', function () {

    var ctrl;
    beforeEach(inject(function($controller) {
      ctrl = $controller('AccordionController', { $scope: $scope });
    }));

    describe('addGroup', function() {
      it('adds a the specified group to the collection', function() {
        var group1, group2;
        ctrl.addGroup(group1 = $scope.$new());
        ctrl.addGroup(group2 = $scope.$new());
        expect(ctrl.groups.length).toBe(2);
        expect(ctrl.groups[0]).toBe(group1);
        expect(ctrl.groups[1]).toBe(group2);
      });
    });

    describe('closeOthers', function() {
      it('should close other groups', function() {
        var group1, group2, group3;
        ctrl.addGroup(group1 = jasmine.createSpyObj('group1', ['close', '$on']));
        ctrl.addGroup(group2 = jasmine.createSpyObj('group2', ['close', '$on']));
        ctrl.addGroup(group3 = jasmine.createSpyObj('group3', ['close', '$on']));
        ctrl.closeOthers(group2);
        expect(group1.close).toHaveBeenCalled();
        expect(group2.close).not.toHaveBeenCalled();
        expect(group3.close).toHaveBeenCalled();
      });
    });

    describe('removeGroup', function() {
      it('should remove the specified group', function () {
        var group1, group2, group3;
        ctrl.addGroup(group1 = $scope.$new());
        ctrl.addGroup(group2 = $scope.$new());
        ctrl.addGroup(group3 = $scope.$new());
        ctrl.removeGroup(group2);
        expect(ctrl.groups.length).toBe(2);
        expect(ctrl.groups[0]).toBe(group1);
        expect(ctrl.groups[1]).toBe(group3);
      });
      it('should ignore remove of non-existing group', function () {
        var group1, group2;
        ctrl.addGroup(group1 = $scope.$new());
        ctrl.addGroup(group2 = $scope.$new());
        expect(ctrl.groups.length).toBe(2);
        ctrl.removeGroup({});
        expect(ctrl.groups.length).toBe(2);
      });
    });
  });

  describe('accordion-group', function () {

    var scope, $compile, $timeout, $transition;

    beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_) {
      scope = _$rootScope_;
      $compile = _$compile_;
      $timeout = _$timeout_;
    }));

    var element, groups;
    var findGroupLink = function (index) {
      return groups.eq(index).find('a').eq(0);
    };
    var findGroupBody = function (index) {
      return groups.eq(index).find('.accordion-body').eq(0);
    };

    describe('with static groups', function () {
      beforeEach(function () {
        var tpl =
          "<accordion>" +
            "<accordion-group heading=\"title 1\">Content 1</accordion-group>" +
            "<accordion-group heading=\"title 2\">Content 2</accordion-group>" +
            "</accordion>";
        element = angular.element(tpl);
        angular.element(document.body).append(element);
        $compile(element)(scope);
        scope.$digest();
        groups = element.find('.accordion-group');
      });
      afterEach(function() {
        element.remove();
      });

      it('should create accordion groups with content', function () {
        expect(groups.length).toEqual(2);
        expect(findGroupLink(0).text()).toEqual('title 1');
        expect(findGroupBody(0).text().trim()).toEqual('Content 1');
        expect(findGroupLink(1).text()).toEqual('title 2');
        expect(findGroupBody(1).text().trim()).toEqual('Content 2');
      });

      it('should change selected element on click', function () {
        findGroupLink(0).click();
        $timeout.flush();
        scope.$digest();
        expect(findGroupBody(0).height()).toBeGreaterThan(0);

        findGroupLink(1).click();
        $timeout.flush();
        scope.$digest();
        expect(findGroupBody(1).height()).toBeGreaterThan(0);
        expect(findGroupBody(0).height()).toBe(0);
      });

      it('should toggle element on click', function() {
        findGroupLink(0).click();
        $timeout.flush();
        scope.$digest();
        expect(findGroupBody(0).height()).toBeGreaterThan(0);
        findGroupLink(0).click();
        $timeout.flush();
        scope.$digest();
        expect(findGroupBody(0).height()).toBe(0);
      });
    });

    describe('with dynamic groups', function () {
      var model;
      beforeEach(function () {
        var tpl =
          "<accordion>" +
            "<accordion-group ng-repeat='group in groups' heading='{{group.name}}'>{{group.content}}</accordion-group>" +
          "</accordion>";
        element = angular.element(tpl);
        model = [
          {name: 'title 1', content: 'Content 1'},
          {name: 'title 2', content: 'Content 2'}
        ];

        $compile(element)(scope);
        scope.$digest();
      });

      it('should have no groups initially', function () {
        groups = element.find('.accordion-group');
        expect(groups.length).toEqual(0);
      });

      it('should have a group for each model item', function() {
        scope.groups = model;
        scope.$digest();
        groups = element.find('.accordion-group');
        expect(groups.length).toEqual(2);
        expect(findGroupLink(0).text()).toEqual('title 1');
        expect(findGroupBody(0).text().trim()).toEqual('Content 1');
        expect(findGroupLink(1).text()).toEqual('title 2');
        expect(findGroupBody(1).text().trim()).toEqual('Content 2');
      });

      it('should react properly on removing items from the model', function () {
        scope.groups = model;
        scope.$digest();
        groups = element.find('.accordion-group');
        expect(groups.length).toEqual(2);

        scope.groups.splice(0,1);
        scope.$digest();
        groups = element.find('.accordion-group');
        expect(groups.length).toEqual(1);
      });
    });

    describe('isOpen attribute', function() {
      beforeEach(function () {
        var tpl =
          "<accordion>" +
            "<accordion-group title=\"'title 1'\" is-open=\"open1\">Content 1</accordion-group>" +
            "<accordion-group title=\"'title 2'\" is-open=\"open2\">Content 2</accordion-group>" +
            "</accordion>";
        element = angular.element(tpl);
        scope.open1 = false;
        scope.open2 = true;
        $compile(element)(scope);
        scope.$digest();
        $timeout.flush();
        groups = element.find('.accordion-group');
      });

      it('should open the group with isOpen set to true', function () {
        expect(findGroupBody(0).scope().isOpen).toBe(false);
        expect(findGroupBody(1).scope().isOpen).toBe(true);
       });
    });

  });
});