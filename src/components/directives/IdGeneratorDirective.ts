import IAugmentedJQuery = angular.IAugmentedJQuery;
import IAttributes = angular.IAttributes;
import IDirective = angular.IDirective;
import IDirectiveFactory = angular.IDirectiveFactory;
import {isNotNullOrUndefined, stringEndsWith} from "../../common/utils/Utils";
import {IStateService} from "angular-ui-router";
import {IScope} from "../../common/IScopeService";

export class IdGeneratorDirective implements IDirective {

  restrict: string = "A";
  scope: any = {
    idTag: "="
  };

  public static factory(): IDirectiveFactory {
    let directive: IDirectiveFactory = ($state: IStateService) => {
      return new IdGeneratorDirective($state);
    };
    directive.$inject = ["$state"];
    return directive;
  }

  constructor(public $state: IStateService) {
  }

  public link: Function = ($scope: IScope, element: IAugmentedJQuery, attributes: IAttributes) => {
    element.attr("id", this.generateId(attributes));
    // TRY USING $OBSERVE INSTEAD OF WATCH!

    $scope.$observe("id-tag", (newVal) => {
      alert(newVal);
    });

    // debugger;
    // let x: any = this.scope.idTag;
    // this.count += 1;
    // if (this.count > 1) {
    //   debugger;
    //   let x: number = this.count;
    // }
    // element.removeAttr("id-generator");

    // $scope.$watch(attributes["id-tag"], (newValue, oldValue, scope) => {
    //   if (isNotNullOrUndefined(newValue)) {
    //     debugger;
    //     let x: Function = this.generateId;
    //     attributes["id-tag"]
    //     element.attr("id", this.generateId(attributes));
    //   }
    // });
  };

  private generateId(attributes: IAttributes): string {
    let id: string = this.$state.current.name + ".";
    for (let att of ["idTag", "type", "value"]) {
      if (isNotNullOrUndefined(attributes[att])) {
        id += attributes[att] + ".";
      }
    }

    if (stringEndsWith(id, ".")) {
      id = id.slice(0, -1);
    }
    return id.replace(/ /g, "_").toLowerCase();
  }
}

