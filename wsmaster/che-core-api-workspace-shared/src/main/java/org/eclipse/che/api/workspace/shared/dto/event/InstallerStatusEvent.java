/*******************************************************************************
 * Copyright (c) 2012-2017 Codenvy, S.A.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Codenvy, S.A. - initial API and implementation
 *******************************************************************************/
package org.eclipse.che.api.workspace.shared.dto.event;

import org.eclipse.che.dto.shared.DTO;
/**
 * @author Max Shaposhnik (mshaposhnik@codenvy.com)
 */
@DTO
public interface InstallerStatusEvent {

    enum EventType {
        STARTING,
        RUNNING,
        FAILED
    }


    InstallerStatusEvent.EventType getEventType();

    void setEventType(InstallerStatusEvent.EventType eventType);

    InstallerStatusEvent withEventType(InstallerStatusEvent.EventType eventType);


    String getInstallerName();

    void setInstallerName(String installerName);

    InstallerStatusEvent withInstallerName(String installerName);
    

    String getError();

    void setError(String error);

    InstallerStatusEvent withError(String error);
    

    String getTimestamp();

    void setTimestamp(String timestamp);

    InstallerStatusEvent withTimestamp(String timestamp);



}
