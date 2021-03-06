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


/**
 * This class is handling the controller for the footer.
 *
 * @author Ann Shumilova
 */
export class CheFooterController {
  /**
   * Default constructor that is using resource
   * @ngInject for Dependency injection
   */
  constructor() {
  }

  /**
   * Returns 'Make a wish' email subject.
   *
   * @param productName
   * @returns {string}
   */
  getWishEmailSubject(productName: string): string {
    return this.getEmailSubject('Wishes for ' + productName);
  }

  /**
   * Returns formed subject for email.
   *
   * @param subject
   * @returns {string}
   */
  getEmailSubject(subject: string): string {
    return '?subject=' + encodeURIComponent(subject);
  }
}


