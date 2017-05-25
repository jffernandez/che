/*
 * Copyright (c) 2015-2017 Codenvy, S.A.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Codenvy, S.A. - initial API and implementation
 */
'use strict';
import {CheStack} from '../../../../components/api/che-stack.factory';
import {CheEnvironmentRegistry} from '../../../../components/api/environment/che-environment-registry.factory';
import {EnvironmentManager} from '../../../../components/api/environment/environment-manager';
import {StackSelectorScope} from './stack-selector-scope.enum';
import {StackSelectorSvc} from './stack-selector.service';

/**
 * @ngdoc controller
 * @name workspaces.stack-selector.controller:StackSelector
 * @description This class is handling the controller of stack selector.
 * @author Oleksii Kurinnyi
 */

export class StackSelectorController {
  /**
   * Filter service.
   */
  $filter: ng.IFilterService;
  /**
   * Lodash library.
   */
  lodash: _.LoDashStatic;
  /**
   * Stack API interaction.
   */
  cheStack: CheStack;
  /**
   * Environments manager.
   */
  cheEnvironmentRegistry: CheEnvironmentRegistry;
  /**
   * Stack selector service.
   */
  stackSelectorSvc: StackSelectorSvc;
  /**
   * Stack scopes.
   */
  scope: Object;
  /**
   * If <code>true</code> then popover with filters should be shown.
   */
  showFilters: boolean;
  /**
   * Current scope to filter stacks.
   */
  selectedScope: number;
  /**
   * Search string to filter stacks.
   */
  searchString: string;
  /**
   * Field name to order stacks.
   */
  stackOrderBy: string;
  /**
   * The list of all stacks.
   */
  stacks: che.IStack[];
  /**
   * Lists of stacks by scope.
   */
  stacksByScope: {
    [scope: number]: Array<che.IStack>
  };
  /**
   * The list of filtered stacks.
   */
  stacksFiltered: che.IStack[];
  /**
   * Environment managers by recipe type.
   */
  environmentManagers: {
    [recipeType: string]: EnvironmentManager
  };
  /**
   * Selected stack ID.
   */
  selectedStackId: string;
  /**
   * Stack's icons
   */
  stackIconLinks: {
    [stackId: string]: string
  };
  /**
   * Stack's machines.
   */
  stackMachines: {
    [stackId: string]: Array<{[machineProp: string]: string|number}>
  };
  /**
   * Callback which should be called when stack is selected.
   */
  onStackSelect: (data: {stackId: string}) => void;

  private selectedTags: Array<string> = [];
  private allStackTags: Array<string> = [];
  private filteredStackIds: Array<string> = [];

  /**
   * Default constructor that is using resource injection
   * @ngInject for Dependency injection
   */
  constructor($filter: ng.IFilterService, lodash: _.LoDashStatic, cheStack: CheStack, cheEnvironmentRegistry: CheEnvironmentRegistry, stackSelectorSvc: StackSelectorSvc) {
    this.$filter = $filter;
    this.lodash = lodash;
    this.cheStack = cheStack;
    this.cheEnvironmentRegistry = cheEnvironmentRegistry;
    this.stackSelectorSvc = stackSelectorSvc;

    this.scope = StackSelectorScope;
    this.showFilters = false;
    this.selectedScope = StackSelectorScope.ALL;
    this.stackOrderBy = 'name';
    this.stacks = [];
    this.stacksByScope = {};
    this.stacksFiltered = [];
    this.environmentManagers = {};
    this.stackIconLinks = {};
    this.stackMachines = {};

    this.stackSelectorSvc.fetchStacks().then(() => {
      this.stacks = this.stackSelectorSvc.getStacks();
      this.updateMachines();
      this.buildStacksListsByScope();
      this.buildFilteredList();
      this.onTagsChanges();
    });
  }

  /**
   * Update filtered stack keys depends on tags.
   * @param tags {Array<string>}
   */
  onTagsChanges(tags?: Array<string>): void {
    if (!angular.isArray(tags) || !tags.length) {
      this.filteredStackIds = this.stacksFiltered.map((stack: che.IStack) => stack.id);
      if (this.stacksFiltered.length) {
        this.selectedStackId = this.stacksFiltered[0].id;
      }
      this._updateTags();
      return;
    }

    this.filteredStackIds = this.stacksFiltered.filter((stack: che.IStack) => {
      let stackTags = stack.tags.map((tag: string) => tag.toLowerCase());
      return tags.every((tag: string) => {
        return stackTags.indexOf(tag.toLowerCase()) !== -1;
      });
    }).map((stack: che.IStack) => stack.id);
    this.selectedStackId = this.filteredStackIds[0];
    this._updateTags();
  }

  /**
   * Update filter's tags.
   * @private
   */
  _updateTags(): void {
    this.allStackTags.length = 0;
    this.stacksFiltered.forEach((stack: che.IStack) => {
      if (!this.filteredStackIds.length || this.filteredStackIds.indexOf(stack.id) !== -1) {
        this.allStackTags = this.allStackTags.concat(stack.tags);
      }
    });
    this.allStackTags = this.lodash.uniq(this.allStackTags);
  }

  /**
   * For each stack get machines and for each machine cast memory limit to GB.
   * Get stack icons.
   */
  updateMachines(): void {
    this.stacks.forEach((stack: che.IStack) => {
      // get icon link
      const findLink = this.lodash.find(stack.links, (link: che.IStackLink) => {
        return link.rel === 'get icon link';
      });
      if (findLink) {
        this.stackIconLinks[stack.id] = findLink.href;
      }

      // get machines memory limits
      const defaultEnv = stack.workspaceConfig.defaultEnv,
            environment = stack.workspaceConfig.environments[defaultEnv],
            environmentManager = this.getEnvironmentManager(environment.recipe.type),
            machines = environmentManager.getMachines(environment);
      this.stackMachines[stack.id] = [];
      machines.forEach((machine: any) => {
        this.stackMachines[stack.id].push({
          name: machine.name,
          memoryLimitBytes: environmentManager.getMemoryLimit(machine)
        });
      });
    });
  }

  /**
   * Build lists of stacks separated by scope.
   */
  buildStacksListsByScope(): void {
    const scopes = StackSelectorScope.values();

    scopes.forEach((scope: StackSelectorScope) => {
      this.stacksByScope[scope] = this.$filter('stackScopeFilter')(this.stacks, scope, this.stackMachines);
    });
  }

  /**
   * Returns environment manager specified by recipe type.
   *
   * @param recipeType {string} recipe type
   * @return {EnvironmentManager}
   */
  getEnvironmentManager(recipeType: string): EnvironmentManager {
    if (!this.environmentManagers[recipeType]) {
      this.environmentManagers[recipeType] = this.cheEnvironmentRegistry.getEnvironmentManager(recipeType);
    }

    return this.environmentManagers[recipeType];
  }

  /**
   * Set specified stack ID as selected.
   *
   * @param stackId {string} stack ID
   */
  selectStack(stackId: string): void {
    this.selectedStackId = stackId;

    this.onStackSelect({stackId: stackId});

    this.stackSelectorSvc.onStackSelected(stackId);
  }

  /**
   * Callback on search query has been changed.
   *
   * @param searchString {string}
   */
  searchChanged(searchString: string): void {
    this.searchString = searchString;
    this.buildFilteredList();
  }

  /**
   * Callback on scope has been changed.
   */
  scopeChanged(): void {
    this.buildFilteredList();
  }

  /**
   * Rebuild list of filtered and sorted stacks. Set selected stack if it's needed.
   */
  buildFilteredList(): void {
    this.stacksFiltered.length = 0;
    this.stacksFiltered = this.stacksByScope[this.selectedScope];
    if (this.searchString) {
      this.stacksFiltered = this.$filter('stackSearchFilter')(this.stacksFiltered, this.searchString);
    }
    this.stacksFiltered = this.$filter('orderBy')(this.stacksFiltered, this.stackOrderBy);

    if (this.stacksFiltered.length === 0) {
      return;
    }
    // check if selected stack is shown or not
    const needSelectStack = this.lodash.every(this.stacksFiltered, (stack: che.IStack) => {
      return stack.id !== this.selectedStackId;
    });
    if (needSelectStack) {
      this.selectStack(this.stacksFiltered[0].id);
    }
  }

}
